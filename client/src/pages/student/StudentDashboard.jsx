import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Home,
  Loader2,
  Bell,
  Search,
  ChevronDown,
  ChevronUp,
  LogOut,
  MessageSquare,
  User,
  ClipboardPenLine,
  ChevronLeft,
  ChevronRight,
  Menu,
  Calendar,
  Clock,
  Users,
  Heart,
  Video,
  MapPin,

  TrendingUp,
  Bookmark,
  BookCheck,
  Star,
  GraduationCap,
  AlertTriangle,
  
} from 'lucide-react';

// --- Context for Current User ---
// This prevents prop drilling and ensures user data is consistently available.
const UserContext = createContext(null);

// --- Helper Functions for Local Storage Consistency ---
// Importing directly from the utility file
import { getFromLocalStorage, setToLocalStorage } from '../utils/storage';
import { useNotifications } from '../../contexts/NotificationContext';
import API_CONFIG from '../../config/api';
// --- End Helper Functions ---

// --- Sample Data (replace with your actual data fetching logic) ---
const getSampleStudentData = (firstName = 'Student', recommendedTeachers = [], favoritesCount = 0) => {
  return {
    firstName: firstName,
    lastName: 'User',
    email: 'student@example.com',
    profilePic: 'https://via.placeholder.com/150/9CA3AF/FFFFFF?text=SU',
    stats: {
      upcomingSessions: 0,
      completedSessions: 0,
      favoriteTeachers: favoritesCount,
      totalSpent: 0
    },
    upcomingSessions: [],
    recentTeachers: recommendedTeachers,
    notifications: []
  };
};

// --- Sub-Components ---

const SidebarButton = ({ icon: Icon, text, onClick, isActive, count, isCollapsed = false }) => {
  return (
    <div className="relative">
      <button
        onClick={onClick}
        className={`group flex items-center w-full rounded-xl text-left font-medium transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg overflow-hidden ${
          isCollapsed ? 'p-3 justify-center' : 'p-3'
        } ${
          isActive
            ? 'bg-blue-600 text-white shadow-lg'
            : 'text-slate-700 hover:bg-white/60 hover:text-blue-600 hover:backdrop-blur-sm'
        }`}
        title={isCollapsed ? text : ''}
      >
        <Icon className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'} ${isActive ? 'text-white' : 'text-slate-600 group-hover:text-blue-600'} transition-colors duration-300 flex-shrink-0`} />
        {!isCollapsed && (
          <span className="transition-all duration-300 truncate">{text}</span>
        )}
      </button>
      {isCollapsed && count > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border border-white shadow-sm">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </div>
  );
};

const MainHeader = ({ currentUser }) => {
  // Use notification context
  const { unreadCount } = useNotifications();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 18) return 'Afternoon';
    return 'Evening';
  };

  const handleLogout = () => {
    setToLocalStorage('currentUser', null); // Clear current user on logout
    navigate('/login');
  };

  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900 mb-2">
          Good {getTimeOfDay()}, <span className="text-blue-600">{currentUser.firstName}!</span>
        </h1>
        <p className="text-slate-600 text-lg">Welcome back to your personalized dashboard.</p>
      </div>
      <div className="flex items-center space-x-4 relative">
        <div className="relative">
          <input
            type="text"
            placeholder="Search anything..."
            className="pl-10 pr-4 py-2 bg-white/70 backdrop-blur-sm border border-white/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-slate-700 placeholder-slate-400 shadow-sm"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        </div>

        <button
          onClick={() => navigate('/notifications')}
          className="relative p-3 bg-white/70 backdrop-blur-sm rounded-xl hover:bg-white/80 transition-all duration-200 shadow-sm"
        >
          <Bell className="w-5 h-5 text-slate-700" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white animate-bounce-once">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        <div
          className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg cursor-pointer transform hover:scale-105 transition-all duration-200"
          onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
        >
          {currentUser.firstName.charAt(0)}{currentUser.lastName.charAt(0)}
        </div>

        {profileDropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl py-2 z-50 animate-fade-in-down transform scale-95 origin-top-right transition-all duration-200">
            <div className="flex items-center space-x-3 px-4 py-3 border-b border-slate-100 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-md"> {/* Theme accent */}
                {currentUser.firstName.charAt(0)}{currentUser.lastName.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-slate-800">{currentUser.firstName} {currentUser.lastName}</p>
                <p className="text-sm text-slate-500">{currentUser.email}</p>
              </div>
            </div>
            <Link to={currentUser.role === 'student' ? "/student/profile" : "/teacher/profile"} className="flex items-center px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors duration-150">
              <User className="w-4 h-4 mr-2 text-purple-500" /> {/* Theme accent */}
              View Profile
            </Link>
            <div className="border-t border-slate-100 mt-2 pt-2">
              <button onClick={handleLogout} className="flex items-center w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors duration-150">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// SessionCard component for displaying each session in the dashboard
const SessionCard = ({ session, onViewDetail }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  return (
    <div className="bg-white/80 rounded-xl p-4 border border-slate-200 shadow hover:shadow-lg transition-all duration-200">
      <div className="mb-2">
        <div className="flex-1">
          <h4 className="font-semibold text-slate-800 text-base">{session.teacherName}</h4>
          <div className="flex items-center text-xs text-slate-500">
            {formatDate(session.date)}
            <span className="ml-3">{session.time} ({session.duration}h)</span>
          </div>
        </div>
      </div>
      <div className="flex items-center text-sm text-slate-700 mb-2">
        <span className="font-medium">Subject:</span>&nbsp;{session.subject}
      </div>
      <div className="flex items-center text-sm text-slate-700 mb-2">
        <span className="font-medium">Amount Paid:</span>&nbsp;₹{session.amount}
      </div>
      <button 
        className="w-full mt-2 bg-gradient-to-r from-purple-600 to-violet-600 text-white py-2 px-3 rounded-lg text-sm font-semibold hover:from-purple-700 hover:to-violet-700 transition-all duration-200"
        onClick={() => onViewDetail(session)}
      >
        View Details
      </button>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color, description }) => {
  // Theme-consistent colors for stat cards
  const colorClasses = {
    // These match the Signup header gradients
    primary: 'from-violet-600 to-indigo-600',
    secondary: 'from-purple-600 to-pink-600',
    accent: 'from-blue-600 to-cyan-600', // A new addition for variety within the theme
    success: 'from-emerald-500 to-green-600',
  };

  const gradient = colorClasses[color] || colorClasses.primary; // Default to primary if color not found

  return (
    <div className={`relative p-6 bg-white/60 backdrop-blur-sm rounded-2xl shadow-sm border border-white/40 overflow-hidden transform hover:scale-[1.02] transition-all duration-300 hover:shadow-lg group`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-300`}></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          <div className={`p-2 rounded-full text-white bg-gradient-to-br ${gradient} shadow-md`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        <p className="text-4xl font-bold text-gray-900 mb-2">{value}</p>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
};


// Modal for session details
const SessionDetailModal = ({ session, onClose }) => {
  if (!session) return null;
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };
  // Try to get teacher name from multiple possible properties
  const teacherName = session.teacherName || (session.teacher && session.teacher.name) || session.teacher || 'N/A';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md relative animate-fade-in">
        <button className="absolute top-3 right-3 text-slate-400 hover:text-red-500 text-xl" onClick={onClose}>&times;</button>
        <h2 className="text-2xl font-bold mb-4 text-purple-700">Session Details</h2>
        <div className="space-y-2 text-slate-700">
          <div><span className="font-semibold">Teacher:</span> {teacherName}</div>
          <div><span className="font-semibold">Subject:</span> {session.subject}</div>
          <div><span className="font-semibold">Date & Time:</span> {formatDate(session.date)} ({session.time})</div>
          <div><span className="font-semibold">Duration:</span> {session.duration} hour(s)</div>
          <div><span className="font-semibold">Amount Paid:</span> ₹{session.amount}</div>
          {session.notes && <div><span className="font-semibold">Notes:</span> {session.notes}</div>}
        </div>
      </div>
    </div>
  );
};

const TeacherCard = ({ teacher, onToggleFavorite }) => {
  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/40 hover:bg-white/80 transition-all duration-200 hover:shadow-lg transform hover:scale-[1.02]">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <img 
            src={teacher.image} 
            alt={teacher.name}
            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
          />
          <div>
            <h4 className="font-semibold text-slate-800 text-sm">{teacher.name}</h4>
            <p className="text-slate-600 text-xs">{teacher.experience}</p>
          </div>
        </div>
        <button 
          onClick={() => onToggleFavorite && onToggleFavorite(teacher.id)}
          className={`p-2 rounded-full transition-all duration-200 ${
            teacher.isFavorite 
              ? 'text-red-500 bg-red-50 hover:bg-red-100' 
              : 'text-slate-400 hover:text-red-500 hover:bg-red-50'
          }`}
        >
          <Heart className={`w-4 h-4 ${teacher.isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>
      
      <div className="space-y-2 mb-3">
        <div className="flex flex-wrap gap-1">
          {teacher.subjects.slice(0, 2).map((subject, index) => (
            <span key={index} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
              {subject}
            </span>
          ))}
        </div>
        
        <div className="flex items-center justify-between text-xs text-slate-600">
          {teacher.rating > 0 && (
            <div className="flex items-center">
              <Star className="w-3 h-3 text-yellow-500 fill-current mr-1" />
              <span>{teacher.rating}</span>
            </div>
          )}
          {teacher.students > 0 && (
            <div className="flex items-center">
              <Users className="w-3 h-3 mr-1" />
              <span>{teacher.students} students</span>
            </div>
          )}
          {teacher.rating === 0 && teacher.students === 0 && (
            <div className="flex items-center text-slate-400">
              <span>New teacher</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center text-sm font-semibold text-slate-800">
          <span className="text-green-600 mr-1">₹</span>
          {teacher.hourlyRate}/hour
        </div>
      </div>
    </div>
  );
};

const NotificationItem = ({ notification }) => {
  const notificationIcon = {
    session: <Calendar className="w-5 h-5 text-purple-500" />,
    booking: <BookCheck className="w-5 h-5 text-emerald-500" />,
    reminder: <Bell className="w-5 h-5 text-amber-500" />,
    message: <MessageSquare className="w-5 h-5 text-blue-500" />,
    alert: <AlertTriangle className="w-5 h-5 text-red-500" />,
  };

  return (
    <div className={`flex items-start p-4 rounded-xl transition-all duration-300 transform hover:scale-[1.01] hover:shadow-md ${notification.read ? 'bg-slate-50 text-slate-600' : 'bg-purple-50 text-slate-800 font-medium border border-purple-200'}`}> {/* Theme accent */}
      <div className="mr-3 flex-shrink-0">
        {notificationIcon[notification.type] || <Bell className="w-5 h-5 text-slate-400" />}
      </div>
      <div className="flex-1">
        <p className="text-sm">{notification.message}</p>
        <p className="text-xs text-slate-500 mt-1">{notification.time}</p>
      </div>
      {!notification.read && (
        <span className="ml-3 w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
      )}
    </div>
  );
};

// --- Main StudentDashboard Component ---
const StudentDashboard = () => {
  const [selectedSession, setSelectedSession] = useState(null);
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [activeMenuItem, setActiveMenuItem] = useState('dashboard'); // State for active sidebar item
  const [dashboardData, setDashboardData] = useState(null); // All data for the dashboard
  const [mockTeachers, setMockTeachers] = useState([]); // For storing teacher data
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // State for sidebar collapse
  const [loading, setLoading] = useState(false); // For loading state
  const [favorites, setFavorites] = useState([]); // For storing favorite teacher IDs
  const [favoriteTeachersData, setFavoriteTeachersData] = useState([]); // For storing favorite teacher objects
  
  // Use notification context
  const { unreadCount } = useNotifications();

  // Load favorites from localStorage on component mount
  // Fetch dashboard stats from backend
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) return;
        const API_BASE_URL = API_CONFIG.BASE_URL;
        // Fetch bookings
        const bookingsRes = await fetch(`${API_BASE_URL}/api/bookings/student?status=all&limit=1000`, {
          headers: { 'Authorization': `Bearer ${token.replace(/^"|"$/g, '')}` }
        });
        const bookingsData = await bookingsRes.json();
        const bookings = bookingsData.bookings || [];
        // Fetch favourites (IDs)
        const favRes = await fetch(`${API_BASE_URL}/api/profile/favourites`, {
          headers: { 'Authorization': `Bearer ${token.replace(/^"|"$/g, '')}` }
        });
        const favData = await favRes.json();
        const favs = favData.favourites || [];
        setFavorites(favs);
        // Fetch favorite teacher objects
        let favTeachersArr = [];
        if (favs.length > 0) {
          // You may have an endpoint to fetch multiple teachers by IDs, otherwise fetch one by one
          favTeachersArr = await Promise.all(favs.map(async (id) => {
            const res = await fetch(`${API_BASE_URL}/api/teachers/${id}`, {
              headers: { 'Authorization': `Bearer ${token.replace(/^"|"$/g, '')}` }
            });
            if (res.ok) return await res.json();
            return null;
          }));
          favTeachersArr = favTeachersArr.filter(Boolean);
        }
        setFavoriteTeachersData(favTeachersArr);
        // Calculate stats
        const completedSessions = bookings.filter(b => b.status === 'completed').length;
        const upcomingSessions = bookings.filter(b => b.status !== 'completed' && b.status !== 'cancelled' && b.status !== 'rejected').length;
        const totalSpent = bookings.reduce((sum, b) => sum + (b.amount || 0), 0);
        // For the section, filter upcoming sessions within the next month
        const now = new Date();
        const oneMonthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const upcomingSessionsList = bookings.filter(b => {
          if (b.status === 'completed' || b.status === 'cancelled' || b.status === 'rejected') return false;
          const sessionDate = new Date(b.date);
          return sessionDate >= now && sessionDate <= oneMonthLater;
        });
        setDashboardData(prev => ({
          ...prev,
          stats: {
            ...prev?.stats,
            completedSessions,
            upcomingSessions,
            favoriteTeachers: favs.length,
            totalSpent
          },
          upcomingSessions: upcomingSessionsList,
          allSessions: bookings // <-- add all sessions for My Sessions tab
        }));
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardStats();
  }, []);

  // Update teacher favorite status when favorites change
  useEffect(() => {
    console.log('ðŸ”„ Favorites changed, updating dashboard data:', favorites);
    console.log('ðŸ“Š Current dashboard teachers:', dashboardData?.recentTeachers?.length || 0);
    
    if (dashboardData?.recentTeachers?.length > 0) {
      const updatedTeachers = dashboardData.recentTeachers.map(teacher => ({
        ...teacher,
        isFavorite: favorites.includes(teacher.id)
      }));
      
      console.log('ðŸŽ¯ Updated teachers with favorites:', updatedTeachers.map(t => ({ name: t.name, id: t.id, isFavorite: t.isFavorite })));
      
      setDashboardData(prevData => ({
        ...prevData,
        recentTeachers: updatedTeachers,
        stats: {
          ...prevData.stats,
          favoriteTeachers: favorites.length
        }
      }));
    }
  }, [favorites]); // Re-run when favorites change

  // Effect to load current user and dashboard data
  useEffect(() => {
    // Correctly use the imported getFromLocalStorage
    const user = getFromLocalStorage('currentUser', null);
    
    if (!user) {
      navigate('/login');
      return;
    }
    
    // For simplicity, directly set sample data. In a real app, you'd fetch this.
    setCurrentUser(user);
    const sampleData = getSampleStudentData(user.firstName, [], favorites.length);
    setDashboardData(sampleData);

    // Simulate real-time updates for notifications (e.g., mark as read)
    const interval = setInterval(() => {
      setDashboardData(prevData => {
        if (!prevData) return prevData;
        const unreadNotifications = prevData.notifications.filter(n => !n.read);
        if (unreadNotifications.length > 0) {
          const updatedNotifications = prevData.notifications.map(n =>
            n.id === unreadNotifications[0].id ? { ...n, read: true } : n
          );
          return { ...prevData, notifications: updatedNotifications };
        }
        return prevData;
      });
    }, 15000); // Mark one unread notification as read every 15 seconds

    return () => clearInterval(interval);
  }, [navigate]);

  // Update the fetchTeachers function to only get listed teachers
  const fetchTeachers = async () => {
    try {
      setLoading(true);
      console.log('ðŸ” Fetching teachers...');
      
      // Try API first
      let token = localStorage.getItem('token');
      if (token) {
        // Remove any extra quotes from token
        if (typeof token === 'string') {
          token = token.replace(/^"|"$/g, '');
        }
        try {
          const API_BASE_URL = API_CONFIG.BASE_URL;
          const cleanToken = token.replace(/^"(.*)"$/, '$1');
          const url = `${API_BASE_URL}${API_CONFIG.ENDPOINTS.TEACHERS_LIST}`;
          
          console.log('ðŸ“¡ Fetching teachers from:', url);
          
          const response = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${cleanToken}`
            }
          });
          
          console.log('ðŸ“Š Teachers API response status:', response.status);
          
          if (response.ok) {
            const teachersData = await response.json();
            console.log('âœ… Teachers API data:', teachersData);
            
            // Check if it's the debug format or direct teachers array
            const teachers = teachersData.teachers || teachersData;
            console.log('ðŸ‘¥ Teachers array:', teachers);
            
            setMockTeachers(teachers);
            const formattedTeachers = formatTeachersForDashboard(teachers);
            // Get 3 random teachers for recommendations
            const randomTeachers = getRandomTeachers(formattedTeachers, 3);
            setDashboardData(prevData => ({
              ...prevData,
              recentTeachers: randomTeachers
            }));
            return;
          }
        } catch (apiError) {
          console.log('API not available, using localStorage...', apiError);
        }
      }
      
      // Fallback to localStorage - only show listed teachers
      console.log('ðŸ“¦ Falling back to localStorage...');
      const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
      console.log('ðŸ‘¥ All users in localStorage:', allUsers.length);
      
      const listedTeachers = allUsers.filter(user => 
        user.role === 'teacher' && 
        user.teacherProfile && 
        user.teacherProfile.isListed === true // Only listed teachers
      );
      
      console.log('âœ… Listed teachers from localStorage:', listedTeachers.length, listedTeachers);
      
      setMockTeachers(listedTeachers);
      const formattedTeachers = formatTeachersForDashboard(listedTeachers);
      
      // Get 3 random teachers for recommendations
      const randomTeachers = getRandomTeachers(formattedTeachers, 3);
      setDashboardData(prevData => ({
        ...prevData,
        recentTeachers: randomTeachers
      }));
      
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get random teachers for recommendations
  const getRandomTeachers = (teachers, count = 3) => {
    if (!teachers || teachers.length === 0) return [];
    
    // If we have fewer teachers than requested, return all
    if (teachers.length <= count) return teachers;
    
    // Shuffle array using Fisher-Yates algorithm and take first 'count' items
    const shuffled = [...teachers].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  // Helper function to format teachers for dashboard display
  const formatTeachersForDashboard = (teachers) => {
    console.log('ðŸ”„ Formatting teachers for dashboard:', teachers.length, 'teachers');
    console.log('ðŸ“‹ Current favorites:', favorites);
    
    return teachers.map(teacher => {
      // Handle both possible data structures for subjects
      const subjects = teacher.teacherProfile?.subjectsTaught || 
                      teacher.teacherProfile?.subjects || 
                      [];
      const boards = teacher.teacherProfile?.boardsTaught || 
                    teacher.teacherProfile?.boards || 
                    [];

      const teacherId = teacher._id || teacher.id || `teacher_${Date.now()}_${Math.random()}`;
      const isFavorite = favorites.includes(teacherId);
      
      console.log(`ðŸ‘¨â€ðŸ« Teacher: ${teacher.firstName} ${teacher.lastName}, ID: ${teacherId}, isFavorite: ${isFavorite}`);

      return {
        id: teacherId,
        name: `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || 'Teacher',
        experience: `${teacher.teacherProfile?.experienceYears || 1} years experience`,
        image: teacher.teacherProfile?.photoUrl || teacher.profilePicture || `https://via.placeholder.com/150/9CA3AF/FFFFFF?text=${(teacher.firstName || 'T').charAt(0)}`,
        subjects: Array.isArray(subjects) ? subjects.map(s => s.text || s).slice(0, 3) : [subjects].filter(Boolean).slice(0, 3),
        rating: teacher.rating || 0, // Don't show rating if not available
        students: teacher.totalStudents || 0, // Don't show student count if not available
        hourlyRate: teacher.teacherProfile?.hourlyRate || 500,
        isFavorite: isFavorite, // Check if teacher is in current favorites
        bio: teacher.teacherProfile?.bio || 'Experienced educator dedicated to student success.',
        email: teacher.email,
        phone: teacher.teacherProfile?.phone,
        location: teacher.teacherProfile?.location || 'India',
        teachingMode: teacher.teacherProfile?.teachingMode || 'hybrid',
        availability: teacher.teacherProfile?.availability || []
      };
    });
  };

  // Function to add demo teachers for testing
  const addDemoTeachers = () => {
    const demoTeachers = [
      {
        _id: "teacher1",
        firstName: "Anita",
        lastName: "Sharma",
        email: "anita.sharma@example.com",
        role: "teacher",
        profileComplete: true,
        rating: 4.8,
        totalStudents: 150,
        teacherProfile: {
          isListed: true,
          experienceYears: 8,
          hourlyRate: 800,
          subjectsTaught: ["Mathematics", "Physics"],
          boardsTaught: ["CBSE", "ICSE"],
          bio: "Experienced mathematics teacher with a passion for making complex concepts simple.",
          location: "Delhi, India",
          teachingMode: "both",
          photoUrl: "https://images.unsplash.com/photo-1494790108755-2616b332f-1/crop=faces&fit=crop&w=256&h=256",
          phone: "+91-9876543210",
          qualifications: "M.Sc Mathematics, B.Ed",
          availability: [
            { day: "Monday", slots: ["9:00 AM", "2:00 PM"] },
            { day: "Wednesday", slots: ["10:00 AM", "3:00 PM"] },
            { day: "Friday", slots: ["11:00 AM", "4:00 PM"] }
          ]
        }
      },
      {
        _id: "teacher2",
        firstName: "Rajesh",
        lastName: "Kumar",
        email: "rajesh.kumar@example.com",
        role: "teacher",
        profileComplete: true,
        rating: 4.6,
        totalStudents: 120,
        teacherProfile: {
          isListed: true,
          experienceYears: 6,
          hourlyRate: 650,
          subjectsTaught: ["Chemistry", "Biology"],
          boardsTaught: ["CBSE", "NCERT"],
          bio: "Dedicated science teacher helping students excel in chemistry and biology.",
          location: "Mumbai, India",
          teachingMode: "online",
          photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d/crop=faces&fit=crop&w=256&h=256",
          phone: "+91-9876543211",
          qualifications: "M.Sc Chemistry, B.Ed",
          availability: [
            { day: "Tuesday", slots: ["9:00 AM", "2:00 PM"] },
            { day: "Thursday", slots: ["10:00 AM", "3:00 PM"] },
            { day: "Saturday", slots: ["11:00 AM", "4:00 PM"] }
          ]
        }
      },
      {
        _id: "teacher3",
        firstName: "Priya",
        lastName: "Patel",
        email: "priya.patel@example.com",
        role: "teacher",
        profileComplete: true,
        rating: 4.9,
        totalStudents: 200,
        teacherProfile: {
          isListed: true,
          experienceYears: 10,
          hourlyRate: 900,
          subjectsTaught: ["English", "Literature"],
          boardsTaught: ["CBSE", "ICSE", "IB"],
          bio: "English language expert with a decade of experience in literature and creative writing.",
          location: "Bangalore, India",
          teachingMode: "both",
          photoUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80/crop=faces&fit=crop&w=256&h=256",
          phone: "+91-9876543212",
          qualifications: "M.A English Literature, B.Ed",
          availability: [
            { day: "Monday", slots: ["8:00 AM", "1:00 PM"] },
            { day: "Wednesday", slots: ["9:00 AM", "2:00 PM"] },
            { day: "Friday", slots: ["10:00 AM", "3:00 PM"] }
          ]
        }
      }
    ];

    // Get existing users
    const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Add demo teachers if they don't exist
    demoTeachers.forEach(teacher => {
      const exists = existingUsers.find(user => user.email === teacher.email);
      if (!exists) {
        existingUsers.push(teacher);
      }
    });
    
    // Save back to localStorage
    localStorage.setItem('users', JSON.stringify(existingUsers));
    
    // Refresh teachers
    fetchTeachers();
    
    console.log('Demo teachers added successfully!');
  };

  // Debug function to test favorites API
  const testFavoritesAPI = async () => {
    try {
      const token = localStorage.getItem('token');
      const cleanToken = token?.replace(/^"(.*)"$/, '$1');
      const API_BASE_URL = API_CONFIG.BASE_URL;
      
      console.log('ðŸ§ª Testing favorites API...');
      console.log('ðŸ“¡ URL:', `${API_BASE_URL}/api/profile/favourites`);
      console.log('ðŸ”‘ Token:', cleanToken?.substring(0, 20) + '...');
      
      const response = await fetch(`${API_BASE_URL}/api/profile/favourites`, {
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('âœ… Response status:', response.status);
      const data = await response.json();
      console.log('ðŸ“Š Response data:', data);
      
      if (response.ok) {
        alert(`Favorites loaded successfully! Found ${data.favourites?.length || 0} favorite teachers: ${JSON.stringify(data.favourites)}`);
      } else {
        alert(`API Error: ${response.status} - ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('ðŸš¨ API Test Error:', error);
      alert(`Network Error: ${error.message}`);
    }
  };

  // Debug function to check current user
  const testCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const cleanToken = token?.replace(/^"(.*)"$/, '$1');
      const API_BASE_URL = API_CONFIG.BASE_URL;
      
      console.log('ðŸ‘¤ Testing current user...');
      
      const response = await fetch(`${API_BASE_URL}/api/profile`, {
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('âœ… User response status:', response.status);
      const userData = await response.json();
      console.log('ðŸ‘¤ Current user data:', userData);
      
      if (response.ok) {
        alert(`Logged in as: ${userData.firstName} ${userData.lastName}\nUser ID: ${userData._id}\nEmail: ${userData.email}\nRole: ${userData.role}`);
      } else {
        alert(`User API Error: ${response.status} - ${userData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('ðŸš¨ User Test Error:', error);
      alert(`Network Error: ${error.message}`);
    }
  };

  // Function to toggle teacher favorite status
  const toggleFavorite = async (teacherId) => {
    try {
      const token = localStorage.getItem('token');
      const isFav = favorites.includes(teacherId);
      
      if (token) {
        // Use the same API endpoint as teacher list
        try {
          const API_BASE_URL = API_CONFIG.BASE_URL;
          const response = await fetch(`${API_BASE_URL}/api/profile/favourites`, {
            method: isFav ? 'DELETE' : 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ teacherId })
          });
          
          if (response.ok) {
            const data = await response.json();
            const updatedFavorites = data.favourites || [];
            setFavorites(updatedFavorites);
            
            // Update the recentTeachers in dashboard data to reflect favorite changes
            setDashboardData(prevData => ({
              ...prevData,
              recentTeachers: prevData.recentTeachers.map(teacher => ({
                ...teacher,
                isFavorite: updatedFavorites.includes(teacher.id)
              })),
              stats: {
                ...prevData.stats,
                favoriteTeachers: updatedFavorites.length
              }
            }));

            // Also save to localStorage for backup
            localStorage.setItem('favoriteTeachers', JSON.stringify(updatedFavorites));
            return;
          }
        } catch (apiError) {
          console.log('API not available, using localStorage fallback');
        }
      }
      
      // Fallback to localStorage only
      const updatedFavorites = isFav
        ? favorites.filter(id => id !== teacherId)
        : [...favorites, teacherId];
      
      setFavorites(updatedFavorites);
      
      // Update the recentTeachers in dashboard data to reflect favorite changes
      setDashboardData(prevData => ({
        ...prevData,
        recentTeachers: prevData.recentTeachers.map(teacher => ({
          ...teacher,
          isFavorite: updatedFavorites.includes(teacher.id)
        })),
        stats: {
          ...prevData.stats,
          favoriteTeachers: updatedFavorites.length
        }
      }));

      // Save to localStorage
      localStorage.setItem('favoriteTeachers', JSON.stringify(updatedFavorites));
      
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const cleanToken = token.replace(/^"(.*)"$/, '$1');
        let userForDashboard = null;

        // First try to fetch fresh data from backend
        try {
          const response = await fetch('http://localhost:5000/api/profile/student', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${cleanToken}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const profileData = await response.json();
            console.log('Fetched profile data:', profileData);
            // Only redirect if profileComplete is false
            if (!profileData.profileComplete) {
              navigate('/student/profile');
              return;
            }
            setCurrentUser(profileData);
            setToLocalStorage('currentUser', profileData);
            userForDashboard = profileData;
          } else {
            throw new Error('Failed to fetch profile');
          }
        } catch (error) {
          console.warn('Failed to fetch from backend, checking localStorage:', error);
          // Fallback to localStorage
          const currentUser = getFromLocalStorage('currentUser');
          if (!currentUser || !currentUser.profileComplete) {
            navigate('/student/profile');
            return;
          }
          setCurrentUser(currentUser);
          userForDashboard = currentUser;
        }

        // Initialize with basic dashboard data first (without teachers)
        const basicDashboardData = getSampleStudentData(userForDashboard.firstName, [], favorites.length);
        setDashboardData(basicDashboardData);
        
        // Teachers will be fetched by the separate useEffect when favorites are loaded
      } catch (error) {
        console.error('Error loading dashboard:', error);
        navigate('/login');
      }
    };

    fetchData();
  }, [navigate]);

  // Separate effect to refetch teachers when favorites change
  useEffect(() => {
    if (currentUser && favorites.length >= 0) { // >= 0 to handle empty arrays
      console.log('ðŸ”„ Favorites updated, refreshing teacher data...');
      fetchTeachers();
    }
  }, [favorites, currentUser]);

  // No longer needed as we use notification context
  // const unseenNotificationsCount = dashboardData?.notifications.filter(n => !n.read).length || 0;

  if (!currentUser || !dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 text-slate-700">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
          <span className="text-lg">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  // Common Tailwind classes for consistency
  const cardClass = "relative p-6 bg-white/60 backdrop-blur-sm rounded-2xl shadow-sm border border-white/40";
  const sectionTitleClass = "text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3";

  const sidebarClass = `${isSidebarCollapsed ? 'w-24' : 'w-72'} bg-white/80 backdrop-blur-xl border-r border-white/20 ${isSidebarCollapsed ? 'p-4' : 'p-6'} flex flex-col relative overflow-hidden shadow-lg z-10 transition-all duration-300`; 
  const mainContentClass = `flex-1 p-8 overflow-y-auto`;

  return (
    <UserContext.Provider value={currentUser}>
      <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 relative overflow-hidden">
        {/* Animated gradient orbs for background effect */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/30 to-purple-600/30 rounded-full blur-3xl animate-float"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-purple-400/20 to-pink-600/20 rounded-full blur-3xl animate-float-delayed"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-indigo-400/10 to-blue-600/10 rounded-full blur-3xl animate-float-slow"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex min-h-screen w-full">
        {/* Sidebar */}
        <aside className={sidebarClass}>
          <div className="relative z-10 flex flex-col h-full">
            {/* Collapse Toggle Button */}
            <div className={`flex items-center mb-8 ${isSidebarCollapsed ? 'flex-col space-y-4' : 'justify-between'}`}>
              {!isSidebarCollapsed && (
                <Link to="/" className="flex items-center group">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mr-3 transform group-hover:scale-105 transition-all duration-300">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-200">Yuvshiksha</h2>
                    <p className="text-slate-600 text-xs group-hover:text-slate-700 transition-colors duration-200">Student Portal</p>
                  </div>
                </Link>
              )}
              
              {isSidebarCollapsed && (
                <Link to="/" className="group mb-2">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center transform group-hover:scale-105 transition-all duration-300 shadow-lg">
                    <GraduationCap className="w-7 h-7 text-white" />
                  </div>
                </Link>
              )}
              
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className={`p-2 rounded-lg hover:bg-white/60 transition-colors duration-200 text-slate-600 hover:text-blue-600 shadow-sm ${isSidebarCollapsed ? 'w-full' : ''}`}
                title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isSidebarCollapsed ? <ChevronRight className="w-5 h-5 mx-auto" /> : <ChevronLeft className="w-5 h-5" />}
              </button>
            </div>

            <nav className={`flex-1 mb-8 overflow-hidden ${isSidebarCollapsed ? 'space-y-3' : 'space-y-2'}`}>
              <SidebarButton
                icon={Home}
                text="Dashboard"
                onClick={() => setActiveMenuItem('dashboard')}
                isActive={activeMenuItem === 'dashboard'}
                isCollapsed={isSidebarCollapsed}
              />
              <SidebarButton
                icon={Calendar}
                text="My Sessions"
                onClick={() => setActiveMenuItem('sessions')}
                isActive={activeMenuItem === 'sessions'}
                count={dashboardData?.upcomingSessions?.length || 0}
                isCollapsed={isSidebarCollapsed}
              />
              <SidebarButton
                icon={Bookmark}
                text="Favorites"
                onClick={() => setActiveMenuItem('favorites')}
                isActive={activeMenuItem === 'favorites'}
                count={dashboardData?.recentTeachers?.filter(t => t.isFavorite).length || 0}
                isCollapsed={isSidebarCollapsed}
              />
              
              {/* Navigation Links */}
              <div className="border-t border-white/20 pt-4 mt-4">
                <Link
                  to="/student/find-teachers"
                  className={`flex items-center w-full p-3 text-left text-slate-700 hover:bg-white/40 rounded-xl transition-all duration-200 group overflow-hidden ${isSidebarCollapsed ? 'justify-center' : 'space-x-3'}`}
                  title={isSidebarCollapsed ? 'Find Teachers' : ''}
                >
                  <Search className="w-5 h-5 group-hover:text-blue-600 transition-colors duration-200 flex-shrink-0" />
                  {!isSidebarCollapsed && <span className="group-hover:text-blue-600 transition-colors duration-200 truncate">Find Teachers</span>}
                </Link>
                {/* Messages button hidden as per request */}
              </div>
            </nav>

            <div className="mt-auto">
              <button
                onClick={() => {
                  // Correctly use the imported setToLocalStorage
                  setToLocalStorage('currentUser', null); // Clear current user
                  navigate('/login');
                }}
                className={`w-full bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-lg flex items-center justify-center transform hover:scale-[1.02] hover:-translate-y-1 ${isSidebarCollapsed ? 'py-3 px-3' : 'py-3 space-x-2'}`}
                title={isSidebarCollapsed ? 'Logout' : ''}
              >
                <LogOut className={`w-5 h-5 ${isSidebarCollapsed ? '' : ''}`} />
                {!isSidebarCollapsed && <span>Logout</span>}
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className={mainContentClass}>
          <MainHeader currentUser={currentUser} />

          {activeMenuItem === 'dashboard' && (
            <section className="space-y-10">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Upcoming Sessions"
                  value={dashboardData.stats.upcomingSessions}
                  icon={Calendar}
                  color="primary"
                  description="All time"
                />
                <StatCard
                  title="Completed Sessions"
                  value={dashboardData.stats.completedSessions}
                  icon={BookCheck}
                  color="secondary"
                  description="All time"
                />
                <StatCard
                  title="Favorite Teachers"
                  value={dashboardData.stats.favoriteTeachers}
                  icon={Heart}
                  color="accent"
                  description="Bookmarked"
                />
                <StatCard
                  title="Total Spent"
                  value={`₹${dashboardData.stats.totalSpent.toLocaleString()}`}
                  icon={TrendingUp}
                  color="success"
                  description="Learning investment"
                />
              </div>

              {/* Upcoming Sessions */}
              <div className={cardClass}>
                <h2 className={sectionTitleClass}>
                  <Calendar className="w-7 h-7 text-purple-600" />
                  Upcoming Sessions
                </h2>
                <SessionDetailModal session={selectedSession} onClose={() => setSelectedSession(null)} />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...dashboardData.upcomingSessions]
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .map(session => (
                      <SessionCard key={session.id} session={session} onViewDetail={setSelectedSession} />
                    ))}
                </div>
                {dashboardData.upcomingSessions.length === 0 && (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-500 text-lg mb-4">No upcoming sessions</p>
                    <Link 
                      to="/student/find-teachers"
                      className="inline-flex items-center bg-gradient-to-r from-purple-600 to-violet-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-700 hover:to-violet-700 transition-all duration-200"
                    >
                      <Search className="w-5 h-5 mr-2" />
                      Find Teachers
                    </Link>
                  </div>
                )}
              </div>

              {/* Recommended Teachers */}
              <div className={cardClass}>
                <h2 className={sectionTitleClass}>
                  <Users className="w-7 h-7 text-purple-600" />
                  Recommended Teachers
                </h2>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-600 mr-2" />
                    <span className="text-slate-600">Loading teachers...</span>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {dashboardData.recentTeachers.map(teacher => (
                        <TeacherCard key={teacher.id} teacher={teacher} onToggleFavorite={toggleFavorite} />
                      ))}
                    </div>
                    {dashboardData.recentTeachers.length === 0 && (
                      <div className="text-center py-12">
                        <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-500 text-lg mb-4">No teachers available</p>
                        <div className="space-y-3">
                          <button
                            onClick={addDemoTeachers}
                            className="block mx-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                          >
                            Add Demo Teachers
                          </button>
                          <button
                            onClick={testFavoritesAPI}
                            className="block mx-auto bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-200 mb-2"
                          >
                            Test Favorites API
                          </button>
                          <button
                            onClick={testCurrentUser}
                            className="block mx-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 mb-4"
                          >
                            Check Current User
                          </button>
                          <Link 
                            to="/student/find-teachers"
                            className="inline-flex items-center bg-gradient-to-r from-purple-600 to-violet-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-700 hover:to-violet-700 transition-all duration-200"
                          >
                            <Search className="w-5 h-5 mr-2" />
                            Browse All Teachers
                          </Link>
                        </div>
                      </div>
                    )}
                    {dashboardData.recentTeachers.length > 0 && (
                      <div className="text-center mt-8">
                        <Link 
                          to="/student/find-teachers"
                          className="inline-flex items-center text-purple-600 hover:text-purple-800 font-medium transition-colors duration-200"
                        >
                          View All Teachers
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Link>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Recent Notifications */}
              <div className={cardClass}>
                <h2 className={sectionTitleClass}>
                  <Bell className="w-7 h-7 text-purple-600" />
                  Recent Notifications
                </h2>
                <div className="space-y-4">
                  {dashboardData.notifications.slice(0, 4).map(notification => (
                    <NotificationItem key={notification.id} notification={notification} />
                  ))}
                  {dashboardData.notifications.length === 0 && (
                    <p className="text-slate-500 text-center py-4">No new notifications.</p>
                  )}
                </div>
                {dashboardData.notifications.length > 4 && (
                  <div className="text-center mt-6">
                    <Link to="/student/notifications" className="inline-flex items-center text-purple-600 font-semibold hover:text-purple-800 transition-colors duration-200"> {/* Theme accent */}
                      View All Notifications <ChevronUp className="w-4 h-4 ml-1 transform rotate-90" />
                    </Link>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Individual Section Views */}
          {activeMenuItem === 'sessions' && (
            <section>
              <h2 className={sectionTitleClass}>
                <Calendar className="w-7 h-7 text-purple-600" /> My Sessions
              </h2>
              <div className="space-y-6">
                {dashboardData.allSessions && dashboardData.allSessions
                  .filter(session => ['confirmed','pending','completed','complete','reject','rejected'].includes((session.status||'').toLowerCase()))
                  .sort((a, b) => new Date(a.date) - new Date(b.date))
                  .map(session => (
                    <div key={session.id} className="overflow-x-auto">
                      <div className="bg-white/80 rounded-xl p-4 border border-slate-200 shadow hover:shadow-lg transition-all duration-200 min-w-[320px] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <div className="font-semibold text-slate-800 text-base mb-1">{session.teacherName || (session.teacher && session.teacher.name) || session.teacher || 'N/A'}</div>
                          <div className="flex items-center text-xs text-slate-500 mb-2">
                            {new Date(session.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            <span className="ml-3">{session.time} ({session.duration}h)</span>
                          </div>
                          <div className="flex items-center text-sm text-slate-700 mb-1">
                            <span className="font-medium">Subject:</span>&nbsp;{session.subject}
                          </div>
                          <div className="flex items-center text-sm text-slate-700 mb-1">
                            <span className="font-medium">Amount Paid:</span>&nbsp;₹{session.amount}
                          </div>
                        </div>
                        <div className="mt-2 text-xs font-semibold px-2 py-1 rounded-full w-fit self-start md:self-auto"
                          style={{backgroundColor: session.status === 'completed' || session.status === 'complete' ? '#d1fae5' : session.status === 'confirmed' ? '#e0e7ff' : session.status === 'pending' ? '#fef9c3' : '#fee2e2', color: session.status === 'completed' || session.status === 'complete' ? '#065f46' : session.status === 'confirmed' ? '#3730a3' : session.status === 'pending' ? '#92400e' : '#991b1b'}}>
                          {session.status}
                        </div>
                      </div>
                    </div>
                  ))}
                {(!dashboardData.allSessions || dashboardData.allSessions.length === 0) && (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-500 text-lg mb-4">No sessions scheduled</p>
                    <Link 
                      to="/student/find-teachers"
                      className="inline-flex items-center bg-gradient-to-r from-purple-600 to-violet-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-700 hover:to-violet-700 transition-all duration-200"
                    >
                      <Search className="w-5 h-5 mr-2" />
                      Book Your First Session
                    </Link>
                  </div>
                )}
              </div>
            </section>
          )}

          {activeMenuItem === 'favorites' && (
            <section>
              <h2 className={sectionTitleClass}>
                <Heart className="w-7 h-7 text-purple-600" /> Favorite Teachers
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {favoriteTeachersData.length > 0 ? favoriteTeachersData.map(teacher => {
                  // Normalize teacher object for TeacherCard
                  const normalized = {
                    id: teacher._id || teacher.id || '',
                    name: teacher.name || (teacher.firstName && teacher.lastName ? `${teacher.firstName} ${teacher.lastName}` : teacher.firstName || 'Teacher'),
                    image: teacher.avatar || teacher.photoUrl || teacher.profilePicture || (teacher.teacherProfile && (teacher.teacherProfile.photoUrl || teacher.teacherProfile.profilePicture)) || 'https://via.placeholder.com/150/9CA3AF/FFFFFF?text=T',
                    experience: teacher.experience || (teacher.teacherProfile && teacher.teacherProfile.experience) || '',
                    subjects: (teacher.subjects && Array.isArray(teacher.subjects) ? teacher.subjects : (teacher.teacherProfile && Array.isArray(teacher.teacherProfile.subjects) ? teacher.teacherProfile.subjects : [])),
                    rating: teacher.rating || (teacher.teacherProfile && teacher.teacherProfile.rating) || 0,
                    students: teacher.students || (teacher.teacherProfile && teacher.teacherProfile.students) || 0,
                    hourlyRate: teacher.hourlyRate || (teacher.teacherProfile && teacher.teacherProfile.hourlyRate) || 0,
                    isFavorite: true
                  };
                  // Ensure subjects is always an array of strings
                  normalized.subjects = normalized.subjects.map(s => typeof s === 'string' ? s : (s.text || ''));
                  return <TeacherCard key={normalized.id} teacher={normalized} onToggleFavorite={toggleFavorite} />;
                }) : null}
              </div>
              {favoriteTeachersData.length === 0 && (
                <div className="text-center py-12">
                  <Heart className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-500 text-lg mb-4">No favorite teachers yet</p>
                  <p className="text-slate-400 mb-6">Start exploring and save your favorite teachers for quick access</p>
                  <Link 
                    to="/student/find-teachers"
                    className="inline-flex items-center bg-gradient-to-r from-purple-600 to-violet-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-700 hover:to-violet-700 transition-all duration-200"
                  >
                    <Search className="w-5 h-5 mr-2" />
                    Discover Teachers
                  </Link>
                </div>
              )}
            </section>
          )}

        </main>
        </div>
      </div>
    </UserContext.Provider>
  );
};

export default StudentDashboard;