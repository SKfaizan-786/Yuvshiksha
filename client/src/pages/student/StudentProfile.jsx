import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Home,
  Save,
  X,
  Book,
  CheckCircle,
} from 'lucide-react';

const StudentProfile = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({});
  const [subjectInput, setSubjectInput] = useState('');
  const [goalInput, setGoalInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState('/default-profile.png');

  // Helper functions for localStorage
  const getFromLocalStorage = (key) => {
    try {
      const value = localStorage.getItem(key);
      if (!value) return null;
      if ((value.startsWith('{') && value.endsWith('}')) || (value.startsWith('[') && value.endsWith(']'))) {
        return JSON.parse(value);
      }
      return value;
    } catch (error) {
      console.error("Failed to get from localStorage:", error);
      return null;
    }
  };

  const setToLocalStorage = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error("Failed to set to localStorage:", error);
    }
  };

  useEffect(() => {
    const user = getFromLocalStorage('currentUser');
    if (!user || user.role !== 'student') {
      navigate('/login');
      return;
    }
    setCurrentUser(user);
    setEditedProfile({
      ...user,
      ...user.studentProfile,
      subjects: user.studentProfile?.subjects || [],
      learningGoals: user.studentProfile?.learningGoals || [],
      mode: user.studentProfile?.mode || [],
    });
    setProfileImage(user.studentProfile?.photoUrl || '/default-profile.png');
    setLoading(false);
  }, [navigate]);

  const handleInputChange = (field, value) => {
    setEditedProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addTag = (field, inputValue) => {
    if (inputValue.trim() && !editedProfile[field].includes(inputValue.trim())) {
      setEditedProfile(prev => ({
        ...prev,
        [field]: [...prev[field], inputValue.trim()]
      }));
      if (field === 'subjects') setSubjectInput('');
      if (field === 'learningGoals') setGoalInput('');
    }
  };

  const removeTag = (field, valueToRemove) => {
    setEditedProfile(prev => ({
      ...prev,
      [field]: prev[field].filter(item => item !== valueToRemove)
    }));
  };

  const handleCancel = () => {
    setEditedProfile({
      ...currentUser,
      ...currentUser.studentProfile,
      subjects: currentUser.studentProfile?.subjects || [],
      learningGoals: currentUser.studentProfile?.learningGoals || [],
      mode: currentUser.studentProfile?.mode || [],
    });
    setSubjectInput('');
    setGoalInput('');
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!editedProfile.mode || editedProfile.mode.length === 0) {
      alert('Please select at least one Preferred Learning Mode.');
      return;
    }

    const updatedData = {
      ...currentUser.studentProfile,
      ...editedProfile,
      subjects: Array.isArray(editedProfile.subjects) ? editedProfile.subjects : [],
      learningGoals: Array.isArray(editedProfile.learningGoals) ? editedProfile.learningGoals : [],
      mode: Array.isArray(editedProfile.mode) ? editedProfile.mode : [],
    };
    const finalProfileData = {
      firstName: updatedData.firstName,
      lastName: updatedData.lastName,
      phone: updatedData.phone,
      location: updatedData.location,
      pinCode: updatedData.pinCode,
      medium: updatedData.medium,
      bio: updatedData.bio,
      photoUrl: updatedData.photoUrl || '',
      grade: updatedData.grade,
      board: updatedData.board,
      subjects: updatedData.subjects,
      learningGoals: updatedData.learningGoals,
      mode: updatedData.mode,
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/profile/student`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalProfileData),
        credentials: 'include'
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessage = result.message || 'Failed to update profile';
        if (response.status === 401) {
          alert('Session expired. Please log in again.');
          navigate('/login');
          return;
        }
        alert(errorMessage);
        return;
      }

      setToLocalStorage('currentUser', result.user);
      setCurrentUser(result.user);
      setProfileImage(result.user.studentProfile?.photoUrl || '/default-profile.png');
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to update profile due to a network error. Please try again.');
    }
  };

  const handleImageError = () => {
    setProfileImage('/default-profile.png');
  };

  if (!currentUser) return null;

  const getProfileField = (field, fallback = 'Not provided') => {
    const value = isEditing ? editedProfile[field] : (currentUser.studentProfile && currentUser.studentProfile[field]) || currentUser[field];
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : fallback;
    }
    return value || fallback;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  let createdAt = currentUser.createdAt;
  if (!createdAt && currentUser.studentProfile && currentUser.studentProfile.createdAt) {
    createdAt = currentUser.studentProfile.createdAt;
  }
  if (!createdAt) {
    createdAt = new Date().toISOString();
  }

  const renderTagInputField = (label, field, inputState, setInputState, icon) => {
    return (
      <div>
        <label className="text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2">
          {icon} {label}
        </label>
        {isEditing ? (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputState}
                onChange={(e) => setInputState(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag(field, inputState))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-base"
                placeholder={`Add a ${field === 'subjects' ? 'subject' : 'goal'}...`}
              />
              <button
                type="button"
                onClick={() => addTag(field, inputState)}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
              >
                Add
              </button>
            </div>
            {editedProfile[field].length > 0 && (
              <div className="flex flex-wrap gap-2">
                {editedProfile[field].map((item, index) => (
                  <div key={index} className="flex items-center bg-purple-100 px-3 py-1 rounded-full">
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(field, item)}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-slate-900 bg-slate-50 px-4 py-2 rounded-lg text-base">{getProfileField(field)}</p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-400/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-400/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float-delayed"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-400/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float-slow"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/student/dashboard"
            className="flex items-center space-x-2 px-4 py-2 bg-white/70 backdrop-blur-sm border border-white/40 rounded-xl hover:bg-white/80 transition-all duration-200 shadow-sm text-slate-700 hover:text-blue-600 group"
          >
            <Home className="w-5 h-5 transition-colors duration-200 group-hover:text-blue-600" />
            <span className="font-medium">Back to Dashboard</span>
          </Link>

          <div className="text-center">
            <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
            <p className="text-slate-600">View and manage your account information</p>
          </div>

          <div className="w-32"></div>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-700 to-purple-700 px-10 py-8 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="w-28 h-28 bg-white/30 rounded-full flex items-center justify-center overflow-hidden border-4 border-white/40 shadow-lg">
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-28 h-28 object-cover rounded-full"
                    onError={handleImageError}
                  />
                </div>
                <div>
                  <h2 className="text-3xl font-extrabold tracking-tight">
                    {getProfileField('firstName')} {getProfileField('lastName')}
                  </h2>
                  <p className="text-blue-100 text-lg font-medium">Student</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Mail className="w-5 h-5" />
                    <span className="text-base">{currentUser.email}</span>
                  </div>
                </div>
              </div>
              {!isEditing ? (
                <button
                  className="bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-xl font-semibold shadow-lg border border-white/30 transition-all duration-150"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    className="flex items-center space-x-2 px-6 py-2 bg-green-500 hover:bg-green-600 rounded-xl font-semibold shadow-lg border border-green-600 text-white transition-all duration-150"
                  >
                    <Save className="w-5 h-5" />
                    <span>Save</span>
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center space-x-2 px-6 py-2 bg-red-500 hover:bg-red-600 rounded-xl font-semibold shadow-lg border border-red-600 text-white transition-all duration-150"
                  >
                    <X className="w-5 h-5" />
                    <span>Cancel</span>
                  </button>
                </div>
              )}
            </div>
            <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <h3 className="text-xl font-bold mb-5 text-blue-700 flex items-center gap-2"><User className="w-6 h-6" /> Personal Information</h3>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">First Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedProfile.firstName || ''}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                      />
                    ) : (
                      <p className="text-slate-900 bg-slate-50 px-4 py-2 rounded-lg text-base">{getProfileField('firstName')}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Last Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedProfile.lastName || ''}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                      />
                    ) : (
                      <p className="text-slate-900 bg-slate-50 px-4 py-2 rounded-lg text-base">{getProfileField('lastName')}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                    <p className="text-slate-900 bg-slate-50 px-4 py-2 rounded-lg text-base">{currentUser.email}</p>
                    <span className="text-xs text-slate-400">Email cannot be changed</span>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Phone Number</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedProfile.phone || ''}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                      />
                    ) : (
                      <p className="text-slate-900 bg-slate-50 px-4 py-2 rounded-lg text-base">{getProfileField('phone')}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Location</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedProfile.location || ''}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                        placeholder="Kolkata, West Bengal — please include your locality for better accuracy"
                      />
                    ) : (
                      <p className="text-slate-900 bg-slate-50 px-4 py-2 rounded-lg text-base">{getProfileField('location')}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Pin Code</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedProfile.pinCode || ''}
                        onChange={(e) => handleInputChange('pinCode', e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                        placeholder="e.g., 700001"
                      />
                    ) : (
                      <p className="text-slate-900 bg-slate-50 px-4 py-2 rounded-lg text-base">{getProfileField('pinCode')}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Bio</label>
                    {isEditing ? (
                      <textarea
                        value={editedProfile.bio || ''}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                        rows="3"
                        placeholder="Tell us about yourself"
                      />
                    ) : (
                      <p className="text-slate-900 bg-slate-50 px-4 py-2 rounded-lg text-base min-h-[60px]">{getProfileField('bio')}</p>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-5 text-purple-700 flex items-center gap-2"><Book className="w-6 h-6" /> Academic Information</h3>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Grade Level</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedProfile.grade || ''}
                        onChange={(e) => handleInputChange('grade', e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-base"
                      />
                    ) : (
                      <p className="text-slate-900 bg-slate-50 px-4 py-2 rounded-lg text-base">{getProfileField('grade')}</p>
                    )}
                  </div>
                  {renderTagInputField('Subjects of Interest', 'subjects', subjectInput, setSubjectInput, <Book className="w-6 h-6 text-purple-700" />)}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Preferred Learning Mode</label>
                    {isEditing ? (
                      <div className="space-y-2">
                        {["Teacher's place", "Student's place", "Online"].map((option) => (
                          <div key={option} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={editedProfile.mode?.includes(option) || false}
                              onChange={(e) => {
                                const newModes = e.target.checked
                                  ? [...(editedProfile.mode || []), option]
                                  : (editedProfile.mode || []).filter((m) => m !== option);
                                handleInputChange('mode', newModes);
                              }}
                              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                            />
                            <label className="ml-2 text-sm text-gray-700">{option}</label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-900 bg-slate-50 px-4 py-2 rounded-lg text-base">{getProfileField('mode')}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Medium of Instruction</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedProfile.medium || ''}
                        onChange={(e) => handleInputChange('medium', e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-base"
                        placeholder="e.g., English, Hindi, Bengali"
                      />
                    ) : (
                      <p className="text-slate-900 bg-slate-50 px-4 py-2 rounded-lg text-base">{getProfileField('medium')}</p>
                    )}
                  </div>
                  {renderTagInputField('Learning Goals', 'learningGoals', goalInput, setGoalInput, <Book className="w-6 h-6 text-purple-700" />)}
                </div>
              </div>
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
                <div className="bg-gradient-to-r from-green-50 to-green-100 p-5 rounded-xl shadow flex flex-col items-start">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-800">Profile Status</span>
                  </div>
                  <p className="text-green-700 mt-2 text-base">{currentUser.profileComplete ? 'Complete' : 'Incomplete'}</p>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-5 rounded-xl shadow flex flex-col items-start">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-blue-800">Member Since</span>
                  </div>
                  <p className="text-blue-700 mt-2 text-base">{formatDate(createdAt)}</p>
                </div>
                <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-5 rounded-xl shadow flex flex-col items-start">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-yellow-600" />
                    <span className="font-semibold text-yellow-800">Role</span>
                  </div>
                  <p className="text-yellow-700 mt-2 text-base">{currentUser.role}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;