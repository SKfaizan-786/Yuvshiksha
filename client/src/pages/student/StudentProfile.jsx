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
  // Handle input changes for editing profile fields
  const handleInputChange = (field, value) => {
    setEditedProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  // Cancel editing and reset editedProfile to currentUser data
  const handleCancel = () => {
    setEditedProfile({
      ...currentUser,
      ...currentUser.studentProfile,
      subjects: currentUser.studentProfile?.subjects || [],
      learningGoals: currentUser.studentProfile?.learningGoals || [],
    });
    setIsEditing(false);
  };
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({});
  const [loading, setLoading] = useState(true);

  // Helper functions for localStorage
  const getFromLocalStorage = (key) => {
    try {
      const value = localStorage.getItem(key);
      if (!value) return null;
      // If value looks like JSON, parse it, else return as-is (for tokens)
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
    // Initialize editedProfile with a deep merge of currentUser and studentProfile
    setEditedProfile({
      ...user,
      ...user.studentProfile,
      // Ensure subjects and learningGoals are initialized as arrays for editing
      subjects: user.studentProfile?.subjects || [],
      learningGoals: user.studentProfile?.learningGoals || [],
    });
    setLoading(false);
  }, [navigate]);

  const handleSave = async () => {
    if (!editedProfile.mode || !["Teacher's place", "Student's place", "Online"].includes(editedProfile.mode)) {
      alert('Please select a valid Preferred Learning Mode.');
      return;
    }
    const token = getFromLocalStorage('token');
    if (!token) {
      alert('No authentication token found');
      return;
    }

    // Merge the updated data before sending
    const updatedData = {
      ...currentUser.studentProfile, // Start with all existing student profile fields
      ...editedProfile, // Overwrite with any changes from the edited state
      // Ensure specific fields are correctly formatted before sending
      subjects: Array.isArray(editedProfile.subjects) ? editedProfile.subjects : [],
      learningGoals: Array.isArray(editedProfile.learningGoals) ? editedProfile.learningGoals : [],
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
      const response = await fetch('http://localhost:5000/api/profile/student', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(finalProfileData),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.message || 'Failed to update profile');
        return;
      }

      setToLocalStorage('currentUser', result.user);
      setCurrentUser(result.user);
      setIsEditing(false);
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to update profile due to a network error.');
    }
  };

  if (!currentUser) return null;

  const getProfileField = (field, fallback = 'Not provided') => {
    const value = isEditing ? editedProfile[field] : (currentUser.studentProfile && currentUser.studentProfile[field]) || currentUser[field];
    return value || fallback;
  };

  const profileImage = getProfileField('photoUrl') || '/default-profile.png';

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-400/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-400/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float-delayed"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-400/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float-slow"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
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

          <div className="w-32"></div> {/* Spacer for centering */}
        </div>

        {/* Profile Card */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-blue-700 to-purple-700 px-10 py-8 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="w-28 h-28 bg-white/30 rounded-full flex items-center justify-center overflow-hidden border-4 border-white/40 shadow-lg">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-28 h-28 object-cover rounded-full" />
                  ) : (
                    <User className="w-12 h-12" />
                  )}
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
            {/* Profile Content */}
            <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Personal Information */}
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
              {/* Academic Information */}
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
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Subjects of Interest</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={Array.isArray(editedProfile.subjects) ? editedProfile.subjects.join(', ') : (editedProfile.subjects || '')}
                        onChange={(e) => handleInputChange('subjects', e.target.value.split(',').map(s => s.trim()))}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-base"
                      />
                    ) : (
                      <p className="text-slate-900 bg-slate-50 px-4 py-2 rounded-lg text-base">{getProfileField('subjects') && Array.isArray(getProfileField('subjects')) ? getProfileField('subjects').join(', ') : getProfileField('subjects')}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Preferred Learning Mode</label>
                    {isEditing ? (
                      <select
                        value={editedProfile.mode || ''}
                        onChange={(e) => handleInputChange('mode', e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-base"
                        required
                      >
                        <option value="" disabled>Select mode</option>
                        <option value="Teacher's place">Teacher's place</option>
                        <option value="Student's place">Student's place</option>
                        <option value="Online">Online</option>
                      </select>
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
                        required
                      />
                    ) : (
                      <p className="text-slate-900 bg-slate-50 px-4 py-2 rounded-lg text-base">{getProfileField('medium')}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Learning Goals</label>
                    {isEditing ? (
                      <textarea
                        value={Array.isArray(editedProfile.learningGoals) ? editedProfile.learningGoals.join('\n') : (editedProfile.learningGoals || '')}
                        onChange={(e) => handleInputChange('learningGoals', e.target.value.split('\n'))}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-base"
                        rows="3"
                        placeholder="What are your learning objectives?"
                      />
                    ) : (
                      <p className="text-slate-900 bg-slate-50 px-4 py-2 rounded-lg text-base min-h-[80px]">{getProfileField('learningGoals') && Array.isArray(getProfileField('learningGoals')) ? getProfileField('learningGoals').join(', ') : getProfileField('learningGoals')}</p>
                    )}
                  </div>
                </div>
              </div>
              {/* Account Status */}
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
                  <p className="text-blue-700 mt-2 text-base">
                    {formatDate(createdAt)}
                  </p>
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
}

export default StudentProfile;