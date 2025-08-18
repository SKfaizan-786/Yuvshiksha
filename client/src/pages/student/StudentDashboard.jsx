import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Home,
  Loader2,
  BookOpen,
  CalendarDays,
  ListTodo,
  Bell,
  Search,
  ChevronDown,
  ChevronUp,
  LogOut,
  Settings,
  HelpCircle,
  MessageSquare,
  Award,
  BookCheck,
  UserRound,
  GraduationCap,
  Sparkles,
  Zap,
  Globe,
  MonitorCheck,
  ClipboardList,
  Mail,
  User,
  Star,
  ClipboardPenLine,
  Lightbulb,
  FileText,
  BadgeCent,
  Trophy,
  Activity,
  AwardIcon,
  CheckCircle2, // Added for AssignmentCard
  AlertTriangle // Added for AssignmentCard
} from 'lucide-react';

// --- Context for Current User ---
// This prevents prop drilling and ensures user data is consistently available.
const UserContext = createContext(null);

// --- Helper Functions for Local Storage Consistency ---
// Importing directly from the utility file
import { getFromLocalStorage, setToLocalStorage } from '../utils/storage';
// --- End Helper Functions ---

// --- Sample Data (replace with your actual data fetching logic) ---
const getSampleStudentData = (firstName = 'Student') => {
  return {
    firstName: firstName,
    lastName: 'User',
    email: 'student@example.com',
    profilePic: 'https://via.placeholder.com/150/9CA3AF/FFFFFF?text=SU',
    stats: {
      totalCourses: 8,
      completedAssignments: 45,
      upcomingAssignments: 7,
      averageGrade: 88,
    },
    courses: [
      { id: 'c1', name: 'Advanced React Development', progress: 75, grade: 'A-', instructor: 'Dr. Smith', due: '2025-07-15' },
      { id: 'c2', name: 'Calculus III', progress: 90, grade: 'B+', instructor: 'Prof. Johnson', due: '2025-08-01' },
      { id: 'c3', name: 'Modern History', progress: 60, grade: 'N/A', instructor: 'Ms. Davis', due: '2025-07-20' },
      { id: 'c4', name: 'Data Structures', progress: 40, grade: 'C+', instructor: 'Mr. White', due: '2025-09-01' },
    ],
    assignments: [
      { id: 'a1', title: 'React Project Alpha', course: 'Advanced React Development', dueDate: '2025-07-10', status: 'Due', overdue: false },
      { id: 'a2', title: 'Chapter 5 Quiz', course: 'Calculus III', dueDate: '2025-07-12', status: 'Due', overdue: false },
      { id: 'a3', title: 'Essay: Cold War Impacts', course: 'Modern History', dueDate: '2025-07-18', status: 'Due', overdue: false },
      { id: 'a4', title: 'Data Structures Lab 3', course: 'Data Structures', dueDate: '2025-07-25', status: 'Due', overdue: false },
      { id: 'a5', title: 'History Presentation', course: 'Modern History', dueDate: '2025-06-28', status: 'Submitted', overdue: true }, // Example overdue
    ],
    notifications: [
      { id: 'n1', type: 'assignment', message: 'New assignment "React Hooks Practice" in Advanced React.', time: '2h ago', read: false },
      { id: 'n2', type: 'grade', message: 'Grade updated for Calculus III: Quiz 2 (92%).', time: '1d ago', read: false },
      { id: 'n3', type: 'announcement', message: 'Campus will be closed for holiday on July 4th.', time: '3d ago', read: true },
    ],
    schedule: [
      { id: 's1', title: 'React Lecture', time: '10:00 AM - 11:30 AM', course: 'Advanced React Development', date: '2025-07-03', type: 'Lecture' },
      { id: 's2', title: 'Calculus III Tutoring', time: '02:00 PM - 03:00 PM', course: 'Calculus III', date: '2025-07-03', type: 'Tutoring' },
      { id: 's3', title: 'History Seminar', time: '09:00 AM - 10:30 AM', course: 'Modern History', date: '2025-07-05', type: 'Seminar' },
      { id: 's4', title: 'Data Structures Lab', time: '01:00 PM - 02:30 PM', course: 'Data Structures', date: '2025-07-06', type: 'Lab' },
    ]
  };
};

// --- Sub-Components ---

const SidebarButton = ({ icon: Icon, text, onClick, isActive, count }) => {
  return (
    <button
      onClick={onClick}
      className={`group flex items-center w-full p-3 rounded-xl text-left font-medium transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg ${
        isActive
          ? 'bg-blue-600 text-white shadow-lg'
          : 'text-slate-700 hover:bg-white/60 hover:text-blue-600 hover:backdrop-blur-sm'
      }`}
    >
      <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : 'text-slate-600 group-hover:text-blue-600'}`} />
      <span>{text}</span>
      {count && (
        <span
          className={`ml-auto px-2 py-0.5 text-xs font-bold rounded-full transition-all duration-300 ${
            isActive ? 'bg-white text-blue-600' : 'bg-blue-500 text-white group-hover:bg-blue-600 group-hover:text-white'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
};

const MainHeader = ({ currentUser, unseenNotificationsCount }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
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
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="relative p-3 bg-white/70 backdrop-blur-sm rounded-xl hover:bg-white/80 transition-all duration-200 shadow-sm"
        >
          <Bell className="w-5 h-5 text-slate-700" />
          {unseenNotificationsCount > 0 && (
            <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white animate-bounce-once">
              {unseenNotificationsCount}
            </span>
          )}
        </button>

        <div
          className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg cursor-pointer transform hover:scale-105 transition-all duration-200"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          {currentUser.firstName.charAt(0)}{currentUser.lastName.charAt(0)}
        </div>

        {dropdownOpen && (
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
            <button onClick={() => alert('Settings Clicked!')} className="flex items-center w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors duration-150">
              <Settings className="w-4 h-4 mr-2 text-purple-500" /> {/* Theme accent */}
              Settings
            </button>
            <button onClick={() => alert('Help Clicked!')} className="flex items-center w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors duration-150">
              <HelpCircle className="w-4 h-4 mr-2 text-purple-500" /> {/* Theme accent */}
              Help
            </button>
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

const CourseCard = ({ course }) => {
  // Determine gradient based on a simple hash or course ID for variety
  const getCourseGradient = (id) => {
    const gradients = [
      'from-violet-500 to-purple-500',
      'from-indigo-500 to-blue-500',
      'from-pink-500 to-red-500', // Still allows for some reds/pinks if desired
      'from-cyan-500 to-teal-500'
    ];
    const index = id.charCodeAt(0) % gradients.length;
    return gradients[index];
  };

  const gradient = getCourseGradient(course.id);
  const progressColor = course.progress >= 70 ? 'bg-emerald-500' : course.progress >= 40 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="relative p-6 bg-white/60 backdrop-blur-sm rounded-2xl shadow-sm border border-white/40 overflow-hidden transform hover:scale-[1.02] transition-all duration-300 hover:shadow-lg group">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-300`}></div>
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-800 mb-1">{course.name}</h3>
            <p className="text-sm text-slate-500">Instructor: {course.instructor}</p>
          </div>
          <div className="p-2 rounded-full text-white bg-gradient-to-br from-purple-500 to-indigo-500 shadow-md"> {/* Consistent icon background */}
            <BookOpen className="w-5 h-5" />
          </div>
        </div>
        <div className="mb-4">
          <div className="flex justify-between text-sm text-slate-600 mb-1">
            <span>Progress: {course.progress}%</span>
            <span>Grade: {course.grade}</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5">
            <div className={`${progressColor} h-2.5 rounded-full`} style={{ width: `${course.progress}%` }}></div>
          </div>
        </div>
        <div className="flex justify-between items-center text-sm text-slate-500">
          <span>Next Due: {course.due}</span>
          <Link to={`/student/course/${course.id}`} className="text-purple-600 hover:text-purple-800 font-medium transition-colors duration-200 flex items-center group"> {/* Theme accent */}
            View Course
            <ChevronUp className="w-4 h-4 ml-1 transform rotate-90 group-hover:rotate-180 transition-transform duration-200" />
          </Link>
        </div>
      </div>
    </div>
  );
};

const AssignmentCard = ({ assignment }) => {
  const isOverdue = assignment.status === 'Submitted' && assignment.overdue; // Only truly overdue if submitted and flag is true
  const statusColor =
    assignment.status === 'Due' ? 'text-blue-600' :
    assignment.status === 'Submitted' && !isOverdue ? 'text-emerald-600' :
    'text-red-600'; // For 'Overdue' or 'Submitted' && overdue

  const statusBgColor =
    assignment.status === 'Due' ? 'bg-blue-100' :
    assignment.status === 'Submitted' && !isOverdue ? 'bg-emerald-100' :
    'bg-red-100';

  // const icon = // This was commented out and not used, so removing it.
  //   assignment.status === 'Due' ? <ClipboardList className="w-4 h-4" /> :
  //   assignment.status === 'Submitted' && !isOverdue ? <CheckCircle2 className="w-4 h-4" /> :
  //   <AlertTriangle className="w-4 h-4" />;

  return (
    <div className="relative p-6 bg-white/60 backdrop-blur-sm rounded-2xl shadow-sm border border-white/40 overflow-hidden transform hover:scale-[1.02] transition-all duration-300 hover:shadow-lg group">
      <div className="relative z-10">
        <h3 className="text-xl font-semibold text-slate-800 mb-2">{assignment.title}</h3>
        <p className="text-sm text-slate-500 mb-3">Course: {assignment.course}</p>
        <div className="flex items-center justify-between mb-4">
          <span className="text-base text-slate-600 font-medium flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-purple-500" /> {/* Theme accent */}
            Due: {assignment.dueDate}
          </span>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColor} ${statusBgColor}`}>
            {isOverdue ? 'Overdue' : assignment.status}
          </span>
        </div>
        <button className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-violet-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"> {/* Theme accent button */}
          {assignment.status === 'Due' ? 'View Details' : 'View Submission'}
        </button>
      </div>
    </div>
  );
};

const NotificationItem = ({ notification }) => {
  const notificationIcon = {
    assignment: <ClipboardPenLine className="w-5 h-5 text-purple-500" />,
    grade: <Award className="w-5 h-5 text-emerald-500" />,
    announcement: <Lightbulb className="w-5 h-5 text-amber-500" />,
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

const TodayScheduleItem = ({ item }) => {
  const typeIcon = {
    Lecture: <BookOpen className="w-4 h-4 text-purple-500" />,
    Tutoring: <UserRound className="w-4 h-4 text-blue-500" />,
    Seminar: <GraduationCap className="w-4 h-4 text-green-500" />,
    Lab: <MonitorCheck className="w-4 h-4 text-orange-500" />,
  };

  return (
    <div className="flex items-center space-x-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl shadow-sm border border-white/40 hover:shadow-md transition-all duration-200 transform hover:scale-[1.01]">
      <div className="flex-shrink-0">
        {typeIcon[item.type] || <CalendarDays className="w-4 h-4 text-slate-500" />}
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-slate-800">{item.title}</h4>
        <p className="text-sm text-slate-500">{item.course}</p>
      </div>
      <div className="text-right">
        <p className="font-medium text-purple-600">{item.time}</p> {/* Theme accent */}
        <p className="text-xs text-slate-500">{item.date}</p>
      </div>
    </div>
  );
};

// --- Main StudentDashboard Component ---
const StudentDashboard = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [activeMenuItem, setActiveMenuItem] = useState('dashboard'); // State for active sidebar item
  const [dashboardData, setDashboardData] = useState(null); // All data for the dashboard
  const [mockTeachers, setMockTeachers] = useState([]); // For storing teacher data
  const [loading, setLoading] = useState(false); // For loading state

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
    const sampleData = getSampleStudentData(user.firstName);
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
      
      // Try API first
      let token = localStorage.getItem('token');
      if (token) {
        // Remove any extra quotes from token
        if (typeof token === 'string') {
          token = token.replace(/^"|"$/g, '');
        }
        try {
          const response = await fetch('/api/teachers/list', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const teachers = await response.json();
            setMockTeachers(teachers);
            return;
          }
        } catch (apiError) {
          console.log('API not available, using localStorage...');
        }
      }
      
      // Fallback to localStorage - only show listed teachers
      const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const listedTeachers = allUsers.filter(user => 
        user.role === 'teacher' && 
        user.teacherProfile && 
        user.teacherProfile.isListed === true // Only listed teachers
      );
      
      setMockTeachers(listedTeachers);
      
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
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

        setDashboardData(getSampleStudentData(userForDashboard.firstName));
        await fetchTeachers();
      } catch (error) {
        console.error('Error loading dashboard:', error);
        navigate('/login');
      }
    };

    fetchData();
  }, [navigate]);

  const unseenNotificationsCount = dashboardData?.notifications.filter(n => !n.read).length || 0;

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

  const sidebarClass = `w-72 bg-white/80 backdrop-blur-xl border-r border-white/20 p-6 flex flex-col relative overflow-hidden shadow-lg z-10`; 
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
            <Link to="/" className="mb-8 text-center block group">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-4 mx-auto transform group-hover:scale-105 transition-all duration-300 cursor-pointer">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors duration-200">Yuvshiksha</h2>
              <p className="text-slate-600 text-sm group-hover:text-slate-700 transition-colors duration-200">Student Portal</p>
            </Link>

            <nav className="space-y-2 mb-8 flex-1">
              <SidebarButton
                icon={Home}
                text="Dashboard"
                onClick={() => setActiveMenuItem('dashboard')}
                isActive={activeMenuItem === 'dashboard'}
              />
              <SidebarButton
                icon={BookCheck}
                text="My Courses"
                onClick={() => setActiveMenuItem('courses')}
                isActive={activeMenuItem === 'courses'}
                count={dashboardData.courses.length}
              />
              <SidebarButton
                icon={ClipboardList}
                text="Assignments"
                onClick={() => setActiveMenuItem('assignments')}
                isActive={activeMenuItem === 'assignments'}
                count={dashboardData.assignments.filter(a => a.status === 'Due').length}
              />
              <SidebarButton
                icon={CalendarDays}
                text="Schedule"
                onClick={() => setActiveMenuItem('schedule')}
                isActive={activeMenuItem === 'schedule'}
                count={dashboardData.schedule.length}
              />
              <SidebarButton
                icon={Bell}
                text="Notifications"
                onClick={() => setActiveMenuItem('notifications')}
                isActive={activeMenuItem === 'notifications'}
                count={unseenNotificationsCount}
              />
              <SidebarButton
                icon={MessageSquare}
                text="Messages"
                onClick={() => setActiveMenuItem('messages')}
                isActive={activeMenuItem === 'messages'}
                count={3}
              />
              <SidebarButton
                icon={AwardIcon}
                text="Achievements"
                onClick={() => setActiveMenuItem('achievements')}
                isActive={activeMenuItem === 'achievements'}
                count={5}
              />
              
              {/* Navigation Links */}
              <div className="border-t border-white/20 pt-4 mt-4">
                <Link
                  to="/student/find-teachers"
                  className="flex items-center space-x-3 w-full p-3 text-left text-slate-700 hover:bg-white/40 rounded-xl transition-all duration-200 group"
                >
                  <Search className="w-5 h-5 group-hover:text-blue-600 transition-colors duration-200" />
                  <span className="group-hover:text-blue-600 transition-colors duration-200">Find Teachers</span>
                </Link>
                <Link
                  to="/pricing"
                  className="flex items-center space-x-3 w-full p-3 text-left text-slate-700 hover:bg-white/40 rounded-xl transition-all duration-200 group"
                >
                  <BadgeCent className="w-5 h-5 group-hover:text-blue-600 transition-colors duration-200" />
                  <span className="group-hover:text-blue-600 transition-colors duration-200">Pricing</span>
                </Link>
                <Link
                  to="/help"
                  className="flex items-center space-x-3 w-full p-3 text-left text-slate-700 hover:bg-white/40 rounded-xl transition-all duration-200 group"
                >
                  <HelpCircle className="w-5 h-5 group-hover:text-blue-600 transition-colors duration-200" />
                  <span className="group-hover:text-blue-600 transition-colors duration-200">Help</span>
                </Link>
              </div>
            </nav>

            <div className="mt-auto">
              <button
                onClick={() => {
                  // Correctly use the imported setToLocalStorage
                  setToLocalStorage('currentUser', null); // Clear current user
                  navigate('/login');
                }}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-lg flex items-center justify-center space-x-2 transform hover:scale-[1.02] hover:-translate-y-1"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className={mainContentClass}>
          <MainHeader currentUser={currentUser} unseenNotificationsCount={unseenNotificationsCount} />

          {activeMenuItem === 'dashboard' && (
            <section className="space-y-10">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Total Courses"
                  value={dashboardData.stats.totalCourses}
                  icon={BookOpen}
                  color="primary"
                  description="Currently enrolled"
                />
                <StatCard
                  title="Assignments Done"
                  value={dashboardData.stats.completedAssignments}
                  icon={CheckCircle2}
                  color="success"
                  description="This academic year"
                />
                <StatCard
                  title="Upcoming Assignments"
                  value={dashboardData.stats.upcomingAssignments}
                  icon={ListTodo}
                  color="accent"
                  description="Due in next 7 days"
                />
                <StatCard
                  title="Average Grade"
                  value={`${dashboardData.stats.averageGrade}%`}
                  icon={Award}
                  color="secondary"
                  description="Overall performance"
                />
              </div>

              {/* My Courses */}
              <div className={cardClass}>
                <h2 className={sectionTitleClass}>
                  <BookCheck className="w-7 h-7 text-purple-600" /> {/* Theme accent */}
                  My Courses
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {dashboardData.courses.map(course => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
                {dashboardData.courses.length === 0 && (
                  <p className="text-slate-500 text-center py-8 text-lg">You are not enrolled in any courses yet.</p>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming Assignments */}
                <div className={cardClass}>
                  <h2 className={sectionTitleClass}>
                    <ClipboardList className="w-7 h-7 text-purple-600" /> {/* Theme accent */}
                    Upcoming Assignments
                  </h2>
                  <div className="space-y-4">
                    {dashboardData.assignments
                      .filter(a => a.status === 'Due')
                      .slice(0, 3) // Show top 3 upcoming
                      .map(assignment => (
                        <AssignmentCard key={assignment.id} assignment={assignment} />
                      ))}
                    {dashboardData.assignments.filter(a => a.status === 'Due').length === 0 && (
                      <p className="text-slate-500 text-center py-4">No upcoming assignments! 🎉</p>
                    )}
                  </div>
                  {dashboardData.assignments.filter(a => a.status === 'Due').length > 3 && (
                    <div className="text-center mt-6">
                      <Link to="/student/assignments" className="inline-flex items-center text-purple-600 font-semibold hover:text-purple-800 transition-colors duration-200"> {/* Theme accent */}
                        View All Assignments <ChevronUp className="w-4 h-4 ml-1 transform rotate-90" />
                      </Link>
                    </div>
                  )}
                </div>

                {/* Today's Schedule */}
                <div className={cardClass}>
                  <h2 className={sectionTitleClass}>
                    <CalendarDays className="w-7 h-7 text-purple-600" /> {/* Theme accent */}
                    Today's Schedule
                  </h2>
                  <div className="space-y-4">
                    {dashboardData.schedule
                      .filter(item => item.date === '2025-07-03') // Filter for today's date
                      .map(item => (
                        <TodayScheduleItem key={item.id} item={item} />
                      ))}
                    {dashboardData.schedule.filter(item => item.date === '2025-07-03').length === 0 && (
                      <p className="text-slate-500 text-center py-4">No events scheduled for today.</p>
                    )}
                  </div>
                  <div className="text-center mt-6">
                    <Link to="/student/schedule" className="inline-flex items-center text-purple-600 font-semibold hover:text-purple-800 transition-colors duration-200"> {/* Theme accent */}
                      View Full Schedule <ChevronUp className="w-4 h-4 ml-1 transform rotate-90" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Recent Notifications */}
              <div className={cardClass}>
                <h2 className={sectionTitleClass}>
                  <Bell className="w-7 h-7 text-purple-600" /> {/* Theme accent */}
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

          {/* Individual Section Views (Simplified for brevity) */}
          {activeMenuItem === 'courses' && (
            <section>
              <h2 className={sectionTitleClass}>
                <BookCheck className="w-7 h-7 text-purple-600" /> My Courses
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dashboardData.courses.map(course => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
              {dashboardData.courses.length === 0 && (
                <p className="text-slate-500 text-center py-8 text-lg">You are not enrolled in any courses yet.</p>
              )}
            </section>
          )}

          {activeMenuItem === 'assignments' && (
            <section>
              <h2 className={sectionTitleClass}>
                <ClipboardList className="w-7 h-7 text-purple-600" /> All Assignments
              </h2>
              <div className="space-y-6">
                {dashboardData.assignments.map(assignment => (
                  <AssignmentCard key={assignment.id} assignment={assignment} />
                ))}
              </div>
              {dashboardData.assignments.length === 0 && (
                <p className="text-slate-500 text-center py-8 text-lg">No assignments found.</p>
              )}
            </section>
          )}

          {activeMenuItem === 'schedule' && (
            <section>
              <h2 className={sectionTitleClass}>
                <CalendarDays className="w-7 h-7 text-purple-600" /> Full Schedule
              </h2>
              <div className="space-y-6">
                {dashboardData.schedule.map(item => (
                  <TodayScheduleItem key={item.id} item={item} />
                ))}
              </div>
              {dashboardData.schedule.length === 0 && (
                <p className="text-slate-500 text-center py-8 text-lg">No events scheduled.</p>
              )}
            </section>
          )}

          {activeMenuItem === 'notifications' && (
            <section>
              <h2 className={sectionTitleClass}>
                <Bell className="w-7 h-7 text-purple-600" /> All Notifications
              </h2>
              <div className="space-y-6">
                {dashboardData.notifications.length > 0 ? (
                  dashboardData.notifications.map(notification => (
                    <NotificationItem key={notification.id} notification={notification} />
                  ))
                ) : (
                  <p className="text-slate-500 text-center py-8 text-lg">No notifications to display.</p>
                )}
              </div>
            </section>
          )}

          {activeMenuItem === 'messages' && (
            <section>
              <h2 className={sectionTitleClass}>
                <MessageSquare className="w-7 h-7 text-purple-600" /> My Messages
              </h2>
              <div className="text-slate-500 text-center py-8 text-lg">
                <p>No messages to display. This section would show your conversations.</p>
                <p className="mt-2 text-sm">Integration with a chat feature would go here.</p>
              </div>
            </section>
          )}

          {activeMenuItem === 'achievements' && (
            <section>
              <h2 className={sectionTitleClass}>
                <Trophy className="w-7 h-7 text-purple-600" /> My Achievements
              </h2>
              <div className="text-slate-500 text-center py-8 text-lg">
                <p>No achievements to display yet. Keep up the great work!</p>
                <p className="mt-2 text-sm">This section would showcase your badges, awards, and milestones.</p>
              </div>
            </section>
          )}

        </main>
        </div>
      </div>
    </UserContext.Provider>
  );
};

export default StudentDashboard;
