import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import {
  Upload, Save, Phone, BookOpenCheck, MapPin, School, GraduationCap, UserCircle2, Check, X, Eye, EyeOff, Star, Camera, Trash2, Edit3, Loader2, Info, CheckCircle
} from 'lucide-react';

// --- IMPORT THE STORAGE UTILITIES ---
import { setToLocalStorage, getFromLocalStorage } from '../../utils/storage';

const StudentProfileForm = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // State to hold the form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subjects: [], // Array of objects for UI, will be mapped to strings for backend
    location: '',
    pinCode: '',
    medium: '',
    mode: [],
    board: '',
    subject: '',
    photo: null,
    bio: '',
    goals: [] // Array of objects for UI, will be mapped to strings for backend
  });

  // State to manage UI specific aspects
  const [uiState, setUiState] = useState({
    errors: {},
    isSubmitting: false,
    showPreview: false,
    currentStep: 0,
    photoPreviewUrl: null,
    savedDataTimestamp: null,
    subjectInput: '', // Input for adding new subjects
    goalInput: '', // Input for adding new goals
    userLoaded: false,
    message: '',
    messageType: '',
    isSaving: false,
  });

  // --- Derived State & Constants ---
  const steps = useMemo(() => [
    { title: 'Contact & Location', fields: ['phone', 'location', 'pinCode'], icon: Phone },
    { title: 'Learning Preferences', fields: ['subjects', 'mode', 'medium', 'board', 'subject'], icon: BookOpenCheck },
    { title: 'More About You', fields: ['bio', 'goals', 'photo'], icon: Edit3 }
  ], []);

  const stepRequiredFields = useMemo(() => ({
    0: ['location', 'pinCode'],
    1: ['subjects', 'mode', 'medium', 'board', 'subject'],
    2: []
  }), []);

  const currentStepFields = steps[uiState.currentStep]?.fields || [];

  const isStepComplete = useCallback(() => {
    const requiredFieldsForCurrentStep = stepRequiredFields[uiState.currentStep] || [];
    const currentStepHasErrors = requiredFieldsForCurrentStep.some(field => {
      const value = formData[field];
      if (Array.isArray(value)) {
        return value.length === 0;
      }
      return !value?.trim() || !!uiState.errors[field];
    });
    return !currentStepHasErrors;
  }, [formData, uiState.currentStep, uiState.errors, stepRequiredFields]);

  const progress = ((uiState.currentStep + 1) / steps.length) * 100;
  const showMessage = useCallback((text, type = 'info', duration = 3000) => {
    setUiState(prev => ({ ...prev, message: text, messageType: type }));
    setTimeout(() => {
      setUiState(prev => ({ ...prev, message: '', messageType: '' }));
    }, duration);
  }, []);

  useEffect(() => {
    const loadUserData = async () => {
      const storedUser = getFromLocalStorage('currentUser', null);
      if (storedUser && storedUser.role === 'student') {
        let loaded = false;
        try {
          const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/profile/student`, {
            method: 'GET',
            credentials: 'include'
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
              pinCode: studentProfile.pinCode || '',
              medium: studentProfile.medium || '',
              mode: Array.isArray(studentProfile.mode) ? studentProfile.mode : (studentProfile.mode ? [studentProfile.mode] : []),
              board: studentProfile.board || '',
              subject: studentProfile.subject || '',
              bio: studentProfile.bio || '',
              subjects: (studentProfile.subjects || []).map((s, i) => ({ id: i + 1, text: s })),
              goals: (studentProfile.learningGoals || []).map((g, i) => ({ id: i + 1, text: g })),
            }));
            if (studentProfile.photoUrl) {
              setUiState(prev => ({ ...prev, photoPreviewUrl: studentProfile.photoUrl }));
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
        } catch (error) {
          console.error('Failed to fetch profile from backend, using localStorage:', error);
        }
        if (!loaded) {
          const studentProfile = storedUser.studentProfile || {};
          setFormData(prev => ({
            ...prev,
            firstName: storedUser.firstName || '',
            lastName: storedUser.lastName || '',
            email: storedUser.email || '',
            phone: studentProfile.phone || '',
            location: studentProfile.location || '',
            pinCode: studentProfile.pinCode || '',
            medium: studentProfile.medium || '',
            mode: Array.isArray(studentProfile.mode) ? studentProfile.mode : (studentProfile.mode ? [studentProfile.mode] : []),
            board: studentProfile.board || '',
            subject: studentProfile.subject || '',
            bio: studentProfile.bio || '',
            subjects: (studentProfile.subjects || []).map((s, i) => ({ id: i + 1, text: s })),
            goals: (studentProfile.learningGoals || []).map((g, i) => ({ id: i + 1, text: g })),
          }));
          if (studentProfile.photoUrl) {
            setUiState(prev => ({ ...prev, photoPreviewUrl: studentProfile.photoUrl }));
          }
        }
      }
      setUiState(prev => ({ ...prev, userLoaded: true }));
    };
    loadUserData();
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (!uiState.userLoaded) return;
    setUiState(prev => ({ ...prev, isSaving: true }));
    const timeoutId = setTimeout(() => {
      const storedUser = getFromLocalStorage('currentUser', null);
      if (storedUser && storedUser.role === 'student') {
        const dataToSave = { ...formData };
        if (uiState.photoPreviewUrl) {
          dataToSave.photoUrl = uiState.photoPreviewUrl;
        }
        delete dataToSave.photo;
        const updatedUser = {
          ...storedUser,
          studentProfileData: {
            ...storedUser.studentProfileData,
            ...dataToSave
          }
        };
        setToLocalStorage('currentUser', updatedUser);
        setUiState(prev => ({ ...prev, savedDataTimestamp: new Date().toLocaleTimeString(), isSaving: false }));
      }
    }, 2000);
    return () => {
      clearTimeout(timeoutId);
      setUiState(prev => ({ ...prev, isSaving: false }));
    };
  }, [formData, uiState.userLoaded, uiState.photoPreviewUrl]);

  // --- Validation ---
  const validateField = useCallback((name, value) => {
    let error = '';
    const isRequired = stepRequiredFields[uiState.currentStep]?.includes(name);
    
    if (isRequired && (!value || value.length === 0)) {
        error = `This field is required.`;
    }
    
    if (name === 'phone' || name === 'pinCode') {
        if (value && value.trim().length < 2) {
            error = `Please enter a valid ${name.replace(/([A-Z])/g, ' $1').toLowerCase()}.`;
        }
    }
    
    setUiState(prev => ({ ...prev, errors: { ...prev.errors, [name]: error } }));
    return error === '';
  }, [uiState.currentStep, stepRequiredFields]);

  const handleChange = useCallback((e) => {
    const { name, value, files, checked } = e.target;
    if (name === 'photo' && files && files[0]) {
      const file = files[0];
      if (file.size > 1048576) {
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
    } else if (name === 'subjectInput') {
      setUiState(prev => ({ ...prev, subjectInput: value }));
    } else if (name === 'mode') {
      setFormData(prev => {
        const newMode = checked
          ? [...prev.mode, value]
          : prev.mode.filter(m => m !== value);
        validateField('mode', newMode);
        return { ...prev, mode: newMode };
      });
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      validateField(name, value);
    }
  }, [validateField, showMessage]);

  const addTag = useCallback((inputStateName, fieldName) => {
    const inputValue = uiState[inputStateName].trim();
    if (inputValue && !formData[fieldName].some(item => item.text.toLowerCase() === inputValue.toLowerCase())) {
      setFormData(prev => ({
        ...prev,
        [fieldName]: [...prev[fieldName], { id: Date.now(), text: inputValue }]
      }));
      setUiState(prev => ({ ...prev, [inputStateName]: '' }));
    }
  }, [formData, uiState]);

  const removeTag = useCallback((id, fieldName) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: prev[fieldName].filter(item => item.id !== id)
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
      const form = new FormData();
      // Transform subjects and goals to arrays of strings
      const subjects = formData.subjects.map(s => s.text);
      const learningGoals = formData.goals.map(g => g.text);

      // Append all form data
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'subjects') {
          form.append('subjects', JSON.stringify(subjects));
        } else if (key === 'goals') {
          form.append('learningGoals', JSON.stringify(learningGoals));
        } else if (key === 'mode' && Array.isArray(value)) {
          form.append('mode', JSON.stringify(value));
        } else if (key === 'photo' && value) {
          form.append('photo', value);
        } else if (value !== null && value !== undefined) {
          form.append(key, value);
        }
      });

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/profile/student`, {
        method: 'PUT',
        credentials: 'include',
        body: form
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to save profile');
      }

      const updatedUser = {
        ...result.user,
        profileComplete: true,
      };

      setToLocalStorage('currentUser', updatedUser);
      showMessage('Profile saved successfully!', 'success');

      setTimeout(() => navigate('/student/dashboard'), 1500);
    } catch (error) {
      const errorMessage = error.message.toLowerCase().includes('cast')
        ? 'Invalid data format. Please check your inputs and try again.'
        : error.message || 'Failed to save profile';
      showMessage(errorMessage, 'error');
      console.error('Profile submission failed:', error);
      if (error.message.toLowerCase().includes('token')) {
        navigate('/login');
      }
    } finally {
      setUiState(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [formData, navigate, showMessage]);

  const handleNextStep = useCallback(() => {
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
            onBlur={(e) => validateField(name, e.target.value)}
            className={inputClasses}
            placeholder={placeholder}
          />
        )}
        {error && <p className="text-red-500 text-sm mt-1 animate-shake">{error}</p>}
      </div>
    );
  }, [formData, uiState.errors, handleChange, validateField]);

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
          onBlur={(e) => validateField(name, e.target.value)}
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

  const renderCheckboxGroup = useCallback((label, name, icon, options, isRequired = false) => {
    const value = formData[name];
    const error = uiState.errors[name];

    return (
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          {icon} {label} {isRequired && <span className="text-red-500">*</span>}
        </label>
        <div className={`space-y-2 p-3 border rounded-xl ${error ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}>
          {options.map((option) => (
            <div key={option.value} className="flex items-center">
              <input
                type="checkbox"
                name={name}
                value={option.value}
                checked={value.includes(option.value)}
                onChange={handleChange}
                className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">{option.label}</label>
            </div>
          ))}
        </div>
        {error && <p className="text-red-500 text-sm mt-1 animate-shake">{error}</p>}
      </div>
    );
  }, [formData, uiState.errors, handleChange]);

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
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag(inputStateName, name))}
            className={inputClasses}
            placeholder={placeholder}
          />
          <button
            type="button"
            onClick={() => addTag(inputStateName, name)}
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
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-3xl p-8 mb-8 relative overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-sm"></div>
          <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-2">Student Profile</h1>
            <p className="text-violet-100 mb-4">Tell us about yourself to get personalized learning recommendations</p>
            <div className="w-full bg-white/20 rounded-full h-3 mb-4">
              <div
                className="bg-white rounded-full h-3 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
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
          <div className="lg:col-span-2">
            <div className="bg-white shadow-2xl rounded-3xl p-8 transform transition-all duration-300 hover:shadow-3xl">
              <div className="space-y-6">
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

                {uiState.currentStep === 0 && (
                  <div className="space-y-6 animate-fade-in">
                    <h3 className="font-semibold text-gray-800 text-lg">Contact & Location</h3>
                    {renderInputField('Phone Number', 'phone', 'tel', <Phone className="w-4 h-4 text-violet-600" />, 'e.g., +91 98765 43210', false)}
                    {renderInputField('Location', 'location', 'text', <MapPin className="w-4 h-4 text-violet-600" />, 'Kolkata, West Bengal — please include your locality for better accuracy', true)}
                    {renderInputField('Pin Code', 'pinCode', 'text', <MapPin className="w-4 h-4 text-violet-600" />, 'e.g., 700001', true)}
                  </div>
                )}

                {uiState.currentStep === 1 && (
                  <div className="space-y-6 animate-fade-in">
                    <h3 className="font-semibold text-gray-800 text-lg">Your Learning Preferences</h3>
                    {renderTagInputField('Learning Interests', 'subjects', 'subjectInput', <BookOpenCheck className="w-4 h-4 text-violet-600" />, 'Add an interest, e.g., Mathematics, Python', true)}
                    {renderCheckboxGroup(
                      'Preferred Learning Mode',
                      'mode',
                      <UserCircle2 className="w-4 h-4 text-violet-600" />,
                      [
                        { value: "Teacher's place", label: "Teacher's place" },
                        { value: "Student's place", label: "Student's place" },
                        { value: 'Online', label: 'Online' }
                      ],
                      true
                    )}
                    {renderInputField('Medium of Instruction', 'medium', 'text', <UserCircle2 className="w-4 h-4 text-violet-600" />, 'e.g., English, Hindi, Bengali', true)}
                    <div className="grid md:grid-cols-2 gap-6">
                      {renderInputField('Board/University', 'board', 'text', <School className="w-4 h-4 text-violet-600" />, 'e.g., CBSE, ICSE, State Board', true)}
                      {renderInputField('Class/Course', 'subject', 'text', <GraduationCap className="w-4 h-4 text-violet-600" />, 'e.g., Class 12, B.Tech CSE', true)}
                    </div>
                  </div>
                )}

                {uiState.currentStep === 2 && (
                  <div className="space-y-6 animate-fade-in">
                    <h3 className="font-semibold text-gray-800 text-lg">More About You</h3>
                    {renderInputField('Tell us about yourself', 'bio', 'text', <Edit3 className="w-4 h-4 text-violet-600" />, 'Share your interests, hobbies, or anything you\'d like your tutor to know...', false, true)}
                    {renderTagInputField('Learning Goals', 'goals', 'goalInput', <Star className="w-4 h-4 text-violet-600" />, 'Add a learning goal...', false)}
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
          <div className="lg:col-span-1 space-y-6">
            {(uiState.savedDataTimestamp || uiState.isSaving) && (
              <div className={`bg-green-50 border border-green-200 rounded-xl p-4 transition-all duration-300 ${uiState.isSaving ? 'animate-pulse-opacity' : 'animate-fade-in'}`}>
                <div className="flex items-center gap-2 text-green-700">
                  {uiState.isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span className="font-medium">{uiState.isSaving ? 'Saving...' : 'Auto-saved'}</span>
                </div>
                {uiState.savedDataTimestamp && <p className="text-green-600 text-sm mt-1">Last saved at {uiState.savedDataTimestamp}</p>}
              </div>
            )}
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
                {formData.subjects.length > 0 && (
                  <div>
                    <p className="font-medium text-violet-600">Learning Interests:</p>
                    <ul className="list-disc list-inside text-xs pl-2 text-gray-700">
                      {formData.subjects.map(subject => <li key={subject.id}>{subject.text}</li>)}
                    </ul>
                  </div>
                )}
                {formData.location && (
                  <p><span className="font-medium text-violet-600">Location:</span> {formData.location}</p>
                )}
                {formData.pinCode && (
                  <p><span className="font-medium text-violet-600">Pin Code:</span> {formData.pinCode}</p>
                )}
                {formData.mode.length > 0 && (
                  <p><span className="font-medium text-violet-600">Mode:</span> {formData.mode.join(', ')}</p>
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