import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie'; 
import {
  Upload, Save, Phone, BookOpenCheck, MapPin, School, GraduationCap, UserCircle2, Check, X, Eye, EyeOff, Star, Camera, Trash2, Edit3, Loader2, Info, CheckCircle, Briefcase, Award, Clock
} from 'lucide-react';

// --- IMPORT THE STORAGE UTILITIES ---
import { setToLocalStorage, getFromLocalStorage } from '../utils/storage';

const TeacherProfileForm = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // State to hold the form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    qualifications: '',
    experienceYears: '',
    currentOccupation: '',
    subjectsTaught: [], // Array for multiple subjects
    boardsTaught: [],   // Array for multiple boards
    classesTaught: [],  // Array for multiple classes/courses
    teachingMode: '',
    availability: [],   // Changed from preferredSchedule to availability array
    bio: '',
    teachingApproach: '',
    achievements: [], // Stores achievements as a list
    hourlyRate: '',
    photo: null, // Stores File object
  });

  // State for new availability slot
  const [newSlot, setNewSlot] = useState({
    day: '',
    startTime: '',
    endTime: ''
  });

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // State to manage UI specific aspects
  const [uiState, setUiState] = useState({
    errors: {},
    isSubmitting: false,
    currentStep: 0,
    photoPreviewUrl: null, // Stores base64 URL for image preview
    savedDataTimestamp: null, // To indicate auto-save time
    subjectInput: '', // Input for adding new subjects
    boardInput: '', // Input for adding new boards
    classInput: '', // Input for adding new classes
    achievementInput: '', // Input for adding new achievements
    userLoaded: false, // Indicates if user data from localStorage has been loaded
    message: '', // For general messages (success, error)
    messageType: '', // 'success' | 'error'
    isSaving: false, // New state for auto-save visual feedback
  });

  // --- Derived State & Constants ---
  const steps = useMemo(() => [
    { title: 'Personal & Professional', fields: ['location', 'qualifications'], icon: UserCircle2 }, // Phone, experience, occupation are optional
    { title: 'Teaching Expertise', fields: ['subjectsTaught', 'boardsTaught', 'classesTaught', 'teachingMode', 'availability'], icon: BookOpenCheck }, // Updated to include availability
    { title: 'About My Teaching', fields: ['bio', 'teachingApproach'], icon: Edit3 } // Achievements, hourlyRate, photo are optional
  ], []); // Memoize steps array

  const currentStepFields = steps[uiState.currentStep]?.fields || [];

  // --- Handler Functions ---
  const handleSlotChange = (e) => {
    const { name, value } = e.target;
    setNewSlot(prev => ({ ...prev, [name]: value }));
  };

  const addAvailabilitySlot = () => {
    if (newSlot.day && newSlot.startTime && newSlot.endTime) {
      if (newSlot.startTime >= newSlot.endTime) {
        showMessage('End time must be after start time', 'error');
        return;
      }

      const hasOverlap = formData.availability.some(slot => 
        slot.day === newSlot.day && 
        (
          (newSlot.startTime >= slot.startTime && newSlot.startTime < slot.endTime) ||
          (newSlot.endTime > slot.startTime && newSlot.endTime <= slot.endTime) ||
          (newSlot.startTime <= slot.startTime && newSlot.endTime >= slot.endTime)
        )
      );

      if (hasOverlap) {
        showMessage('This time slot overlaps with an existing slot', 'error');
        return;
      }

      const newSlotWithId = { ...newSlot, id: Date.now() }; // Add ID for consistency
      setFormData(prev => ({
        ...prev,
        availability: [...prev.availability, newSlotWithId]
      }));
      setNewSlot({ day: '', startTime: '', endTime: '' });
      validateField('availability', [...formData.availability, newSlotWithId]);
    } else {
      showMessage('Please fill all slot fields', 'error');
    }
  };

  const removeAvailabilitySlot = (index) => {
    const updatedAvailability = formData.availability.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      availability: updatedAvailability
    }));
    if (currentStepFields.includes('availability')) {
      validateField('availability', updatedAvailability);
    }
  };

  // Refined isStepComplete to truly check required fields for the current step
  const isStepComplete = useCallback(() => {
    const currentStepHasErrors = currentStepFields.some(field => {
      // These fields are arrays and must have at least one item if they are 'required' for the step
      if (['subjectsTaught', 'boardsTaught', 'classesTaught'].includes(field)) {
        return formData[field].length === 0;
      }
      // Availability is required and must have at least one slot
      if (field === 'availability') {
        return formData.availability.length === 0;
      }
      // These are generally optional fields that don't block step completion unless they have validation errors
      if (['phone', 'experienceYears', 'currentOccupation', 'bio', 'teachingApproach', 'hourlyRate', 'photo'].includes(field)) {
        return false;
      }
      const value = formData[field];
      // Check for empty string or null for required fields.
      return !value?.trim() || !!uiState.errors[field];
    });
    return !currentStepHasErrors;
  }, [formData, currentStepFields, uiState.errors]);

  const progress = ((uiState.currentStep + 1) / steps.length) * 100;

  // --- Message/Toast Management ---
  const showMessage = useCallback((text, type = 'info', duration = 3000) => {
    setUiState(prev => ({ ...prev, message: text, messageType: type }));
    setTimeout(() => {
      setUiState(prev => ({ ...prev, message: '', messageType: '' }));
    }, duration);
  }, []);

  // --- Effects ---

  // Effect to load user data from localStorage on component mount
  useEffect(() => {
    const loadUserData = async () => {
      // First try to get from localStorage
      const storedUser = getFromLocalStorage('currentUser', null);
      if (storedUser && storedUser.role === 'teacher') {
        // Try to fetch fresh data from backend if token exists
        try {
          const token = localStorage.getItem('token');
          if (token) {
            const cleanToken = token.replace(/^"(.*)"$/, '$1');
            const response = await fetch('http://localhost:5000/api/profile/teacher', {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${cleanToken}`,
                'Content-Type': 'application/json'
              }
            });

            if (response.ok) {
              const profileData = await response.json();
              // Use backend data if available
              const teacherProfileData = profileData.teacherProfile || {};
              
              setFormData(prev => ({
                ...prev,
                firstName: profileData.firstName || storedUser.firstName || '',
                lastName: profileData.lastName || storedUser.lastName || '',
                email: profileData.email || storedUser.email || '',
                phone: teacherProfileData.phone || '',
                location: teacherProfileData.location || '',
                qualifications: teacherProfileData.qualifications || '',
                experienceYears: teacherProfileData.experienceYears || '',
                currentOccupation: teacherProfileData.currentOccupation || '',
                subjectsTaught: teacherProfileData.subjects || teacherProfileData.subjectsTaught || [],
                boardsTaught: teacherProfileData.boards || teacherProfileData.boardsTaught || [],
                classesTaught: teacherProfileData.classes || teacherProfileData.classesTaught || [],
                teachingMode: teacherProfileData.teachingMode || '',
                availability: teacherProfileData.availability || [], // Updated from preferredSchedule
                bio: teacherProfileData.bio || '',
                teachingApproach: teacherProfileData.teachingApproach || '',
                achievements: teacherProfileData.achievements || [],
                hourlyRate: teacherProfileData.hourlyRate || '',
              }));

              if (teacherProfileData.photoUrl) {
                setUiState(prev => ({
                  ...prev,
                  photoPreviewUrl: teacherProfileData.photoUrl
                }));
              }
            } else {
              // Fallback to localStorage data
              loadFromLocalStorage(storedUser);
            }
          } else {
            // No token, use localStorage
            loadFromLocalStorage(storedUser);
          }
        } catch (error) {
          console.warn('Failed to fetch from backend, using localStorage:', error);
          loadFromLocalStorage(storedUser);
        }
      }
      setUiState(prev => ({ ...prev, userLoaded: true }));
    };

    const loadFromLocalStorage = (storedUser) => {
      const teacherProfileData = storedUser.teacherProfileData || storedUser.teacherProfile || {};

      setFormData(prev => ({
        ...prev,
        firstName: storedUser.firstName || '',
        lastName: storedUser.lastName || '',
        email: storedUser.email || '',
        phone: teacherProfileData.phone || '',
        location: teacherProfileData.location || '',
        qualifications: teacherProfileData.qualifications || '',
        experienceYears: teacherProfileData.experienceYears || '',
        currentOccupation: teacherProfileData.currentOccupation || '',
        subjectsTaught: teacherProfileData.subjectsTaught || teacherProfileData.subjects || [],
        boardsTaught: teacherProfileData.boardsTaught || teacherProfileData.boards || [],
        classesTaught: teacherProfileData.classesTaught || teacherProfileData.classes || [],
        teachingMode: teacherProfileData.teachingMode || '',
        availability: teacherProfileData.availability || [], // Updated from preferredSchedule
        bio: teacherProfileData.bio || '',
        teachingApproach: teacherProfileData.teachingApproach || '',
        achievements: teacherProfileData.achievements || [],
        hourlyRate: teacherProfileData.hourlyRate || '',
      }));

      if (teacherProfileData.photoPreviewUrl || teacherProfileData.photoUrl) {
        setUiState(prev => ({
          ...prev,
          photoPreviewUrl: teacherProfileData.photoPreviewUrl || teacherProfileData.photoUrl
        }));
      }
    };

    loadUserData();
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (!uiState.userLoaded) return; // Don't auto-save before user data is loaded

    setUiState(prev => ({ ...prev, isSaving: true })); // Indicate saving in progress

    const timeoutId = setTimeout(() => {
      const storedUser = getFromLocalStorage('currentUser', null);
      if (storedUser && storedUser.role === 'teacher') {
        const dataToSave = { ...formData };
        if (uiState.photoPreviewUrl) {
          dataToSave.photoUrl = uiState.photoPreviewUrl;
        }
        delete dataToSave.photo;

        const updatedUser = {
          ...storedUser,
          firstName: formData.firstName,
          lastName: formData.lastName,
          teacherProfileData: {
            ...storedUser.teacherProfileData,
            ...dataToSave
          }
        };
        // --- REPLACED localStorage.setItem with setToLocalStorage ---
        setToLocalStorage('currentUser', updatedUser);
        setUiState(prev => ({ ...prev, savedDataTimestamp: new Date().toLocaleTimeString(), isSaving: false }));
      }
    }, 2000);

    return () => {
      clearTimeout(timeoutId);
      setUiState(prev => ({ ...prev, isSaving: false }));
    };
  }, [formData, uiState.userLoaded, uiState.photoPreviewUrl]);// Depend on formData and photoPreviewUrl


  // --- Validation ---
  const validateField = useCallback((name, value) => {
    let error = '';
    switch (name) {
      case 'firstName':
      case 'lastName':
        if (!value.trim()) {
          error = 'This field is required';
        }
        break;
      case 'phone':
        if (value && !/^\+?[\d\s-()]{10,}$/.test(value)) {
          error = 'Please enter a valid phone number (min 10 digits).';
        }
        break;
      case 'location':
      case 'qualifications':
      case 'teachingMode':
        if (value && value.trim().length < 2) {
          error = `Please enter a valid ${name.replace(/([A-Z])/g, ' $1').toLowerCase()}.`;
        }
        break;
      case 'experienceYears':
        if (value && (isNaN(value) || value < 0)) {
          error = 'Please enter a valid number of years.';
        }
        break;
      case 'hourlyRate':
        if (value && (isNaN(value) || value <= 0)) {
          error = 'Please enter a valid hourly rate.';
        }
        break;
      case 'subjectsTaught':
      case 'boardsTaught':
      case 'classesTaught':
        if (value.length === 0) {
          error = `Please add at least one ${name.replace(/([A-Z])/g, ' $1').toLowerCase().replace('taught', ' to teach')}.`;
        }
        break;
      case 'availability':
        if (value.length === 0) {
          error = 'Please add at least one availability slot.';
        }
        break;
      default:
        break;
    }
    setUiState(prev => ({ ...prev, errors: { ...prev.errors, [name]: error } }));
    return error === '';
  }, []);


  const handleChange = useCallback((e) => {
    const { name, value, files } = e.target;

    if (name === 'photo' && files && files[0]) {
      const file = files[0];
      if (file.size > 1024 * 1024) { // 1 MB
        setUiState(prev => ({
          ...prev,
          errors: {
            ...prev.errors,
            photo: 'Please upload a photo under 1 MB.'
          }
        }));
        setFormData(prev => ({ ...prev, photo: null }));
        setUiState(prev => ({ ...prev, photoPreviewUrl: null }));
        return;
      } else {
        setUiState(prev => ({
          ...prev,
          errors: {
            ...prev.errors,
            photo: ''
          }
        }));
      }
      setFormData(prev => ({ ...prev, photo: file }));

      const reader = new FileReader();
      reader.onload = (e) => {
        setUiState(prev => ({ ...prev, photoPreviewUrl: e.target.result }));
      };
      reader.readAsDataURL(file);
    } else if (name === 'subjectInput') {
      setUiState(prev => ({ ...prev, subjectInput: value }));
    } else if (name === 'boardInput') {
      setUiState(prev => ({ ...prev, boardInput: value }));
    } else if (name === 'classInput') {
      setUiState(prev => ({ ...prev, classInput: value }));
    } else if (name === 'achievementInput') {
      setUiState(prev => ({ ...prev, achievementInput: value }));
    }
    else {
      setFormData(prev => ({ ...prev, [name]: value }));
      validateField(name, value);
    }
  }, [validateField]);

  // Generic add tag function
  const addTag = useCallback((tagName, inputStateName, fieldName) => {
    const inputValue = uiState[inputStateName].trim();
    if (inputValue && !formData[fieldName].some(item => item.text.toLowerCase() === inputValue.toLowerCase())) {
      setFormData(prev => ({
        ...prev,
        [fieldName]: [...prev[fieldName], { id: Date.now(), text: inputValue }]
      }));
      setUiState(prev => ({ ...prev, [inputStateName]: '' }));
      validateField(fieldName, [...formData[fieldName], { id: Date.now(), text: inputValue }]);
    }
  }, [formData, uiState, validateField]);

  // Generic remove tag function
  const removeTag = useCallback((id, fieldName) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: prev[fieldName].filter(item => item.id !== id)
    }));
    if (currentStepFields.includes(fieldName)) {
      validateField(fieldName, formData[fieldName].filter(item => item.id !== id));
    }
  }, [formData, validateField, currentStepFields]);


  const removePhoto = useCallback(() => {
    setFormData(prev => ({ ...prev, photo: null }));
    setUiState(prev => ({ ...prev, photoPreviewUrl: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    setUiState(prev => ({ ...prev, isSubmitting: true }));
    try {
      let token = localStorage.getItem('token');
      if (!token) {
        const token2 = sessionStorage.getItem('token') || (window.Cookies && window.Cookies.get && window.Cookies.get('token'));
        if (token2) {
          localStorage.setItem('token', token2);
          token = token2;
        } else {
          showMessage('Session expired. Please login again.', 'error');
          navigate('/login');
          return;
        }
      }
      const cleanToken = token.replace(/^"(.*)"$/, '$1');
      const form = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if ([
          'subjectsTaught', 'boardsTaught', 'classesTaught', 'achievements'
        ].includes(key) && Array.isArray(value)) {
          value.forEach((item, i) => form.append(`${key}[${i}]`, JSON.stringify(item)));
        } else if (key === 'goals' && Array.isArray(value)) {
          value.forEach((g, i) => form.append(`goals[${i}]`, g.text));
        } else if (key === 'availability' && Array.isArray(value)) {
          value.forEach((a, i) => form.append(`availability[${i}]`, JSON.stringify(a)));
        } else if (key === 'photo' && value) {
          form.append('photo', value);
        } else if (value !== null && value !== undefined) {
          form.append(key, value);
        }
      });
      const response = await fetch('http://localhost:5000/api/profile/teacher', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${cleanToken}`
        },
        body: form
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || `Server error: ${response.status}`);
      }
      const currentUser = getFromLocalStorage('currentUser') || {};
      const updatedUser = {
        ...currentUser,
        ...result.user,
        profileComplete: true,
        teacherProfileData: result.user.teacherProfile || currentUser.teacherProfileData,
        teacherProfile: result.user.teacherProfile || currentUser.teacherProfile
      };
      setToLocalStorage('currentUser', updatedUser);
      showMessage('Profile saved successfully!', 'success');
      setUiState(prev => ({ ...prev, currentStep: 0, isSubmitting: false }));
      setTimeout(() => {
        window.location.href = '/teacher/dashboard';
      }, 500);
    } catch (error) {
      showMessage(error.message || 'Failed to save profile. Please try again.', 'error');
    } finally {
      setUiState(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [formData, navigate, showMessage]);


  const handleNextStep = useCallback(() => {
    let currentStepHasErrors = false;
    currentStepFields.forEach(field => {
      // Special handling for array fields (subjectsTaught, boardsTaught, classesTaught, availability)
      if (['subjectsTaught', 'boardsTaught', 'classesTaught', 'availability'].includes(field)) {
        if (formData[field].length === 0) {
          validateField(field, []); // Force validation for empty array
          currentStepHasErrors = true;
        }
      } else if (!['phone', 'experienceYears', 'currentOccupation', 'bio', 'teachingApproach', 'achievements', 'hourlyRate', 'photo'].includes(field)) {
        const hasError = !validateField(field, formData[field]);
        if (hasError) currentStepHasErrors = true;
      }
    });

    if (currentStepHasErrors) {
      showMessage('Please complete all required fields in this step before proceeding.', 'error');
      return;
    }

    setUiState(prev => ({ ...prev, currentStep: Math.min(steps.length - 1, prev.currentStep + 1) }));
  }, [currentStepFields, formData, steps.length, validateField, showMessage]);


  const handlePreviousStep = useCallback(() => {
    setUiState(prev => ({ ...prev, currentStep: Math.max(0, prev.currentStep - 1) }));
  }, []);

  // Render method for a single input field
  const renderInputField = useCallback((label, name, type = 'text', icon, placeholder, isRequired = false, isTextArea = false) => {
    const value = formData[name];
    const error = uiState.errors[name];
    const inputClasses = `w-full p-4 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 ${error ? 'border-red-500 bg-red-50' : 'border-gray-300'
      } shadow-sm hover:shadow-md`;

    return (
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          {icon} {label} {isRequired && <span className="text-red-500">*</span>}
        </label>
        {isTextArea ? (
          <textarea
            name={name}
            value={value}
            onChange={handleChange}
            rows={4}
            className={inputClasses}
            placeholder={placeholder}
          />
        ) : (
          <input
            type={type}
            name={name}
            value={value}
            onChange={handleChange}
            onBlur={(e) => validateField(name, e.target.value)} // Validate on blur
            className={inputClasses}
            placeholder={placeholder}
          />
        )}
        {error && <p className="text-red-500 text-sm mt-1 animate-shake">{error}</p>}
      </div>
    );
  }, [formData, uiState.errors, handleChange, validateField]);

  // Render method for select input
  const renderSelectField = useCallback((label, name, icon, options, placeholder, isRequired = false) => {
    const value = formData[name];
    const error = uiState.errors[name];
    const selectClasses = `w-full p-4 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 ${error ? 'border-red-500 bg-red-50' : 'border-gray-300'
      } shadow-sm hover:shadow-md`;

    return (
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          {icon} {label} {isRequired && <span className="text-red-500">*</span>}
        </label>
        <select
          name={name}
          value={value}
          onChange={handleChange}
          onBlur={(e) => validateField(name, e.target.value)} // Validate on blur
          className={selectClasses}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="text-red-500 text-sm mt-1 animate-shake">{error}</p>}
      </div>
    );
  }, [formData, uiState.errors, handleChange, validateField]);

  // Render method for tag input
  const renderTagInputField = useCallback((label, name, inputStateName, icon, placeholder, isRequired = false) => {
    const tags = formData[name];
    const error = uiState.errors[name];
    const inputClasses = `flex-1 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 shadow-sm`;

    return (
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          {icon} {label} {isRequired && <span className="text-red-500">*</span>}
        </label>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            name={inputStateName}
            value={uiState[inputStateName]}
            onChange={handleChange}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag(name, inputStateName, name))}
            className={inputClasses}
            placeholder={placeholder}
          />
          <button
            type="button"
            onClick={() => addTag(name, inputStateName, name)}
            className="px-4 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors transform hover:scale-105 shadow-md"
          >
            Add
          </button>
        </div>
        {tags.length > 0 && (
          <div className="space-y-2 p-3 bg-violet-50 rounded-xl border border-violet-100">
            {tags.map((tag) => (
              <div key={tag.id} className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm">
                <span className="text-gray-700">{tag.text}</span>
                <button
                  type="button"
                  onClick={() => removeTag(tag.id, name)}
                  className="text-red-500 hover:text-red-700 transition-colors transform hover:scale-110"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
        {error && tags.length === 0 && <p className="text-red-500 text-sm mt-1 animate-shake">{error}</p>}
      </div>
    );
  }, [formData, uiState, handleChange, addTag, removeTag]);


  // If user data hasn't loaded yet, show a loading state
  if (!uiState.userLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-violet-50">
        <div className="flex items-center space-x-3 text-violet-600 text-lg font-medium animate-pulse">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header with progress */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-3xl p-8 mb-8 relative overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-sm"></div>
          <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-2">Teacher Profile</h1>
            <p className="text-violet-100 mb-4">Showcase your expertise and connect with students</p>

            {/* Progress bar */}
            <div className="w-full bg-white/20 rounded-full h-3 mb-4">
              <div
                className="bg-white rounded-full h-3 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>

            {/* Step indicators */}
            <div className="flex justify-between">
              {steps.map((step, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 transform scale-90 ${index <= uiState.currentStep ? 'bg-white text-violet-600 shadow-md scale-100' : 'bg-white/20 text-white/60'
                    }`}>
                    {index < uiState.currentStep ? <Check className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                  </div>
                  <span className="mt-2 text-xs sm:text-sm text-center">{step.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Global Message/Toast */}
        {uiState.message && (
          <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 p-4 rounded-xl shadow-lg z-50 flex items-center gap-3 animate-fade-in-up ${uiState.messageType === 'success' ? 'bg-green-500 text-white' :
            uiState.messageType === 'error' ? 'bg-red-500 text-white' :
              'bg-blue-500 text-white'
            }`}>
            {uiState.messageType === 'success' && <CheckCircle className="w-5 h-5" />}
            {uiState.messageType === 'error' && <X className="w-5 h-5" />}
            {uiState.messageType === 'info' && <Info className="w-5 h-5" />}
            <span className="font-semibold">{uiState.message}</span>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow-2xl rounded-3xl p-8 transform transition-all duration-300 hover:shadow-3xl">
              <div className="space-y-6">
                {/* Personal Info (Read-only from login) */}
                <div className="bg-violet-50 p-4 rounded-xl shadow-inner border border-violet-200">
                  <h3 className="font-semibold text-violet-700 mb-3 flex items-center gap-2">
                    <UserCircle2 className="w-5 h-5" /> Account Details
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">First Name</label>
                      <input
                        type="text"
                        value={formData.firstName}
                        disabled
                        className="w-full p-3 border rounded-lg bg-gray-100 cursor-not-allowed text-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Last Name</label>
                      <input
                        type="text"
                        value={formData.lastName}
                        disabled
                        className="w-full p-3 border rounded-lg bg-gray-100 cursor-not-allowed text-gray-700"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        disabled
                        className="w-full p-3 border rounded-lg bg-gray-100 cursor-not-allowed text-gray-700"
                      />
                    </div>
                  </div>
                </div>

                {/* Step 0: Personal & Professional Details */}
                {uiState.currentStep === 0 && (
                  <div className="space-y-6 animate-fade-in">
                    <h3 className="font-semibold text-gray-800 text-lg">Your Contact & Professional Info</h3>
                    {renderInputField('Phone Number', 'phone', 'tel', <Phone className="w-4 h-4 text-violet-600" />, 'e.g., +91 98765 43210', false)}
                    {renderInputField('Location', 'location', 'text', <MapPin className="w-4 h-4 text-violet-600" />, 'e.g., Kolkata, West Bengal — please include your locality for better accuracy', true)}
                    {renderInputField('Pin Code', 'pinCode', 'text', <MapPin className="w-4 h-4 text-violet-600" />, 'e.g., 700001', true)}
                    {renderInputField('Highest Qualification', 'qualifications', 'text', <GraduationCap className="w-4 h-4 text-violet-600" />, 'e.g., M.Sc. Physics, B.Tech CSE', true)}
                    <div className="grid md:grid-cols-2 gap-6">
                      {renderInputField('Years of Experience', 'experienceYears', 'number', <Briefcase className="w-4 h-4 text-violet-600" />, 'e.g., 5', false)}
                      {renderInputField('Current Occupation', 'currentOccupation', 'text', <Award className="w-4 h-4 text-violet-600" />, 'e.g., Full-time Teacher, Freelance Tutor', false)}
                    </div>
                  </div>
                )}

                {/* Step 1: Teaching Expertise */}
                {uiState.currentStep === 1 && (
                  <div className="space-y-6 animate-fade-in">
                    <h3 className="font-semibold text-gray-800 text-lg">Your Teaching Expertise</h3>
                    {renderTagInputField('Subjects You Teach', 'subjectsTaught', 'subjectInput', <BookOpenCheck className="w-4 h-4 text-violet-600" />, 'Add a subject, e.g., Mathematics', true)}
                    {renderTagInputField('Boards/Curriculums You Teach', 'boardsTaught', 'boardInput', <School className="w-4 h-4 text-violet-600" />, 'Add a board, e.g., CBSE, ICSE', true)}
                    {renderTagInputField('Classes/Courses You Teach', 'classesTaught', 'classInput', <GraduationCap className="w-4 h-4 text-violet-600" />, 'Add a class/course, e.g., Class 10, JEE Mains', true)}
                    {renderSelectField(
                      'Preferred Teaching Mode',
                      'teachingMode',
                      <UserCircle2 className="w-4 h-4 text-violet-600" />,
                      [
                        { value: "Teacher's place", label: "Teacher's place" },
                        { value: "Student's place", label: "Student's place" },
                        { value: 'Online', label: 'Online' }
                      ],
                      'Select teaching mode',
                      true
                    )}
                    {renderInputField('Medium of Instruction', 'medium', 'text', <BookOpenCheck className="w-4 h-4 text-violet-600" />, 'e.g., English, Hindi, Bengali', true)}
                    
                    {/* Weekly Availability Section */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-700 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-violet-600" /> Weekly Availability 
                        <span className="text-red-500">*</span>
                      </h4>
                      
                      <div className="grid md:grid-cols-3 gap-4">
                        <select
                          name="day"
                          value={newSlot.day}
                          onChange={handleSlotChange}
                          className="p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 shadow-sm"
                        >
                          <option value="">Select day</option>
                          {daysOfWeek.map(day => (
                            <option key={day} value={day}>{day}</option>
                          ))}
                        </select>
                        
                        <input
                          type="time"
                          name="startTime"
                          value={newSlot.startTime}
                          onChange={handleSlotChange}
                          className="p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 shadow-sm"
                          placeholder="Start time"
                        />
                        
                        <input
                          type="time"
                          name="endTime"
                          value={newSlot.endTime}
                          onChange={handleSlotChange}
                          className="p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 shadow-sm"
                          placeholder="End time"
                        />
                      </div>
                      
                      <button
                        type="button"
                        onClick={addAvailabilitySlot}
                        className="px-4 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors transform hover:scale-105 shadow-md"
                      >
                        Add Time Slot
                      </button>
                      
                      {formData.availability.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <h5 className="text-sm font-medium text-gray-600">Your Availability:</h5>
                          <div className="space-y-2 p-3 bg-violet-50 rounded-xl border border-violet-100">
                            {formData.availability.map((slot, index) => (
                              <div key={index} className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm">
                                <span className="font-medium text-gray-700">
                                  {slot.day}: {slot.startTime} - {slot.endTime}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeAvailabilitySlot(index)}
                                  className="text-red-500 hover:text-red-700 transition-colors transform hover:scale-110"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {uiState.errors.availability && (
                        <p className="text-red-500 text-sm animate-shake">{uiState.errors.availability}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 2: More About My Teaching */}
                {uiState.currentStep === 2 && (
                  <div className="space-y-6 animate-fade-in">
                    <h3 className="font-semibold text-gray-800 text-lg">Tell us more about your teaching</h3>
                    {renderInputField('Your Professional Bio', 'bio', 'text', <Edit3 className="w-4 h-4 text-violet-600" />, 'Share your teaching philosophy, experience highlights, etc.', false, true)}
                    {renderInputField('Your Teaching Approach', 'teachingApproach', 'text', <BookOpenCheck className="w-4 h-4 text-violet-600" />, 'How do you structure your classes? What makes your teaching unique?', false, true)}
                    {renderTagInputField('Achievements & Success Stories', 'achievements', 'achievementInput', <Star className="w-4 h-4 text-violet-600" />, 'Add an achievement, e.g., 90% students scored A+', false)}
                    {renderInputField('Expected Hourly Rate (INR)', 'hourlyRate', 'number', <Info className="w-4 h-4 text-violet-600" />, 'e.g., 500', false)}

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Camera className="w-4 h-4 text-violet-600" /> Profile Photo (Optional)
                      </label>
                      <div className="flex items-center gap-4">
                        {uiState.photoPreviewUrl && (
                          <div className="relative">
                            <img
                              src={uiState.photoPreviewUrl}
                              alt="Preview"
                              className="w-20 h-20 rounded-full object-cover border-4 border-violet-200 shadow-md"
                            />
                            <button
                              type="button"
                              onClick={() => removePhoto()}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors transform hover:scale-110 shadow-md"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        <input
                          type="file"
                          name="photo"
                          accept="image/*"
                          onChange={handleChange}
                          ref={fileInputRef}
                          className="flex-1 p-3 border border-gray-300 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 shadow-sm"
                        />
                        <p className="text-xs text-gray-500 mt-2">Please upload a profile photo under <span className="font-semibold">1 MB</span>.</p>
                        {uiState.errors.photo && (
                          <p className="text-xs text-red-500 mt-1">{uiState.errors.photo}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handlePreviousStep}
                    disabled={uiState.currentStep === 0 || uiState.isSubmitting}
                    className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 hover:shadow-md"
                  >
                    Previous
                  </button>

                  {uiState.currentStep < steps.length - 1 ? (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      disabled={!isStepComplete() || uiState.isSubmitting}
                      className="px-6 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 hover:shadow-md flex items-center gap-2 font-semibold"
                    >
                      Next
                      {isStepComplete() && <Check className="w-4 h-4" />}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={uiState.isSubmitting}
                      className="px-8 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 hover:shadow-lg flex items-center gap-2 font-semibold"
                    >
                      {uiState.isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          Submit Profile
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Auto-save indicator */}
            {(uiState.savedDataTimestamp || uiState.isSaving) && (
              <div className={`bg-green-50 border border-green-200 rounded-xl p-4 transition-all duration-300 ${uiState.isSaving ? 'animate-pulse-opacity' : 'animate-fade-in'}`}>
                <div className="flex items-center gap-2 text-green-700">
                  {uiState.isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span className="font-medium">{uiState.isSaving ? 'Saving...' : 'Auto-saved'}</span>
                </div>
                {uiState.savedDataTimestamp && <p className="text-green-600 text-sm mt-1">Last saved at {uiState.savedDataTimestamp}</p>}
              </div>
            )}

            {/* Preview Card */}
            <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Profile Preview
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 bg-violet-50 p-2 rounded-lg">
                  <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center flex-shrink-0">
                    {uiState.photoPreviewUrl ? (
                      <img src={uiState.photoPreviewUrl} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <UserCircle2 className="w-5 h-5 text-violet-600" />
                    )}
                  </div>
                  <span className="font-medium text-gray-800">{formData.firstName || 'First'}{formData.lastName ? ` ${formData.lastName}` : ''}</span>
                </div>
                {formData.location && (
                  <p><span className="font-medium text-violet-600">Location:</span> {formData.location}</p>
                )}
                {formData.qualifications && (
                  <p><span className="font-medium text-violet-600">Qualification:</span> {formData.qualifications}</p>
                )}
                {formData.experienceYears && (
                  <p><span className="font-medium text-violet-600">Experience:</span> {formData.experienceYears} years</p>
                )}
                {formData.subjectsTaught.length > 0 && (
                  <div>
                    <p className="font-medium text-violet-600">Subjects:</p>
                    <ul className="list-disc list-inside text-xs pl-2 text-gray-700">
                      {formData.subjectsTaught.map(subject => <li key={subject.id}>{subject.text}</li>)}
                    </ul>
                  </div>
                )}
                {formData.teachingMode && (
                  <p><span className="font-medium text-violet-600">Mode:</span> {formData.teachingMode}</p>
                )}
                {formData.availability.length > 0 && (
                  <div>
                    <p className="font-medium text-violet-600">Availability:</p>
                    <ul className="list-disc list-inside text-xs pl-2 text-gray-700">
                      {formData.availability.slice(0, 3).map((slot, index) => (
                        <li key={index}>{slot.day}: {slot.startTime}-{slot.endTime}</li>
                      ))}
                      {formData.availability.length > 3 && <li>+{formData.availability.length - 3} more...</li>}
                    </ul>
                  </div>
                )}
                {formData.hourlyRate && (
                  <p><span className="font-medium text-violet-600">Rate:</span> INR {formData.hourlyRate}/hr</p>
                )}
              </div>
            </div>

            {/* Tips Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-md">
              <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">Tips for a Great Profile</h3>
              <ul className="space-y-2 text-sm text-blue-700">
                <li>**Highlight Your Expertise:** Clearly list all subjects, boards, and classes you teach.</li>
                <li>**Set Clear Availability:** Add specific time slots when you're available to teach.</li>
                <li>**Professional Photo:** A clear, professional photo builds trust with potential students.</li>
                <li>**Detailed Bio:** Describe your teaching philosophy and what makes your approach unique.</li>
                <li>**List Achievements:** Share any success stories or notable achievements to stand out.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherProfileForm;