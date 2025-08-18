import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  GraduationCap,
  Save,
  Home,
  ArrowLeft,
  Loader2,
  Clock,
  Plus,
  Trash2
} from 'lucide-react';
import { getFromLocalStorage, setToLocalStorage } from '../utils/storage';

const TeacherProfileEdit = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    location: '',
    bio: '',
    qualifications: '',
    experienceYears: '',
    currentOccupation: '',
    subjects: [],
    boards: [],
    classes: [],
    teachingMode: '',
    preferredSchedule: '',
    teachingApproach: '',
    hourlyRate: '',
    photoUrl: '',
    availability: []
  });
  const [photoPreview, setPhotoPreview] = useState('');
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // State for new availability slot
  const [newSlot, setNewSlot] = useState({
    day: '',
    startTime: '',
    endTime: ''
  });

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Main useEffect to initialize user and form data
  useEffect(() => {
    const user = getFromLocalStorage('currentUser');
    if (!user || user.role !== 'teacher') {
      navigate('/login');
      return;
    }
    setCurrentUser(user);

    const teacherData = user.teacherProfileData || user.teacherProfile || {};
    setFormData({
      firstName: teacherData.firstName || user.firstName || '',
      lastName: teacherData.lastName || user.lastName || '',
      phone: teacherData.phone || '',
      location: teacherData.location || '',
      bio: teacherData.bio || '',
      qualifications: teacherData.qualifications || '',
      experienceYears: teacherData.experienceYears || teacherData.experience || '',
      currentOccupation: teacherData.currentOccupation || '',
      subjects: Array.isArray(teacherData.subjects) ? teacherData.subjects.map(s => s.text || s).join(', ') : '',
      boards: Array.isArray(teacherData.boards) ? teacherData.boards.map(b => b.text || b).join(', ') : '',
      classes: Array.isArray(teacherData.classes) ? teacherData.classes.map(c => c.text || c).join(', ') : '',
      teachingMode: teacherData.teachingMode || '',
      preferredSchedule: teacherData.preferredSchedule || '',
      teachingApproach: teacherData.teachingApproach || '',
      hourlyRate: teacherData.hourlyRate || '',
      photoUrl: teacherData.photoUrl || '',
      availability: teacherData.availability || []
    });
    setPhotoPreview(teacherData.photoUrl || '');
    setLoading(false);
  }, [navigate]);

  // Additional useEffect to properly initialize availability
  useEffect(() => {
    const user = getFromLocalStorage('currentUser');
    if (user?.teacherProfile?.availability) {
      setFormData(prev => ({
        ...prev,
        availability: user.teacherProfile.availability
      }));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'photo' && files && files[0]) {
      const file = files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photoUrl: reader.result }));
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSlotChange = (e) => {
    const { name, value } = e.target;
    setNewSlot(prev => ({ ...prev, [name]: value }));
  };

  const addAvailabilitySlot = () => {
    if (newSlot.day && newSlot.startTime && newSlot.endTime) {
      if (newSlot.startTime >= newSlot.endTime) {
        setMessage({ text: 'End time must be after start time', type: 'error' });
        return;
      }

      // Check for overlapping slots
      const hasOverlap = formData.availability.some(slot => 
        slot.day === newSlot.day && 
        (
          (newSlot.startTime >= slot.startTime && newSlot.startTime < slot.endTime) ||
          (newSlot.endTime > slot.startTime && newSlot.endTime <= slot.endTime) ||
          (newSlot.startTime <= slot.startTime && newSlot.endTime >= slot.endTime)
        )
      );

      if (hasOverlap) {
        setMessage({ text: 'This time slot overlaps with an existing slot', type: 'error' });
        return;
      }

      setFormData(prev => ({
        ...prev,
        availability: [...prev.availability, newSlot]
      }));
      setNewSlot({ day: '', startTime: '', endTime: '' });
      setMessage({ text: '', type: '' }); // Clear any previous error messages
    } else {
      setMessage({ text: 'Please fill all slot fields', type: 'error' });
    }
  };

  const removeAvailabilitySlot = (index) => {
    setFormData(prev => ({
      ...prev,
      availability: prev.availability.filter((_, i) => i !== index)
    }));
  };

  // Updated handleSubmit to properly handle availability
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ text: '', type: '' });

    try {
      // Prepare the data for the API
      const mapToObjArray = (str) => str.split(',').map((s, idx) => {
        const text = s.trim();
        return text ? { id: idx + 1, text } : null;
      }).filter(Boolean);

      const profileData = {
        ...formData,
        subjects: mapToObjArray(formData.subjects),
        boards: mapToObjArray(formData.boards),
        classes: mapToObjArray(formData.classes),
        experience: formData.experienceYears,
        photoUrl: formData.photoUrl || '',
        availability: formData.availability
      };

      // Get token
      let token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token && currentUser && currentUser.token) token = currentUser.token;
      if (!token) throw new Error('No authentication token found. Please log in again.');
      token = token.replace(/^"|"$/g, '');

      // Send PUT request to backend
      const response = await fetch('http://localhost:5000/api/profile/teacher', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const result = await response.json();
      
      // Update local storage with the new data
      const updatedUser = {
        ...currentUser,
        ...result.user,
        teacherProfile: {
          ...currentUser.teacherProfile,
          ...result.user.teacherProfile,
          availability: result.user.teacherProfile.availability || []
        },
        teacherProfileData: {
          ...currentUser.teacherProfileData,
          ...result.user.teacherProfile,
          availability: result.user.teacherProfile.availability || []
        }
      };
      
      setToLocalStorage('currentUser', updatedUser);
      setCurrentUser(updatedUser);

      setMessage({ text: 'Profile updated successfully!', type: 'success' });
      setTimeout(() => navigate('/teacher/profile'), 1500);
    } catch (error) {
      setMessage({ text: error.message || 'Failed to save profile. Please try again.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading profile data...</p>
        </div>
      </div>
    );
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
            to="/teacher/profile"
            className="flex items-center space-x-2 px-4 py-2 bg-white/70 backdrop-blur-sm border border-white/40 rounded-xl hover:bg-white/80 transition-all duration-200 shadow-sm text-slate-700 hover:text-blue-600 group"
          >
            <ArrowLeft className="w-5 h-5 transition-colors duration-200 group-hover:text-blue-600" />
            <span className="font-medium">Back to Profile</span>
          </Link>

          <div className="text-center">
            <h1 className="text-3xl font-bold text-slate-900">Edit Profile</h1>
            <p className="text-slate-600">Update your personal and teaching details</p>
          </div>

          <div className="w-32"></div> {/* Spacer for centering */}
        </div>

        {/* Form Card */}
        <div className="max-w-6xl mx-auto">
          <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <form onSubmit={handleSubmit} className="p-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Left Column - Personal Information */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-blue-700 flex items-center gap-2">
                    <User className="w-6 h-6" /> Personal Information
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-semibold text-slate-700 mb-1">First Name</label>
                      <input
                        type="text"
                        name="firstName"
                        id="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-semibold text-slate-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        name="lastName"
                        id="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        id="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="location" className="block text-sm font-semibold text-slate-700 mb-1">Location</label>
                      <input
                        type="text"
                        name="location"
                        id="location"
                        value={formData.location}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="bio" className="block text-sm font-semibold text-slate-700 mb-1">Bio</label>
                      <textarea
                        name="bio"
                        id="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        rows="3"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      ></textarea>
                    </div>
                    
                    {/* Profile Image Upload */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Profile Image</label>
                      <div className="flex items-center gap-4">
                        {photoPreview ? (
                          <img src={photoPreview} alt="Profile Preview" className="w-20 h-20 rounded-full object-cover border-2 border-blue-300 shadow-sm" />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center text-slate-400">
                            <User className="w-8 h-8" />
                          </div>
                        )}
                        <div>
                          <input
                            type="file"
                            name="photo"
                            accept="image/*"
                            onChange={handleChange}
                            ref={fileInputRef}
                            className="block text-sm text-slate-500 file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                          <p className="text-xs text-slate-500 mt-1">JPG, PNG or GIF (Max. 5MB)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Teaching Information */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-purple-700 flex items-center gap-2">
                    <GraduationCap className="w-6 h-6" /> Teaching Information
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="qualifications" className="block text-sm font-semibold text-slate-700 mb-1">Qualifications</label>
                      <input
                        type="text"
                        name="qualifications"
                        id="qualifications"
                        value={formData.qualifications}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="experienceYears" className="block text-sm font-semibold text-slate-700 mb-1">Experience (years)</label>
                      <input
                        type="number"
                        name="experienceYears"
                        id="experienceYears"
                        value={formData.experienceYears}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="currentOccupation" className="block text-sm font-semibold text-slate-700 mb-1">Current Occupation</label>
                      <input
                        type="text"
                        name="currentOccupation"
                        id="currentOccupation"
                        value={formData.currentOccupation}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="subjects" className="block text-sm font-semibold text-slate-700 mb-1">Subjects (comma-separated)</label>
                      <input
                        type="text"
                        name="subjects"
                        id="subjects"
                        value={formData.subjects}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="boards" className="block text-sm font-semibold text-slate-700 mb-1">Boards (comma-separated)</label>
                      <input
                        type="text"
                        name="boards"
                        id="boards"
                        value={formData.boards}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="classes" className="block text-sm font-semibold text-slate-700 mb-1">Classes/Courses Taught (comma-separated)</label>
                      <input
                        type="text"
                        name="classes"
                        id="classes"
                        value={formData.classes}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="teachingMode" className="block text-sm font-semibold text-slate-700 mb-1">Preferred Teaching Mode</label>
                      <select
                        name="teachingMode"
                        id="teachingMode"
                        value={formData.teachingMode}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">Select mode</option>
                        <option value="Online">Online</option>
                        <option value="Offline">Offline</option>
                        <option value="Hybrid">Hybrid</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="hourlyRate" className="block text-sm font-semibold text-slate-700 mb-1">Hourly Rate (INR)</label>
                      <input
                        type="number"
                        name="hourlyRate"
                        id="hourlyRate"
                        value={formData.hourlyRate}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    {/* Availability Section */}
                    <div className="pt-4">
                      <h4 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                        <Clock className="w-5 h-5" /> Weekly Availability
                      </h4>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <select
                            name="day"
                            value={newSlot.day}
                            onChange={handleSlotChange}
                            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                          
                          <input
                            type="time"
                            name="endTime"
                            value={newSlot.endTime}
                            onChange={handleSlotChange}
                            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        
                        <button
                          type="button"
                          onClick={addAvailabilitySlot}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Add Time Slot
                        </button>
                        
                        {formData.availability.length > 0 && (
                          <div className="mt-4 space-y-2">
                            <h5 className="text-sm font-medium text-slate-700">Current Availability:</h5>
                            <div className="space-y-2">
                              {formData.availability.map((slot, index) => (
                                <div key={index} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                                  <span className="font-medium">
                                    {slot.day}: {slot.startTime} - {slot.endTime}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => removeAvailabilitySlot(index)}
                                    className="text-red-500 hover:text-red-700 p-1"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {message.text && (
                <div className={`mt-6 p-4 rounded-lg text-center font-medium ${
                  message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {message.text}
                </div>
              )}

              <div className="mt-8 flex justify-center">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherProfileEdit;