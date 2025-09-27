import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  CalendarDays, Users, DollarSign, LogOut, UserRound, ArrowRight, CheckCircle,
  Wallet, ListChecks, LayoutDashboard, Settings, Loader2, Info, XCircle, Bell, MessageSquare, Award, MonitorCheck,
  User, BookOpen, Clock, GraduationCap
} from 'lucide-react';

// Import your storage utility functions
import { getFromLocalStorage, setToLocalStorage } from "../utils/storage";
import { bookingAPI } from '../../services/bookingAPI';
import { paymentsAPI } from '../../services/paymentsAPI';
import { launchCashfreePayment } from '../../utils/cashfree';
import Cookies from 'js-cookie';

// --- Constants ---
const LISTING_FEE = 100; // Define listing fee as a constant for easy updates.

// --- Mock Data Seeding (for demonstration) ---
const seedTeacherDashboardData = () => {
  const existingUser = getFromLocalStorage('currentUser');
  if (!existingUser) {
    setToLocalStorage('currentUser', {
      id: 101,
      _id: 101,
      firstName: 'Anya',
      lastName: 'Sharma',
      email: 'anya.sharma@example.com',
      role: 'teacher',
      profileComplete: true,
      teacherProfileData: {
        isListed: false,
        listedAt: null,
        phone: '+919876543210',
        location: 'Bengaluru, Karnataka',
        qualifications: 'M.Sc. Physics',
        experienceYears: 7,
        currentOccupation: 'Full-time Teacher',
        subjectsTaught: [{ id: 1, text: 'Physics' }, { id: 2, text: 'Mathematics' }],
        boardsTaught: [{ id: 1, text: 'CBSE' }, { id: 2, text: 'ICSE' }],
        classesTaught: [{ id: 1, text: 'Class 11' }, { id: 2, text: 'Class 12' }, { id: 3, text: 'JEE Mains' }],
        teachingMode: 'hybrid',
        preferredSchedule: 'Weekdays evenings, Weekends',
        bio: 'Passionate physics and mathematics educator with 7 years of experience. I believe in making learning fun and intuitive.',
        teachingApproach: 'Interactive sessions with real-world examples and problem-solving focus.',
        achievements: [{ id: 1, text: 'Mentored 100+ students to crack JEE' }],
        hourlyRate: 800,
        photoUrl: 'https://randomuser.me/api/portraits/women/68.jpg'
      }
    });
  } else if (existingUser && existingUser.role === 'teacher' && !existingUser.id && !existingUser._id) {
    const updatedUser = { ...existingUser, id: 101, _id: 101 };
    setToLocalStorage('currentUser', updatedUser);
  }
  let registeredUsers = getFromLocalStorage('registeredUsers', []);
  const currentTeacher = getFromLocalStorage('currentUser');
  if (currentTeacher && currentTeacher.role === 'teacher' && !registeredUsers.some(u => u.id === currentTeacher.id)) {
    registeredUsers.push(currentTeacher);
    setToLocalStorage('registeredUsers', registeredUsers);
  } else if (currentTeacher && currentTeacher.role === 'teacher') {
    registeredUsers = registeredUsers.map(user =>
      user.id === currentTeacher.id ? currentTeacher : user
    );
    setToLocalStorage('registeredUsers', registeredUsers);
  }
  if (!getFromLocalStorage('teacherBookings')) {
    setToLocalStorage('teacherBookings', []);
  }
  if (!getFromLocalStorage('teacherInquiries')) {
    setToLocalStorage('teacherInquiries', []);
  }
};
// --- End Mock Data Seeding ---

// --- Sub-Components (Unchanged) ---
const DashboardCard = ({ icon: Icon, title, children, className = '' }) => (
  <div className={`relative bg-white/60 backdrop-blur-sm shadow-xl p-6 rounded-2xl border border-white/40 overflow-hidden
    transform hover:scale-[1.02] transition-all duration-300 hover:shadow-purple-400/30 hover:bg-white/70 ${className}`}>
    <div className="absolute inset-0 bg-gradient-to-br from-purple-50/20 to-violet-50/20 opacity-50"></div>
    <div className="relative z-10 flex flex-col h-full min-h-[280px]">
      <div className="flex items-center gap-3 mb-6">
        {Icon && <Icon className="w-6 h-6 text-purple-600" />}
        <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
      </div>
      <div className="flex-grow flex flex-col justify-center">
        {children}
      </div>
    </div>
  </div>
);

const StatRow = ({ label, value, valueClassName = 'text-purple-700' }) => (
  <div className="flex items-center justify-between p-4 bg-white/40 backdrop-blur-sm rounded-xl border border-white/30 hover:bg-white/50 transition-all duration-200">
    <span className="text-slate-700 font-medium text-sm">{label}:</span>
    <span className={`text-lg font-bold ${valueClassName}`}>{value}</span>
  </div>
);

const StatSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-12 bg-gray-700 rounded-lg"></div>
    <div className="h-12 bg-gray-700 rounded-lg"></div>
    <div className="h-12 bg-gray-700 rounded-lg"></div>
  </div>
);

// --- Main TeacherDashboard Component ---
export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [unreadBookingCount, setUnreadBookingCount] = useState(() => {
    return parseInt(localStorage.getItem('unreadBookingCount') || '0', 10);
  });
  const [currentUser, setCurrentUser] = useState(() => getFromLocalStorage('currentUser'));
  const [loading, setLoading] = useState(true);
  const [isProcessingListing, setIsProcessingListing] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const getInitialStats = () => {
    const saved = localStorage.getItem('teacherDashboardStats');
    if (saved) {
      try { return JSON.parse(saved); } catch { return { upcomingSessions: 0, totalSessions: 0, totalEarnings: 0 }; }
    }
    return { upcomingSessions: 0, totalSessions: 0, totalEarnings: 0 };
  };
  const [stats, setStats] = useState(getInitialStats);
  const [statsLoading, setStatsLoading] = useState(false);
  const [recentBookings, setRecentBookings] = useState([]);
  const [isListed, setIsListed] = useState(() => {
    const user = getFromLocalStorage('currentUser');
    return user?.teacherProfileData?.isListed || user?.isListed || false;
  });
  const [profileImageError, setProfileImageError] = useState(false);

  const showMessage = useCallback((text, type = 'info', duration = 3000) => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, duration);
  }, []);

  const handleNavigation = (path, type) => {
    if (type === 'messages') {
      setUnreadMessageCount(0);
    } else if (type === 'bookings') {
      setUnreadBookingCount(0);
      localStorage.setItem('unreadBookingCount', '0');
    }
    navigate(path);
  };

  const hasFetchedData = useRef(false);
  const fetchUserData = useCallback(async () => {
    if (hasFetchedData.current) return;
    hasFetchedData.current = true;
    setLoading(true);
    let user = getFromLocalStorage('currentUser');

    if (!user || user.role !== 'teacher') {
      showMessage("Access denied. Please log in as a teacher.", 'error');
      navigate('/login', { replace: true });
      setLoading(false);
      return;
    }

    try {
      // FIX: Rely on the browser to send the HttpOnly cookie
      const response = await fetch(import.meta.env.VITE_BACKEND_URL + '/api/profile/teacher', {
        method: 'GET',
        // FIX: Removed manual Authorization header
        credentials: 'include' // This is all that is needed for HttpOnly cookies
      });

      if (response.ok) {
        const profileData = await response.json();
        const teacherProfileData = profileData.teacherProfile || {};
        
        const updatedUser = {
          ...user,
          ...profileData, // Merge top-level user info
          id: profileData._id || user?._id,
          _id: profileData._id || user?._id,
          // FIX: Ensure teacherProfileData and other flags are correctly updated
          teacherProfileData: {
            ...(user.teacherProfileData || {}), // Keep old data if not in new response
            ...teacherProfileData, // Overwrite with fresh profile data
          },
          profileComplete: profileData.profileComplete || user.profileComplete || false,
          isListed: teacherProfileData.isListed // This is the key field from the nested object
        };

        setToLocalStorage('currentUser', updatedUser);
        setCurrentUser(updatedUser);
        setIsListed(updatedUser.isListed);
      } else {
        console.warn('Failed to fetch profile from backend, using localStorage');
      }
    } catch (apiError) {
      console.warn('Backend not available or API call failed, using localStorage:', apiError);
    } finally {
      setLoading(false);
    }
  }, [navigate, showMessage]);

  useEffect(() => {
    seedTeacherDashboardData();
    fetchUserData();
    window.addEventListener('storage', fetchUserData);
    return () => {
      window.removeEventListener('storage', fetchUserData);
    };
  }, [fetchUserData]);

  const fetchStatsAndBookings = useCallback(async () => {
    if (!currentUser || !(currentUser.id || currentUser._id)) return;
    setStatsLoading(true);
    try {
      // Use bookingAPI which should also be updated to use credentials: 'include' or withCredentials: true
      const response = await bookingAPI.getTeacherBookings({ page: 1, limit: 10 });
      const bookings = response.bookings || [];
      const now = new Date();
      
      const previousBookingCount = parseInt(localStorage.getItem('lastTotalBookings') || '0', 10);
      const currentTotalBookings = bookings.length;
      
      if (currentTotalBookings > previousBookingCount) {
        const newBookingsCount = currentTotalBookings - previousBookingCount;
        setUnreadBookingCount(prevCount => prevCount + newBookingsCount);
        localStorage.setItem('unreadBookingCount', unreadBookingCount + newBookingsCount);
      }
      
      localStorage.setItem('lastTotalBookings', currentTotalBookings);
      
      const upcomingSessions = bookings.filter(b =>
        (b.status === 'pending' || b.status === 'confirmed') && new Date(b.date) >= now
      ).length;
      const totalSessions = bookings.length;
      const totalEarnings = bookings
        .filter(b => b.status === 'confirmed' || b.status === 'completed')
        .reduce((sum, b) => sum + (b.amount || 0), 0);
      const newStats = { upcomingSessions, totalSessions, totalEarnings };
      setStats(newStats);
      localStorage.setItem('teacherDashboardStats', JSON.stringify(newStats));
      setRecentBookings(bookings);
    } catch (err) {
      console.error("Failed to fetch stats and bookings:", err);
      setStats({ upcomingSessions: 0, totalSessions: 0, totalEarnings: 0 });
      setRecentBookings([]);
    } finally {
      setStatsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchStatsAndBookings();
  }, [fetchStatsAndBookings]);

  // Reset profile image error when user changes
  useEffect(() => {
    setProfileImageError(false);
  }, [currentUser?.teacherProfileData?.photoUrl]);

  // Fetch unread message count on mount
  useEffect(() => {
    const fetchUnreadMessages = async () => {
      try {
        // FIX: Removed manual Authorization header
        const res = await fetch(import.meta.env.VITE_BACKEND_URL + '/api/messages/unread-count', {
          credentials: 'include' // This is the correct way
        });
        const data = await res.json();
        setUnreadMessageCount(data.unreadCount || 0);
      } catch (e) {
        setUnreadMessageCount(0);
      }
    };
    fetchUnreadMessages();
  }, []);

  const teacherProfile = currentUser?.teacherProfileData || currentUser || {};
  // Fix profile picture logic to prevent shivering/loading issues
  const hasValidPhotoUrl = teacherProfile.photoUrl && 
    teacherProfile.photoUrl.trim() !== '' && 
    !profileImageError;
  const profilePicture = hasValidPhotoUrl ? teacherProfile.photoUrl : '/default-profile.jpg';
  const isListedStatus = teacherProfile.isListed || false;
  const isProfileComplete = currentUser?.profileComplete || false;

  const paymentInProgress = useRef(false);
  const handleGetListed = async () => {
    if (paymentInProgress.current) return;
    paymentInProgress.current = true;
    setIsProcessingListing(true);
    const user = getFromLocalStorage('currentUser');
    const phone = user.teacherProfileData?.phone || user.phone || '';
    const listingData = {
      teacherId: user._id,
      name: user.firstName + ' ' + user.lastName,
      email: user.email,
      phone,
      fee: LISTING_FEE,
      timestamp: Date.now(),
    };
    try {
      const res = await paymentsAPI.createOrder({
        amount: LISTING_FEE,
        customerId: user._id,
        customerName: user.firstName + ' ' + user.lastName,
        customerEmail: user.email,
        customerPhone: phone,
        purpose: 'Teacher Listing Fee'
      });
      const data = await res;
      if (!data.paymentSessionId || !data.orderId) {
        setMessage('Failed to initiate payment. Please try again.');
        setMessageType('error');
        setIsProcessingListing(false);
        paymentInProgress.current = false;
        return;
      }
      localStorage.setItem('pendingListingData', JSON.stringify(listingData));
      localStorage.setItem('pendingPaymentType', 'listing');
      localStorage.setItem('pendingOrderId', data.orderId);
      localStorage.setItem('pendingPaymentSessionId', data.paymentSessionId);
      setIsProcessingListing(false);
      paymentInProgress.current = false;
      navigate('/payment', {
        state: {
          orderId: data.orderId,
          paymentSessionId: data.paymentSessionId,
          listingData,
          type: 'listing'
        }
      });
    } catch (err) {
      setMessage('Failed to initiate payment. Please try again.');
      setMessageType('error');
      setIsProcessingListing(false);
      paymentInProgress.current = false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
        <p className="text-purple-300 text-xl ml-4">Loading Dashboard...</p>
      </div>
    );
  }

  const getListingButtonTooltip = () => {
    if (isProcessingListing) return "Processing payment...";
    if (!isProfileComplete) return "Please complete your profile first to get listed.";
    return `Pay ₹${LISTING_FEE} to get listed and found by students.`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-indigo-100 to-purple-100 text-slate-900 font-inter p-4 sm:p-6 lg:p-10 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-purple-400/10 to-pink-600/10 rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-indigo-400/10 to-blue-600/10 rounded-full blur-3xl animate-float-slow"></div>
      </div>
      
      <div className="relative z-10">
        {message && (
          <div className={`fixed top-8 left-1/2 -translate-x-1/2 p-4 rounded-xl shadow-lg z-50 flex items-center gap-3 animate-fade-in-down ${
            messageType === 'success' ? 'bg-emerald-600 text-white' :
            messageType === 'error' ? 'bg-red-600 text-white' :
            'bg-blue-600 text-white'
          }`}>
            {messageType === 'success' && <CheckCircle className="w-5 h-5" />}
            {messageType === 'error' && <XCircle className="w-5 h-5" />}
            {messageType === 'info' && <Info className="w-5 h-5" />}
            <span className="font-semibold">{message}</span>
          </div>
        )}

        <nav className="w-full flex items-center justify-between px-4 py-4 md:px-10 md:py-4 bg-white/70 shadow-sm rounded-b-2xl border-b border-white/40">
          <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => navigate('/')} title="Go to Home">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-black leading-tight">Yuvsiksha</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end mr-2">
              <span className="font-semibold text-slate-800 text-base">
                {currentUser?.firstName ? `${currentUser.firstName} ${currentUser.lastName || ''}` : 
                teacherProfile.firstName ? `${teacherProfile.firstName} ${teacherProfile.lastName || ''}` : 
                'Teacher Name'}
              </span>
              <span className="text-xs text-slate-500">
                {currentUser?.email || teacherProfile.email || 'teacher@email.com'}
              </span>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-purple-300 bg-white shadow overflow-hidden">
              <img
                src={profilePicture}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                  setProfileImageError(true);
                }}
                onLoad={() => {
                  setProfileImageError(false);
                }}
              />
            </div>
            <button
              onClick={async () => {
                try {
                  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
                } catch (err) {
                  // Ignore network errors, still clear local data
                }
                setToLocalStorage('currentUser', null);
                localStorage.removeItem('token');
                navigate('/login');
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/80 text-purple-700 font-semibold shadow transition-all duration-200 hover:bg-red-100 hover:text-red-600 hover:border-red-300 border border-transparent"
              style={{ cursor: 'pointer' }}
              title="Logout"
            >
              <LogOut className="w-5 h-5" /> Logout
            </button>
          </div>
        </nav>
        <div className="w-full flex flex-col items-center mt-2 mb-8">
          <div className="flex items-center gap-3 mb-1">
            <span className="p-2 bg-purple-100 rounded-lg">
              <LayoutDashboard className="w-7 h-7 text-purple-600" />
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-purple-700 tracking-tight">Teacher Dashboard</h1>
          </div>
          <p className="text-lg text-slate-700 mt-1">Welcome back, <span className="font-semibold text-purple-700">{currentUser?.firstName ? currentUser.firstName : 'Teacher'}</span>!</p>
        </div>
        {!isProfileComplete && (
          <section className="bg-red-800/50 border-l-4 border-red-500 text-red-200 p-4 rounded-r-lg shadow-lg mb-8 flex flex-col sm:flex-row items-center justify-between animate-fade-in-down">
            <div className="flex items-center gap-4 mb-4 sm:mb-0">
              <Settings className="w-8 h-8 text-red-400" />
              <div>
                <h2 className="font-bold text-lg">Action Required: Complete Your Profile</h2>
                <p className="text-sm">Your profile is incomplete. Finish setup to get listed and connect with students.</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/teacher/profile-setup')}
              className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-300 flex items-center gap-2 shadow-sm font-semibold"
            >
              Complete Profile <ArrowRight className="w-4 h-4" />
            </button>
          </section>
        )}

        <main className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 xl:gap-8">
            <DashboardCard icon={ListChecks} title="Listing Status">
              <div className="text-center flex flex-col items-center justify-center h-full space-y-4">
                {isListedStatus ? (
                  <>
                    <CheckCircle className="w-12 h-12 text-emerald-500 mb-3 animate-fade-in" />
                    <p className="text-emerald-600 font-bold text-lg">You are Listed!</p>
                    <p className="text-slate-600 text-sm mt-1">Students can now find and book you.</p>
                    {(teacherProfile.listedAt || currentUser?.listedAt) && (
                      <p className="text-slate-500 text-xs mt-2 bg-white/40 backdrop-blur-sm px-3 py-1 rounded-full border border-white/30">
                        Listed since: {new Date(teacherProfile.listedAt || currentUser.listedAt).toLocaleDateString()}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <Info className="w-12 h-12 text-amber-500 mb-3 animate-fade-in" />
                    <p className="text-amber-600 font-bold text-lg">Not Yet Listed</p>
                    <p className="text-slate-600 text-sm mt-1 mb-4">Appear in searches and receive bookings.</p>
                    <button
                      onClick={handleGetListed}
                      disabled={isProcessingListing || !isProfileComplete}
                      title={getListingButtonTooltip()}
                      className={`mt-4 px-5 py-2.5 rounded-xl text-white font-medium flex items-center gap-2 transition-all duration-300 shadow-lg text-sm
                        disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none
                        ${isProfileComplete ? 'bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 transform hover:scale-105' : 'bg-gray-600'}`}
                    >
                      {isProcessingListing ? (
                        <> <Loader2 className="w-4 h-4 animate-spin" /> Processing... </>
                      ) : (
                        <> <Wallet className="w-4 h-4" /> Get Listed (₹{LISTING_FEE} Fee) </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </DashboardCard>
            <DashboardCard icon={DollarSign} title="Your Summary">
              {statsLoading ? (
                <StatSkeleton />
              ) : (
                <div className="space-y-4">
                  <StatRow label="Upcoming Sessions" value={stats.upcomingSessions} />
                  <StatRow label="Total Sessions" value={stats.totalSessions} />
                  <StatRow
                    label="Total Earnings"
                    value={stats.totalEarnings.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                  />
                  {stats.upcomingSessions === 0 && stats.totalSessions === 0 && stats.totalEarnings === 0 && (
                    <div className="mt-4 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-blue-700 text-xs font-medium flex items-center gap-1 whitespace-nowrap overflow-x-auto">
                        <Info className="w-4 h-4 text-blue-400" />
                        Data will update when you receive bookings and inquiries.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </DashboardCard>
            <DashboardCard icon={LayoutDashboard} title="Quick Actions">
              <ul className="space-y-3">
                {[
                  { label: 'View Profile', icon: UserRound, path: '/teacher/profile' },
                  { label: 'View Bookings', icon: Users, path: '/teacher/bookings', badge: unreadBookingCount },
                  { label: 'View Schedule', icon: CalendarDays, path: '/teacher/schedule' },
                  { label: 'Messages', icon: MessageSquare, path: '/teacher/messages', badge: unreadMessageCount }
                ].map(({ label, icon: Icon, path, badge }) => (
                  <li key={path}>
                    <button
                      onClick={() => handleNavigation(path, label === 'Messages' ? 'messages' : label === 'View Bookings' ? 'bookings' : null)}
                      className="w-full flex items-center gap-3 p-3 bg-white/40 backdrop-blur-sm text-slate-800 rounded-xl hover:bg-white/60 hover:text-purple-700 transition-all duration-200 font-medium border border-white/30 hover:border-white/50 transform hover:scale-[1.01] shadow-sm hover:shadow-md relative"
                    >
                      <Icon className="w-5 h-5 text-purple-500" />
                      <span className="text-sm">{label}</span>
                      {badge > 0 && (
                        <span className="absolute right-4 top-2 bg-red-600 text-white text-xs rounded-full px-2 py-0.5 font-bold animate-pulse">
                          {badge}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </DashboardCard>
            <DashboardCard icon={MonitorCheck} title="Recent Activity" className="md:col-span-2 xl:col-span-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-slate-800">Latest Bookings</h3>
                <button
                  onClick={() => navigate('/teacher/bookings')}
                  className="text-sm text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1"
                >
                  View all <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                {statsLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
                    <p className="text-gray-400 text-lg font-medium">Loading bookings...</p>
                  </div>
                ) : recentBookings && recentBookings.length > 0 ? (
                  recentBookings.slice(0, 5).map((booking) => (
                    <div
                      key={booking.id || booking._id}
                      className="p-5 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-50 rounded-lg">
                            <User className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Student</p>
                            <p className="font-medium text-slate-800">{booking.student?.name || 'SK ABBASUDDIN'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <BookOpen className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Subject</p>
                            <p className="font-medium text-slate-800">{booking.subject || 'Mathematics'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-50 rounded-lg">
                            <CalendarDays className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Date</p>
                            <p className="font-medium text-slate-800">
                              {booking.date ? new Date(booking.date).toLocaleDateString() : '9/26/2025'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-amber-50 rounded-lg">
                            <Clock className="w-5 h-5 text-amber-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Time</p>
                            <p className="font-medium text-slate-800">
                              {booking.time || '19:00 - 20:00'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-50 rounded-lg">
                            <DollarSign className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Amount</p>
                            <p className="font-medium text-slate-800">
                              ₹{booking.amount || '800'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Status</p>
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              booking.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                              booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                              booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                              booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {booking.status ? booking.status.charAt(0).toUpperCase() + booking.status.slice(1) : 'Confirmed'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <MonitorCheck className="w-16 h-16 text-gray-400 mx-auto mb-4 opacity-30" />
                    <p className="text-gray-500 text-lg font-medium">No bookings yet</p>
                    <p className="text-gray-400 text-sm mt-2">
                      When students book sessions with you, they'll appear here.
                    </p>
                  </div>
                )}
              </div>
            </DashboardCard>
          </div>
        </main>
        <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.05);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(139, 92, 246, 0.5);
            border-radius: 10px;
            transition: background 0.2s;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(139, 92, 246, 0.7);
          }
          @keyframes fadeInDown {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fade-in-down {
            animation: fadeInDown 0.5s ease-out forwards;
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .animate-fade-in {
            animation: fadeIn 0.3s ease-out forwards;
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          .animate-pulse-slow {
            animation: pulse 2s ease-in-out infinite;
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-6px); }
          }
          .animate-float {
            animation: float 3s ease-in-out infinite;
          }
        `}</style>
      </div>
    </div>
  );
}