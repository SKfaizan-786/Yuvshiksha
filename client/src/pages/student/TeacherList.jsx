import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Star, Clock, BookOpen, Award, ChevronDown, X, Check, Heart, MapPin, Calendar, DollarSign, Users, Zap, SlidersHorizontal, Loader2 } from "lucide-react";
import API_CONFIG from '../../config/api';

// Helper function to get teacher avatar, availability days, etc.
const getTeacherAvatar = (teacher) => {
  if (teacher.profilePicture) {
    return teacher.profilePicture;
  }
  const firstName = teacher.name || 'T';
  return firstName.charAt(0).toUpperCase();
};

const getAvailabilityDays = (availability) => {
  if (!availability || !Array.isArray(availability)) return ["Mon", "Wed", "Fri"];
  return availability.map(slot => slot.day).slice(0, 3);
};

export default function EnhancedTeacherPlatform() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [showFavouritesOnly, setShowFavouritesOnly] = useState(false);
  // Load favorites from backend on mount
  useEffect(() => {
    const fetchFavourites = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const API_BASE_URL = API_CONFIG.BASE_URL;
        const res = await fetch(`${API_BASE_URL}/api/profile/favourites`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setFavorites(data.favourites || []);
        }
      } catch (err) {
        console.error('Failed to load favourites from backend', err);
      }
    };
    fetchFavourites();
  }, []);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBoard, setFilterBoard] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [sortBy, setSortBy] = useState("rating");
  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [experienceRange, setExperienceRange] = useState([0, 10]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    date: "",
    time: "",
    duration: "1",
    message: "",
  });
  const [notification, setNotification] = useState("");

  const navigate = useNavigate();

  // Check login status function, defined as a stable useCallback
  const checkLoginStatus = useCallback(() => {
    const token = localStorage.getItem('token');
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    console.log('=== LOGIN STATUS CHECK ===');
    console.log('Token:', token ? 'Present' : 'Missing');
    console.log('Current User:', currentUser);
    console.log('User Role:', currentUser.role);
    console.log('Teacher Profile:', currentUser.teacherProfile);
    console.log('Is Listed:', currentUser.teacherProfile?.isListed);
    console.log('========================');
    
    if (!token || !currentUser.role) {
      console.error('❌ Authentication failed. Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
      return false;
    }
    return true;
  }, [navigate]);

  // Fetch real teachers from backend
  const fetchTeachers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      
      console.log('🔍 Frontend: Fetching teachers...');
      console.log('🔑 Token:', token ? `Present (${token.substring(0, 20)}...)` : 'Missing');
      
      if (!checkLoginStatus()) {
        setLoading(false);
        return;
      }
      
      const API_BASE_URL = API_CONFIG.BASE_URL;

      const response = await fetch(`${API_BASE_URL}${API_CONFIG.ENDPOINTS.TEACHERS_LIST}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 API Response status:', response.status);

      if (response.ok) {
        const teachersData = await response.json();
        console.log('📊 API returned data:', teachersData);
        
        const formattedTeachers = teachersData.map(teacher => {
          const subjects = teacher.teacherProfile?.subjects || [];
          const boards = teacher.teacherProfile?.boards || [];
          const classes = teacher.teacherProfile?.classes || [];

          return {
            id: teacher._id || teacher.id,
            name: `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || 'Teacher',
            subject: Array.isArray(subjects) ? subjects[0]?.text || subjects[0] : subjects,
            board: Array.isArray(boards) ? boards[0]?.text || boards[0] : boards,
            experience: teacher.teacherProfile?.experienceYears || 1,
            fee: teacher.teacherProfile?.hourlyRate || 500,
            rating: teacher.rating || 0, // Removed the default 4.5 rating
            totalStudents: teacher.totalStudents || 0,
            avatar: getTeacherAvatar(teacher),
            specializations: Array.isArray(subjects) ? subjects.map(s => s.text || s) : [subjects].filter(Boolean),
            location: teacher.teacherProfile?.location || 'India',
            availability: getAvailabilityDays(teacher.teacherProfile?.availability),
            bio: teacher.teacherProfile?.bio || 'Experienced educator dedicated to student success.',
            languages: ["English", "Hindi"],
            qualifications: [teacher.teacherProfile?.qualifications || 'Graduate'],
            verified: true,
            email: teacher.email,
            phone: teacher.teacherProfile?.phone,
            teachingMode: teacher.teacherProfile?.teachingMode || 'hybrid',
            profilePicture: teacher.teacherProfile?.photoUrl
          };
        });

        console.log('✅ Formatted teachers:', formattedTeachers);
        setTeachers(formattedTeachers);
      } else if (response.status === 401) {
        const errorData = await response.json();
        console.error('❌ API Error:', response.status, errorData);
        
        console.log('🔑 Token is invalid, removing and redirecting');
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        setError('Your session has expired. Please login again.');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        const errorData = await response.json();
        console.error('❌ API Error:', response.status, errorData);
        throw new Error('API request failed');
      }
    } catch (apiError) {
      console.error('❌ Error fetching teachers:', apiError);
      setError('Failed to load teachers. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [navigate, checkLoginStatus]);

  // Load teachers on component mount
  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  // Animated notification system
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Advanced filtering and sorting
  const filteredAndSortedTeachers = useMemo(() => {
    let filtered = teachers.filter((teacher) => {
      const matchesSearch = 
        teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.specializations.some(spec => 
          spec.toLowerCase().includes(searchTerm.toLowerCase())
        );
      const matchesBoard = !filterBoard || teacher.board === filterBoard;
      const matchesSubject = !filterSubject || teacher.subject === filterSubject;
      const matchesPrice = teacher.fee >= priceRange[0] && teacher.fee <= priceRange[1];
      const matchesExperience = teacher.experience >= experienceRange[0] && teacher.experience <= experienceRange[1];
      const matchesFavourite = !showFavouritesOnly || favorites.includes(teacher.id);
      return matchesSearch && matchesBoard && matchesSubject && matchesPrice && matchesExperience && matchesFavourite;
    });
    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "rating": return b.rating - a.rating;
        case "experience": return b.experience - a.experience;
        case "fee-low": return a.fee - b.fee;
        case "fee-high": return b.fee - a.fee;
        case "students": return b.totalStudents - a.totalStudents;
        default: return 0;
      }
    });
    return filtered;
  }, [teachers, searchTerm, filterBoard, filterSubject, sortBy, priceRange, experienceRange, showFavouritesOnly, favorites]);

  const handleBook = (teacher) => {
  // Redirect to BookClass.jsx with teacher id
  navigate(`/student/book-class/${teacher.id}`);
  };

  const submitBooking = () => {
    if (!bookingForm.date || !bookingForm.time) {
      setNotification("Please select a date and time.");
      return;
    }
    
    const newBooking = {
      id: Date.now(),
      teacherId: selectedTeacher.id,
      teacherName: selectedTeacher.name,
      subject: selectedTeacher.subject,
      date: bookingForm.date,
      time: bookingForm.time,
      duration: bookingForm.duration,
      message: bookingForm.message,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    setBookings([...bookings, newBooking]);
    setShowBookingModal(false);
    setBookingForm({ date: "", time: "", duration: "1", message: "" });
    setNotification(`Booking request sent to ${selectedTeacher.name}! 🎉`);
  };

  const toggleFavorite = async (teacherId) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const API_BASE_URL = API_CONFIG.BASE_URL;
    const isFav = favorites.includes(teacherId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/profile/favourites`, {
        method: isFav ? 'DELETE' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ teacherId })
      });
      if (res.ok) {
        const data = await res.json();
        setFavorites(data.favourites || []);
        setNotification(isFav ? "Removed from favorites ❤️" : "Added to favorites! ❤️");
      } else {
        setNotification('Failed to update favourites');
      }
    } catch (err) {
      setNotification('Failed to update favourites');
    }
  };

  const uniqueBoards = [...new Set(teachers.map(t => t.board))];
  const uniqueSubjects = [...new Set(teachers.map(t => t.subject))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 animate-pulse">
          {notification}
        </div>
      )}

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4 animate-pulse">
            🌟 Premium Teacher Hub 🌟
          </h1>
          <p className="text-xl opacity-90 mb-8">
            Discover exceptional educators and transform your learning journey
          </p>
          
          {/* Advanced Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <div className="flex items-center bg-white/10 backdrop-blur-lg rounded-2xl p-2 border border-white/20">
              <Search className="text-white/70 ml-4 w-5 h-5" />
              <input
                type="text"
                placeholder="Search teachers, subjects, or specializations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent text-white placeholder-white/70 px-4 py-3 focus:outline-none text-lg"
              />
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="bg-white/20 hover:bg-white/30 transition-all duration-200 rounded-xl p-3 ml-2"
              >
                <SlidersHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Favourites Toggle */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowFavouritesOnly(fav => !fav)}
            className={`px-4 py-2 rounded-lg font-semibold border transition-all duration-200 ${showFavouritesOnly ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50'}`}
          >
            {showFavouritesOnly ? 'Show All Teachers' : 'Show Favourites'}
          </button>
        </div>
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl shadow-lg border border-gray-200">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            <p className="mt-4 text-gray-600">Loading teachers...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex items-center justify-center p-12 bg-white rounded-3xl shadow-lg border border-gray-200 text-red-500">
            <p>{error}</p>
          </div>
        )}

        {/* Advanced Filters Panel */}
        {showFilters && !loading && !error && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100 transform transition-all duration-300">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Board</label>
                <select
                  value={filterBoard}
                  onChange={(e) => setFilterBoard(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">All Boards</option>
                  {uniqueBoards.map(board => (
                    <option key={board} value={board}>{board}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                <select
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">All Subjects</option>
                  {uniqueSubjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="experience">Most Experienced</option>
                  <option value="fee-low">Price: Low to High</option>
                  <option value="fee-high">Price: High to Low</option>
                  <option value="students">Most Popular</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Price Range (₹/hour)</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                    className="w-20 p-2 border border-gray-200 rounded-lg"
                    placeholder="Min"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-20 p-2 border border-gray-200 rounded-lg"
                    placeholder="Max"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Header */}
        {!loading && !error && (
          <>
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center space-x-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  {filteredAndSortedTeachers.length} Teachers Found
                </h2>
                <div className="text-sm text-gray-500">
                  {bookings.length} Active Bookings
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-indigo-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`}
                >
                  <div className="grid grid-cols-2 gap-1 w-4 h-4">
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                  </div>
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-indigo-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`}
                >
                  <div className="space-y-1 w-4 h-4">
                    <div className="bg-current h-1 rounded"></div>
                    <div className="bg-current h-1 rounded"></div>
                    <div className="bg-current h-1 rounded"></div>
                  </div>
                </button>
              </div>
            </div>

            {/* Teachers Grid/List */}
            <div className={`${viewMode === "grid" ? "grid md:grid-cols-2 lg:grid-cols-3 gap-8" : "space-y-6"}`}>
              {filteredAndSortedTeachers.map((teacher, index) => (
                <div
                  key={teacher.id}
                  className={`group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-indigo-200 transform hover:-translate-y-2 ${
                    viewMode === "list" ? "flex" : ""
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`${viewMode === "list" ? "flex-shrink-0 w-48" : ""} relative`}>
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 text-white relative overflow-hidden">
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-all duration-300"></div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                          {teacher.profilePicture ? (
                            <img 
                              src={teacher.profilePicture} 
                              alt={teacher.name} 
                              className="w-16 h-16 rounded-full object-cover border-2 border-white"
                            />
                          ) : (
                            <div className="text-4xl w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                              {getTeacherAvatar(teacher)}
                            </div>
                          )}
                          <div className="flex items-center space-x-2">
                            {teacher.verified && (
                              <div className="bg-green-500 rounded-full p-1">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                            <button
                              onClick={() => toggleFavorite(teacher.id)}
                              className="hover:scale-110 transition-transform duration-200"
                            >
                              <Heart
                                className={`w-5 h-5 ${
                                  favorites.includes(teacher.id)
                                    ? "fill-red-500 text-red-500"
                                    : "text-white/70 hover:text-white"
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                        <h3 className="text-xl font-bold mb-1">{teacher.name}</h3>
                        <p className="text-white/90 text-sm">{teacher.bio}</p>
                      </div>
                    </div>

                    {viewMode === "grid" && teacher.rating > 0 && (
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-semibold">{teacher.rating}</span>
                      </div>
                    )}
                  </div>

                  <div className={`p-6 ${viewMode === "list" ? "flex-1" : ""}`}>
                    <div className={`${viewMode === "list" ? "flex justify-between items-start" : ""}`}>
                      <div className={`${viewMode === "list" ? "flex-1 pr-6" : ""}`}>
                        {viewMode === "list" && (
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xl font-bold text-gray-800">{teacher.name}</h3>
                            {teacher.rating > 0 && (
                              <div className="flex items-center space-x-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm font-semibold">{teacher.rating}</span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center space-x-2 text-gray-600">
                            <BookOpen className="w-4 h-4 text-indigo-500" />
                            <span className="text-sm">{teacher.subject}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-600">
                            <Award className="w-4 h-4 text-purple-500" />
                            <span className="text-sm">{teacher.board}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-600">
                            <Clock className="w-4 h-4 text-green-500" />
                            <span className="text-sm">{teacher.experience}y exp</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-600">
                            <Users className="w-4 h-4 text-blue-500" />
                            <span className="text-sm">{teacher.totalStudents} students</span>
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="text-xs text-gray-500 mb-1">Specializations</div>
                          <div className="flex flex-wrap gap-1">
                            {teacher.specializations.slice(0, 3).map((spec, i) => (
                              <span
                                key={i}
                                className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full text-xs font-medium"
                              >
                                {spec}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="text-xs text-gray-500 mb-1">Available</div>
                          <div className="flex space-x-1">
                            {teacher.availability.map((day, i) => (
                              <span
                                key={i}
                                className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs"
                              >
                                {day}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className={`${viewMode === "list" ? "text-right" : ""}`}>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2 text-gray-600">
                            <MapPin className="w-4 h-4 text-red-500" />
                            <span className="text-sm">{teacher.location}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-800">₹{teacher.fee}</div>
                            <div className="text-xs text-gray-500">per hour</div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleBook(teacher)}
                          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2 group"
                        >
                          <Calendar className="w-4 h-4 group-hover:animate-pulse" />
                          <span>Book Session</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredAndSortedTeachers.length === 0 && (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">No teachers found</h3>
                <p className="text-gray-600">Try adjusting your search criteria</p>
              </div>
            )}
          </>
        )}
      </div>
  </div>
  );
}