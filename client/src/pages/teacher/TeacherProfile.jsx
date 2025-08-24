import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Calendar,
  GraduationCap,
  BookOpenCheck,
  Star,
  Users,
  Home,
  Clock,
  Edit3
} from 'lucide-react';
import { getFromLocalStorage } from '../utils/storage';

const TeacherProfile = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getFromLocalStorage('currentUser');
    if (!user || user.role !== 'teacher') {
      navigate('/login');
      return;
    }
    setCurrentUser(user);
    setLoading(false);
  }, [navigate]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTimeSlot = (slot) => {
    const start = new Date(`2000-01-01T${slot.startTime}`);
    const end = new Date(`2000-01-01T${slot.endTime}`);
    return `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) return null;

  const teacherData = currentUser.teacherProfileData || currentUser.teacherProfile || {};

  // Group availability by day
  const groupedAvailability = teacherData.availability?.reduce((acc, slot) => {
    if (!acc[slot.day]) acc[slot.day] = [];
    acc[slot.day].push(slot);
    return acc;
  }, {});

  // Sort days in order
  const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const sortedAvailability = groupedAvailability ? 
    Object.entries(groupedAvailability)
      .sort(([a], [b]) => daysOrder.indexOf(a) - daysOrder.indexOf(b))
      .reduce((acc, [day, slots]) => {
        acc[day] = slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
        return acc;
      }, {}) 
    : null;

  const memberSinceDate = teacherData.createdAt;
  const profileImage = teacherData.photoUrl || 'https://placehold.co/150x150/E0E7FF/4338CA?text=Teacher';

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
            to="/teacher/dashboard"
            className="flex items-center space-x-2 px-4 py-2 bg-white/70 backdrop-blur-sm border border-white/40 rounded-xl hover:bg-white/80 transition-all duration-200 shadow-sm text-slate-700 hover:text-blue-600 group"
          >
            <Home className="w-5 h-5 transition-colors duration-200 group-hover:text-blue-600" />
            <span className="font-medium">Back to Dashboard</span>
          </Link>

          <div className="text-center">
            <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
            <p className="text-slate-600">View and manage your teaching profile</p>
          </div>

          <div className="w-32"></div> {/* Spacer for centering */}
        </div>

        {/* Profile Card */}
        <div className="max-w-6xl mx-auto">
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
                    {teacherData.firstName || currentUser.firstName || 'Not provided'} {teacherData.lastName || currentUser.lastName || ''}
                  </h2>
                  <p className="text-blue-100 text-lg font-medium">Teacher</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Mail className="w-5 h-5" />
                    <span className="text-base">{currentUser.email}</span>
                  </div>
                  {teacherData.isListed && (
                    <div className="flex items-center space-x-2 mt-1">
                      <Star className="w-5 h-5 text-yellow-300" />
                      <span className="text-sm">Listed Teacher</span>
                    </div>
                  )}
                </div>
              </div>
              <Link
                to="/teacher/profile/edit"
                className="bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-xl font-semibold shadow-lg border border-white/30 transition-all duration-150"
              >
                Edit Profile
              </Link>
            </div>
            {/* Profile Content */}
            <div className="p-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Personal Information */}
              <div>
                <h3 className="text-xl font-bold mb-5 text-blue-700 flex items-center gap-2">
                  <User className="w-6 h-6" /> Personal Information
                </h3>
                <div className="space-y-5 grid grid-cols-1 gap-x-6 gap-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                    <p className="text-slate-900 bg-slate-50 px-4 py-2 rounded-lg text-base">
                      {teacherData.firstName || currentUser.firstName || 'Not provided'} {teacherData.lastName || currentUser.lastName || ''}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                    <p className="text-slate-900 bg-slate-50 px-4 py-2 rounded-lg text-base">{currentUser.email}</p>
                    <span className="text-xs text-slate-400">Email cannot be changed</span>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Phone Number</label>
                    <p className="text-slate-900 bg-slate-50 px-4 py-2 rounded-lg text-base">
                      {teacherData.phone || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Location</label>
                    <p className="text-slate-900 bg-slate-50 px-4 py-2 rounded-lg text-base">
                      {teacherData.location || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Pin Code</label>
                    <p className="text-slate-900 bg-slate-50 px-4 py-2 rounded-lg text-base">
                      {teacherData.pinCode || 'Not provided'}
                    </p>
                  </div>
                  <div className="col-span-1">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Bio</label>
                    <p className="text-slate-900 bg-slate-50 px-4 py-2 rounded-lg text-base min-h-[60px]">
                      {teacherData.bio || 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>
              {/* Teaching Information */}
              <div>
                <h3 className="text-xl font-bold mb-5 text-purple-700 flex items-center gap-2">
                  <GraduationCap className="w-6 h-6" /> Teaching Information
                </h3>
                <div className="space-y-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Qualifications</label>
                    <p className="text-slate-900 bg-slate-50 px-4 py-2 rounded-lg text-base">
                      {teacherData.qualifications || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Experience (years)</label>
                    <p className="text-slate-900 bg-slate-50 px-4 py-2 rounded-lg text-base">
                      {teacherData.experienceYears || teacherData.experience || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Current Occupation</label>
                    <p className="text-slate-900 bg-slate-50 px-4 py-2 rounded-lg text-base">
                      {teacherData.currentOccupation || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Subjects Taught</label>
                    <p className="text-slate-900 bg-slate-50 px-4 py-2 rounded-lg text-base min-h-[40px]">
                      {Array.isArray(teacherData.subjects) && teacherData.subjects.length > 0
                        ? teacherData.subjects.map(s => s.text || s).join(', ')
                        : Array.isArray(teacherData.subjectsTaught) && teacherData.subjectsTaught.length > 0
                          ? teacherData.subjectsTaught.map(s => s.text || s).join(', ')
                          : 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Boards Taught</label>
                    <p className="text-slate-900 bg-slate-50 px-4 py-2 rounded-lg text-base min-h-[40px]">
                      {Array.isArray(teacherData.boards) && teacherData.boards.length > 0
                        ? teacherData.boards.map(b => b.text || b).join(', ')
                        : Array.isArray(teacherData.boardsTaught) && teacherData.boardsTaught.length > 0
                          ? teacherData.boardsTaught.map(b => b.text || b).join(', ')
                          : 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Classes/Courses Taught</label>
                    <p className="text-slate-900 bg-slate-50 px-4 py-2 rounded-lg text-base min-h-[40px]">
                      {Array.isArray(teacherData.classes) && teacherData.classes.length > 0
                        ? teacherData.classes.map(c => c.text || c).join(', ')
                        : Array.isArray(teacherData.classesTaught) && teacherData.classesTaught.length > 0
                          ? teacherData.classesTaught.map(c => c.text || c).join(', ')
                          : 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Teaching Mode</label>
                    <p className="text-slate-900 bg-slate-50 px-4 py-2 rounded-lg text-base">
                      {teacherData.teachingMode || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Medium of Instruction</label>
                    <p className="text-slate-900 bg-slate-50 px-4 py-2 rounded-lg text-base">
                      {teacherData.medium || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Hourly Rate (INR)</label>
                    <p className="text-slate-900 bg-slate-50 px-4 py-2 rounded-lg text-base">
                      {teacherData.hourlyRate ? `₹${teacherData.hourlyRate}/hour` : 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Availability Section */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-blue-700 flex items-center gap-2">
                      <Clock className="w-6 h-6" /> Weekly Availability
                    </h3>
                    <Link
                      to="/teacher/profile/edit-availability"
                      className="flex items-center gap-2 text-sm bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit Availability
                    </Link>
                  </div>
                  
                  {teacherData.availability?.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(sortedAvailability).map(([day, slots]) => (
                        <div key={day} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                          <h4 className="font-semibold text-lg mb-3 text-slate-800">{day}</h4>
                          <div className="space-y-2">
                            {slots.map((slot, index) => (
                              <div key={index} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium text-slate-800">
                                    {formatTimeSlot(slot)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                      <p className="text-slate-500 mb-4">No availability slots added yet</p>
                      <Link
                        to="/teacher/profile/edit-availability"
                        className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        <Clock className="w-4 h-4" />
                        Add Availability
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Account Status */}
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-8 mt-10">
                <div className="bg-gradient-to-r from-green-50 to-green-100 p-5 rounded-xl shadow flex flex-col items-start">
                  <div className="flex items-center gap-2">
                    <BookOpenCheck className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-800">Profile Status</span>
                  </div>
                  <p className="text-green-700 mt-2 text-base">
                    {currentUser.profileComplete ? 'Complete' : 'Incomplete'}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-5 rounded-xl shadow flex flex-col items-start">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-blue-800">Member Since</span>
                  </div>
                  <p className="text-blue-700 mt-2 text-base">
                    {formatDate(memberSinceDate)}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-5 rounded-xl shadow flex flex-col items-start">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-purple-600" />
                    <span className="font-semibold text-purple-800">Listing Status</span>
                  </div>
                  <p className="text-purple-700 mt-2 text-base">
                    {teacherData.isListed ? 'Listed' : 'Not Listed'}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-5 rounded-xl shadow flex flex-col items-start">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-yellow-600" />
                    <span className="font-semibold text-yellow-800">Role</span>
                  </div>
                  <p className="text-yellow-700 mt-2 text-base capitalize">{currentUser.role}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherProfile;