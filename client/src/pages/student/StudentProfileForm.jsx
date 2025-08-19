import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, Save, Phone, BookOpenCheck, MapPin, School, GraduationCap, UserCircle2, Check, X, Eye, EyeOff, Star, Camera, Trash2, Edit3, Loader2, Info, CheckCircle
} from 'lucide-react';

// --- IMPORT THE STORAGE UTILITIES ---
import { setToLocalStorage, getFromLocalStorage } from '../../utils/storage';

const StudentProfileForm = () => {
  const navigate = useNavigate();

  // State to hold the form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    learningInterest: '',
    location: '',
    mode: '',
    board: '',
    subject: '',
    photo: null, // Stores File object
    bio: '',
    goals: []
  });

  // State to manage UI specific aspects
  const [uiState, setUiState] = useState({
    errors: {},
    isSubmitting: false,
    showPreview: false, // Not explicitly used but kept for potential future use
    currentStep: 0,
    photoPreviewUrl: null, // Stores base64 URL for image preview
    savedDataTimestamp: null, // To indicate auto-save time
    goalInput: '', // Input for adding new goals
    userLoaded: false, // Indicates if user data from localStorage has been loaded
    message: '', // For general messages (success, error)
    messageType: '', // 'success' | 'error'
    isSaving: false, // New state for auto-save visual feedback
  });

  const fileInputRef = useRef(null);

  // --- Derived State & Constants ---
  const steps = useMemo(() => [
    { title: 'Contact & Location', fields: ['phone', 'location'], icon: Phone },
    { title: 'Learning Preferences', fields: ['learningInterest', 'mode', 'board', 'subject'], icon: BookOpenCheck },
    { title: 'More About You', fields: ['bio', 'goals', 'photo'], icon: Edit3 }
  ], []); // Memoize steps array

  // Define required fields for each step
  const stepRequiredFields = useMemo(() => ({
    0: ['location'], // Phone is now optional
    1: ['learningInterest', 'mode', 'board', 'subject'],
    2: [] // Bio, goals, photo are optional
  }), []);

  const currentStepFields = steps[uiState.currentStep]?.fields || [];

  // Refined isStepComplete to truly check required fields for the current step
  const isStepComplete = useCallback(() => {
    const requiredFieldsForCurrentStep = stepRequiredFields[uiState.currentStep] || [];
    const currentStepHasErrors = requiredFieldsForCurrentStep.some(field => {
      const value = formData[field];
      // Check for empty string or null/undefined, AND if validateField reports an error
      return !value?.trim() || !!uiState.errors[field];
    });
    return !currentStepHasErrors;
  }, [formData, uiState.currentStep, uiState.errors, stepRequiredFields]);

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
      const storedUser = getFromLocalStorage('currentUser', null);
      if (storedUser && storedUser.role === 'student') {
        let loaded = false;
        try {
          const token = localStorage.getItem('token');
          if (token) {
            const cleanToken = token.replace(/^"(.*)"$/, '$1');
            const response = await fetch('http://localhost:5000/api/profile/student', {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${cleanToken}`,
                'Content-Type': 'application/json'
              }
            });
            if (response.ok) {
              const profileData = await response.json();
              const studentProfile = profileData.studentProfile || {};
              setFormData(prev => ({
                ...prev,
                firstName: profileData.firstName || storedUser.firstName || '',
                lastName: profileData.lastName || storedUser.lastName || '',
                email: profileData.email || storedUser.email || '',
                phone: studentProfile.phone || '',
                location: studentProfile.location || '',
                learningInterest: (studentProfile.subjects && studentProfile.subjects[0]) || '',
                mode: studentProfile.mode || '',
                board: studentProfile.board || '',
                subject: studentProfile.grade || '',
                bio: studentProfile.bio || '',
                goals: (studentProfile.learningGoals ? studentProfile.learningGoals.map((g, i) => ({ id: i + 1, text: g })) : []),
              }));
              if (studentProfile.photoUrl) {
                setUiState(prev => ({
                  ...prev,
                  photoPreviewUrl: studentProfile.photoUrl
                }));
              }
              loaded = true;
            } else if (response.status === 404) {
              setFormData(prev => ({
                ...prev,
                firstName: storedUser.firstName || '',
                lastName: storedUser.lastName || '',
                email: storedUser.email || '',
              }));
              loaded = true;
            }
          }
        } catch (error) {}
        if (!loaded) {
          // fallback: always allow form to load for new users
          setFormData(prev => ({
            ...prev,
            firstName: storedUser.firstName || '',
            lastName: storedUser.lastName || '',
            email: storedUser.email || '',
          }));
        }
      }
      setUiState(prev => ({ ...prev, userLoaded: true }));
    };

    const loadFromLocalStorage = (storedUser) => {
      const studentProfile = storedUser.studentProfile || {};

      setFormData(prev => ({
        ...prev,
        firstName: storedUser.firstName || '',
        lastName: storedUser.lastName || '',
        email: storedUser.email || '',
        phone: studentProfile.phone || '',
        location: studentProfile.location || '',
        learningInterest: (studentProfile.subjects && studentProfile.subjects[0]) || '',
        mode: studentProfile.mode || '',
        board: studentProfile.board || '',
        subject: studentProfile.grade || '',
        bio: studentProfile.bio || '',
        goals: (studentProfile.learningGoals ? studentProfile.learningGoals.map((g, i) => ({ id: i + 1, text: g })) : []),
      }));

      if (studentProfile.photoUrl) {
        setUiState(prev => ({
          ...prev,
          photoPreviewUrl: studentProfile.photoUrl
        }));
      }
    };

    loadUserData();
  }, []);

  // Add this useEffect to load existing profile data around line 100
  useEffect(() => {
    const loadUserData = async () => {
      const storedUser = getFromLocalStorage('currentUser', null);
      if (storedUser && storedUser.role === 'student') {
        // Try to fetch fresh data from backend if token exists
        try {
          const token = localStorage.getItem('token');
          if (token) {
            const cleanToken = token.replace(/^"(.*)"$/, '$1');
            const response = await fetch('http://localhost:5000/api/profile/student', {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${cleanToken}`,
                'Content-Type': 'application/json'
              }
            });

            if (response.ok) {
              const profileData = await response.json();
              const studentProfile = profileData.studentProfile || {};
              
              setFormData(prev => ({
                ...prev,
                firstName: profileData.firstName || storedUser.firstName || '',
                lastName: profileData.lastName || storedUser.lastName || '',
                email: profileData.email || storedUser.email || '',
                grade: studentProfile.grade || '',
                subjects: studentProfile.subjects || [],
                parentEmail: studentProfile.parentEmail || '',
                phone: studentProfile.phone || '',
                location: studentProfile.location || '',
                learningGoals: studentProfile.learningGoals || [],
                preferredLearningStyle: studentProfile.preferredLearningStyle || '',
                bio: studentProfile.bio || ''
              }));

              if (studentProfile.photoUrl) {
                setUiState(prev => ({
                  ...prev,
                  photoPreviewUrl: studentProfile.photoUrl
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
      const studentProfile = storedUser.studentProfile || {};
      
      setFormData(prev => ({
        ...prev,
        firstName: storedUser.firstName || '',
        lastName: storedUser.lastName || '',
        email: storedUser.email || '',
        grade: studentProfile.grade || '',
        subjects: studentProfile.subjects || [],
        parentEmail: studentProfile.parentEmail || '',
        phone: studentProfile.phone || '',
        location: studentProfile.location || '',
        learningGoals: studentProfile.learningGoals || [],
        preferredLearningStyle: studentProfile.preferredLearningStyle || '',
        bio: studentProfile.bio || ''
      }));

      if (studentProfile.photoUrl) {
        setUiState(prev => ({
          ...prev,
          photoPreviewUrl: studentProfile.photoUrl
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
      // --- REPLACED localStorage.getItem with getFromLocalStorage ---
      const storedUser = getFromLocalStorage('currentUser', null);
      if (storedUser && storedUser.role === 'student') {
        const dataToSave = { ...formData };
        if (uiState.photoPreviewUrl) {
            dataToSave.photoPreviewUrl = uiState.photoPreviewUrl;
        } else {
            delete dataToSave.photoPreviewUrl;
        }
        delete dataToSave.photo; // Remove the File object

        const updatedUser = {
          ...storedUser,
          studentProfileData: {
            ...storedUser.studentProfileData,
            ...dataToSave
          }
        };
        // --- REPLACED localStorage.setItem with setToLocalStorage ---
        setToLocalStorage('currentUser', updatedUser);
        setUiState(prev => ({ ...prev, savedDataTimestamp: new Date().toLocaleTimeString(), isSaving: false }));
      }
    }, 2000); // Debounce auto-save by 2 seconds

    return () => {
      clearTimeout(timeoutId);
      setUiState(prev => ({ ...prev, isSaving: false })); // Clear saving indicator if effect cleans up
    };
  }, [formData, uiState.userLoaded, uiState.photoPreviewUrl]); // Depend on formData and photoPreviewUrl


  // --- Validation ---
  const validateField = useCallback((name, value) => {
    let error = '';
    // Determine if the field is required based on the current step's required fields.
    const isRequired = stepRequiredFields[uiState.currentStep]?.includes(name);

    switch (name) {
      case 'phone':
        if (value && !/^\+?[\d\s-()]{10,}$/.test(value)) {
          error = 'Please enter a valid phone number (min 10 digits).';
        }
        break;
      case 'learningInterest':
      case 'location':
      case 'mode':
      case 'board':
      case 'subject':
        if (isRequired && (!value || value.trim().length === 0)) {
          error = `This field is required.`;
        } else if (value && value.trim().length < 2) {
          error = `Please enter a valid ${name.replace(/([A-Z])/g, ' $1').toLowerCase()}.`;
        }
        break;
      case 'bio':
      case 'goals':
      case 'photo':
        // These fields are optional and don't have direct format validation here
        break;
      default:
        break;
    }
    setUiState(prev => ({ ...prev, errors: { ...prev.errors, [name]: error } }));
    return error === '';
  }, [uiState.currentStep, stepRequiredFields]);



  const handleChange = useCallback((e) => {
    const { name, value, files } = e.target;

    if (name === 'photo' && files && files[0]) {
      const file = files[0];
      if (file.size > 1048576) { // 1MB = 1048576 bytes
        showMessage('Profile photo must be under 1 MB.', 'error');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      setFormData(prev => ({ ...prev, photo: file }));
      const reader = new FileReader();
      reader.onload = (e) => {
        setUiState(prev => ({ ...prev, photoPreviewUrl: e.target.result }));
      };
      reader.readAsDataURL(file);
    } else if (name === 'goalInput') {
      setUiState(prev => ({ ...prev, goalInput: value }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      validateField(name, value);
    }
  }, [validateField, showMessage]);

  const addGoal = useCallback(() => {
    if (uiState.goalInput.trim()) {
      setFormData(prev => ({
        ...prev,
        goals: [...prev.goals, { id: Date.now(), text: uiState.goalInput.trim() }]
      }));
      setUiState(prev => ({ ...prev, goalInput: '' }));
    }
  }, [uiState.goalInput]);

  const removeGoal = useCallback((id) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.filter(goal => goal.id !== id)
    }));
  }, []);

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
      let token = getFromLocalStorage('token');
      if (!token) {
        showMessage('Session expired. Please login again.', 'error');
        navigate('/login');
        return;
      }
      // Remove any extra quotes from token
      if (typeof token === 'string') {
        token = token.replace(/^"|"$/g, '');
      }
      // Prepare all fields for backend
      const profileData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        location: formData.location,
        subject: formData.subject,
        learningInterest: formData.learningInterest,
        learningGoals: formData.goals.map(g => g.text),
        bio: formData.bio,
        photoUrl: uiState.photoPreviewUrl,
        mode: formData.mode,
        board: formData.board,
        subjects: formData.subjects || (formData.learningInterest ? [formData.learningInterest] : []),
      };
      const response = await fetch('http://localhost:5000/api/profile/student', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to save profile');
      }
      const updatedUser = {
        ...result.user,
        profileComplete: true
      };
      setToLocalStorage('currentUser', updatedUser);
      showMessage('Profile saved successfully!', 'success');
      setTimeout(() => navigate('/student/dashboard'), 1500);
    } catch (error) {
      showMessage(error.message || 'Failed to save profile', 'error');
      if ((error.message || '').toLowerCase().includes('token')) {
        navigate('/login');
      }
    } finally {
      setUiState(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [formData, uiState.photoPreviewUrl, navigate, showMessage]);


  const handleNextStep = useCallback(() => {
    // Validate current step's required fields only
    let currentStepHasErrors = false;
    const requiredFieldsForCurrentStep = stepRequiredFields[uiState.currentStep] || [];

    requiredFieldsForCurrentStep.forEach(field => {
      const hasError = !validateField(field, formData[field]);
      if (hasError) currentStepHasErrors = true;
    });

    if (currentStepHasErrors) {
      showMessage('Please complete all required fields in this step before proceeding.', 'error');
      return;
    }

    setUiState(prev => ({ ...prev, currentStep: Math.min(steps.length - 1, prev.currentStep + 1) }));
  }, [formData, steps.length, validateField, showMessage, uiState.currentStep, stepRequiredFields]);


  const handlePreviousStep = useCallback(() => {
    setUiState(prev => ({ ...prev, currentStep: Math.max(0, prev.currentStep - 1) }));
  }, []);

  // Render method for a single input field
  const renderInputField = useCallback((label, name, type = 'text', icon, placeholder, isRequired = false, isTextArea = false) => {
    const value = formData[name];
    const error = uiState.errors[name];
    const inputClasses = `w-full p-4 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 ${
      error ? 'border-red-500 bg-red-50' : 'border-gray-300'
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
    const selectClasses = `w-full p-4 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 ${
      error ? 'border-red-500 bg-red-50' : 'border-gray-300'
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
            <h1 className="text-4xl font-bold mb-2">Student Profile</h1>
            <p className="text-violet-100 mb-4">Tell us about yourself to get personalized learning recommendations</p>

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
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 transform scale-90 ${
                    index <= uiState.currentStep ? 'bg-white text-violet-600 shadow-md scale-100' : 'bg-white/20 text-white/60'
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
          <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 p-4 rounded-xl shadow-lg z-50 flex items-center gap-3 animate-fade-in-up ${
            uiState.messageType === 'success' ? 'bg-green-500 text-white' :
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

                {/* Step 0: Personal Info - Editable */}
                {uiState.currentStep === 0 && (
                  <div className="space-y-6 animate-fade-in">
                    <h3 className="font-semibold text-gray-800 text-lg">Contact & Location</h3>
                    {renderInputField('Phone Number', 'phone', 'tel', <Phone className="w-4 h-4 text-violet-600" />, 'e.g., +91 98765 43210', false)} {/* Phone is now optional */}
                    {renderInputField('Location', 'location', 'text', <MapPin className="w-4 h-4 text-violet-600" />, 'e.g., Kolkata, West Bengal', true)}
                  </div>
                )}

                {/* Step 1: Learning Details */}
                {uiState.currentStep === 1 && (
                  <div className="space-y-6 animate-fade-in">
                    <h3 className="font-semibold text-gray-800 text-lg">Your Learning Preferences</h3>
                    {renderInputField('What do you want to learn?', 'learningInterest', 'text', <BookOpenCheck className="w-4 h-4 text-violet-600" />, 'e.g., Class 10 Mathematics, Python Programming', true)}
                    {renderSelectField(
                      'Preferred Learning Mode',
                      'mode',
                      <UserCircle2 className="w-4 h-4 text-violet-600" />,
                      [
                        { value: 'online-live', label: 'Online Live Classes' },
                        { value: 'online-recorded', label: 'Online Recorded Classes' },
                        { value: 'offline', label: 'Offline Classes' },
                        { value: 'hybrid', label: 'Hybrid (Online + Offline)' }
                      ],
                      'Select learning mode',
                      true
                    )}
                    <div className="grid md:grid-cols-2 gap-6">
                      {renderInputField('Board/University', 'board', 'text', <School className="w-4 h-4 text-violet-600" />, 'e.g., CBSE, ICSE, State Board', true)}
                      {renderInputField('Class/Course', 'subject', 'text', <GraduationCap className="w-4 h-4 text-violet-600" />, 'e.g., Class 12, B.Tech CSE', true)}
                    </div>
                  </div>
                )}

                {/* Step 2: Additional Info */}
                {uiState.currentStep === 2 && (
                  <div className="space-y-6 animate-fade-in">
                    <h3 className="font-semibold text-gray-800 text-lg">More About You</h3>
                    {renderInputField('Tell us about yourself', 'bio', 'text', <Edit3 className="w-4 h-4 text-violet-600" />, 'Share your interests, hobbies, or anything you\'d like your tutor to know...', false, true)}

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Star className="w-4 h-4 text-violet-600" /> Learning Goals (Optional)
                      </label>
                      <div className="flex gap-2 mb-3">
                        <input
                          type="text"
                          name="goalInput"
                          value={uiState.goalInput}
                          onChange={handleChange}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGoal())}
                          className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 shadow-sm"
                          placeholder="Add a learning goal..."
                        />
                        <button
                          type="button"
                          onClick={addGoal}
                          className="px-4 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors transform hover:scale-105 shadow-md"
                        >
                          Add
                        </button>
                      </div>
                      {formData.goals.length > 0 && (
                        <div className="space-y-2 p-3 bg-violet-50 rounded-xl border border-violet-100">
                          {formData.goals.map((goal) => (
                            <div key={goal.id} className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm">
                              <span className="text-gray-700">{goal.text}</span>
                              <button
                                type="button"
                                onClick={() => removeGoal(goal.id)}
                                className="text-red-500 hover:text-red-700 transition-colors transform hover:scale-110"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

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
                      disabled={!isStepComplete() || uiState.isSubmitting} // Use the new isStepComplete
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
                {formData.learningInterest && (
                  <p><span className="font-medium text-violet-600">Learning:</span> {formData.learningInterest}</p>
                )}
                {formData.location && (
                  <p><span className="font-medium text-violet-600">Location:</span> {formData.location}</p>
                )}
                {formData.mode && (
                  <p><span className="font-medium text-violet-600">Mode:</span> {formData.mode}</p>
                )}
                {formData.goals.length > 0 && (
                  <div>
                    <p className="font-medium text-violet-600">Goals:</p>
                    <ul className="list-disc list-inside text-xs pl-2 text-gray-700">
                      {formData.goals.map(goal => <li key={goal.id}>{goal.text}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Tips Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-md">
              <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">Tips for a Great Profile</h3>
              <ul className="space-y-2 text-sm text-blue-700">
                <li>**Be Specific:** The more details you provide about your learning interests and goals, the better we can match you with the right tutors.</li>
                <li>**Complete All Steps:** Ensure you fill out all required fields to unlock the full potential of personalized recommendations.</li>
                <li>**Add a Photo:** A profile picture helps tutors recognize you and adds a personal touch.</li>
                <li>**Set Clear Goals:** Defining your learning goals helps you stay motivated and guides your tutors effectively.</li>
                <li>**Keep it Updated:** You can always come back and modify your profile as your learning journey evolves.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfileForm;