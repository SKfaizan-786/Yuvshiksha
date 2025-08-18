import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Search, 
  GraduationCap, 
  ChevronDown, 
  Settings, 
  LogOut, 
  User, 
  Moon, 
  Sun, 
  Menu, 
  X,
  BookOpen,
  Calendar,
  MessageSquare,
  Award
} from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';

const Header = ({ 
  student = {
    name: "Alex Johnson",
    grade: "Grade 10",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face&auto=format",
    unreadNotifications: 5,
    courses: 6,
    assignments: 3
  },
  onSearch = () => {},
  onNotificationClick = () => {},
  onProfileClick = () => {},
  isDarkMode = false,
  onToggleDarkMode = () => {}
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  
  const profileRef = useRef(null);
  const searchRef = useRef(null);
  
  // Use notification context and navigation
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle search
  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  // Mock notifications data
  const notifications = [
    {
      id: 1,
      type: 'assignment',
      title: 'Math Assignment Due',
      message: 'Algebra homework is due tomorrow',
      time: '2 hours ago',
      unread: true
    },
    {
      id: 2,
      type: 'grade',
      title: 'Grade Updated',
      message: 'Your Science quiz grade is now available',
      time: '1 day ago',
      unread: true
    },
    {
      id: 3,
      type: 'announcement',
      title: 'School Event',
      message: 'Annual Science Fair registration open',
      time: '2 days ago',
      unread: false
    }
  ];

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'assignment': return <BookOpen className="w-4 h-4" />;
      case 'grade': return <Award className="w-4 h-4" />;
      case 'announcement': return <MessageSquare className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200/50' 
        : 'bg-white shadow-sm border-b border-gray-200'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 group cursor-pointer">
              <div className="relative">
                <GraduationCap className="h-8 w-8 text-blue-600 transition-transform duration-300 group-hover:scale-110" />
                <div className="absolute -inset-1 bg-blue-600/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                  EduPortal
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">Learning Management System</p>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6">
            {/* Search Bar */}
            <div className="relative">
              <div className={`relative transition-all duration-300 ${
                isSearchFocused ? 'scale-105' : 'scale-100'
              }`}>
                <Search className={`h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-200 ${
                  isSearchFocused ? 'text-blue-500' : 'text-gray-400'
                }`} />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search courses, assignments, materials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleSearch}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  className={`pl-10 pr-4 py-2.5 border rounded-lg transition-all duration-200 w-80 ${
                    isSearchFocused 
                      ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-lg' 
                      : 'border-gray-300 hover:border-gray-400'
                  } focus:outline-none bg-gray-50/50 backdrop-blur-sm`}
                />
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-blue-50 rounded-full">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span className="text-blue-700 font-medium">{student.courses} Courses</span>
              </div>
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-orange-50 rounded-full">
                <Calendar className="w-4 h-4 text-orange-600" />
                <span className="text-orange-700 font-medium">{student.assignments} Due</span>
              </div>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 group"
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-gray-600 group-hover:text-yellow-500 transition-colors duration-200" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors duration-200" />
              )}
            </button>

            {/* Notifications */}
            <button
              onClick={() => navigate('/notifications')}
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 group"
            >
              <Bell className="h-6 w-6 text-gray-600 group-hover:text-blue-600 transition-colors duration-200" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 group"
              >
                <div className="relative">
                  <img
                    src={student.avatar}
                    alt="Profile"
                    className="h-8 w-8 rounded-full object-cover ring-2 ring-transparent group-hover:ring-blue-500 transition-all duration-200"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div className="hidden xl:block text-left">
                  <p className="text-sm font-medium text-gray-900">{student.name}</p>
                  <p className="text-xs text-gray-500">{student.grade}</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                  isProfileOpen ? 'rotate-180' : ''
                }`} />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 animate-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <img
                        src={student.avatar}
                        alt="Profile"
                        className="h-10 w-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-500">{student.grade}</p>
                      </div>
                    </div>
                  </div>
                  <div className="py-1">
                    <button className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150">
                      <User className="w-4 h-4" />
                      <span>View Profile</span>
                    </button>
                    <button className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150">
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </button>
                    <hr className="my-1" />
                    <button className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150">
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-600" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4 animate-in slide-in-from-top-2 duration-200">
            <div className="space-y-4">
              {/* Mobile Search */}
              <div className="relative">
                <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Mobile Profile Info */}
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <img
                  src={student.avatar}
                  alt="Profile"
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium text-gray-900">{student.name}</p>
                  <p className="text-sm text-gray-500">{student.grade}</p>
                </div>
              </div>

              {/* Mobile Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">{student.courses}</p>
                    <p className="text-xs text-blue-700">Courses</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-orange-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium text-orange-900">{student.assignments}</p>
                    <p className="text-xs text-orange-700">Due Soon</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;