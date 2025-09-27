import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar, CalendarDays, Clock, User, BookOpen, DollarSign, Filter,
  Search, CheckCircle, XCircle, AlertCircle, Eye, MessageSquare,
  ChevronLeft, ChevronRight, Download, RefreshCw, Users, MapPin,
  Phone, Mail, GraduationCap, Loader2, Plus, Edit, Trash2
} from 'lucide-react';

// Import the date range picker components and styles
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css'; // main style file
import 'react-date-range/dist/theme/default.css'; // theme css file

// Import storage utilities
import { getFromLocalStorage, setToLocalStorage } from '../utils/storage';
import { bookingAPI } from '../../services/bookingAPI';

// Booking status configurations
const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  RESCHEDULED: 'rescheduled'
};

const STATUS_CONFIG = {
  [BOOKING_STATUS.PENDING]: {
    color: 'bg-amber-100',
    textColor: 'text-amber-800',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    dotColor: 'bg-amber-500',
    icon: AlertCircle
  },
  [BOOKING_STATUS.CONFIRMED]: {
    color: 'bg-green-100',
    textColor: 'text-green-800',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    dotColor: 'bg-green-500',
    icon: CheckCircle
  },
  [BOOKING_STATUS.COMPLETED]: {
    color: 'bg-blue-100',
    textColor: 'text-blue-800',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    dotColor: 'bg-blue-500',
    icon: CheckCircle
  },
  [BOOKING_STATUS.CANCELLED]: {
    color: 'bg-red-100',
    textColor: 'text-red-800',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    dotColor: 'bg-red-500',
    icon: XCircle
  },
  [BOOKING_STATUS.RESCHEDULED]: {
    color: 'bg-purple-100',
    textColor: 'text-purple-800',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    dotColor: 'bg-purple-500',
    icon: Calendar
  }
};

export default function TeacherBookings() {
  const navigate = useNavigate();

  // State management
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState([{
    startDate: null,
    endDate: null,
    key: 'selection'
  }]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0
  });
  // Track loading state for each booking and action (Accept/Reject)
  // { [bookingId]: 'accept' | 'reject' | null }
  const [updatingBooking, setUpdatingBooking] = useState({ id: null, action: null });

  const ITEMS_PER_PAGE = 10;

  // Initialize component
  useEffect(() => {
    initializeBookings();
  }, []);

  const initializeBookings = useCallback(async () => {
    try {
      setLoading(true);

      // Get current user
      const user = getFromLocalStorage('currentUser');
      if (!user || user.role !== 'teacher') {
        navigate('/login');
        return;
      }
      setCurrentUser(user);

      // Fetch bookings from API
      try {
        const response = await bookingAPI.getTeacherBookings({
          page: 1,
          limit: 100 // Get all bookings for now
        });

        setBookings(response.bookings || []);
        updateStats(response.bookings || []);

        // Update stats from API response if available
        if (response.stats) {
          setStats(response.stats);
        }
      } catch (apiError) {
        console.error('Error fetching bookings from API:', apiError);
        // Fallback to empty array if API fails
        setBookings([]);
        updateStats([]);
      }

    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Update statistics
  const updateStats = (bookingList) => {
    const stats = {
      total: bookingList.length,
      pending: bookingList.filter(b => b.status === BOOKING_STATUS.PENDING).length,
      confirmed: bookingList.filter(b => b.status === BOOKING_STATUS.CONFIRMED).length,
      completed: bookingList.filter(b => b.status === BOOKING_STATUS.COMPLETED).length,
      cancelled: bookingList.filter(b => b.status === BOOKING_STATUS.CANCELLED).length
    };
    setStats(stats);
  };

  // Filter and search bookings
  useEffect(() => {
    let filtered = [...bookings];
    const { startDate, endDate } = dateRange[0];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.student.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    // Apply date range filter
    if (startDate && endDate) {
      const startOfDay = new Date(startDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);

      filtered = filtered.filter(booking => {
        const bookingDate = new Date(booking.date);
        return bookingDate >= startOfDay && bookingDate <= endOfDay;
      });
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));

    setFilteredBookings(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [bookings, searchTerm, statusFilter, dateRange]);

  // Handle booking status change
  const handleStatusChange = async (bookingId, newStatus) => {
    setUpdatingBooking({ id: bookingId, action: newStatus === BOOKING_STATUS.CONFIRMED ? 'accept' : 'reject' });
    try {
      // Update status via API
      await bookingAPI.updateBookingStatus(bookingId, {
        status: newStatus,
        meetingLink: newStatus === 'confirmed' ? 'https://meet.google.com/new' : undefined
      });

      // Update local state
      const updatedBookings = bookings.map(booking =>
        (booking.id === bookingId || booking._id === bookingId)
          ? { ...booking, status: newStatus }
          : booking
      );
      setBookings(updatedBookings);
      updateStats(updatedBookings);

      console.log(`Booking ${bookingId} status updated to ${newStatus}`);

    } catch (error) {
      console.error('Error updating booking status:', error);
      alert(`Error updating booking status: ${error.message}`);
    } finally {
      setUpdatingBooking({ id: null, action: null });
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentBookings = filteredBookings.slice(startIndex, endIndex);

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          </div>
          <p className="text-xl font-semibold text-gray-900 mt-6">Loading bookings...</p>
          <p className="text-gray-600 text-sm mt-2">Please wait while we fetch your sessions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-2">
                <Calendar className="w-8 h-8 text-blue-600" />
                My Bookings
              </h1>
              <p className="text-gray-600">Manage your student sessions and appointments</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => initializeBookings()}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2 shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
            <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Users className="w-8 h-8 text-gray-400" />
              </div>
            </div>

            <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Pending</p>
                  <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
                </div>
                <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Confirmed</p>
                  <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Completed</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
                </div>
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Cancelled</p>
                  <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
                </div>
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mb-6">
          <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students, subjects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors duration-200"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors duration-200 bg-white"
              >
                <option value="all">All Status</option>
                <option value={BOOKING_STATUS.PENDING}>Pending</option>
                <option value={BOOKING_STATUS.CONFIRMED}>Confirmed</option>
                <option value={BOOKING_STATUS.COMPLETED}>Completed</option>
                <option value={BOOKING_STATUS.CANCELLED}>Cancelled</option>
              </select>

              {/* Date Range Picker */}
              <div className="relative">
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors duration-200 bg-white flex items-center justify-between"
                >
                  <span>
                    {dateRange[0].startDate && dateRange[0].endDate
                      ? `${formatDate(dateRange[0].startDate)} - ${formatDate(dateRange[0].endDate)}`
                      : 'Select Date Range'}
                  </span>
                  <Calendar className="w-4 h-4 text-gray-500" />
                </button>
                {showDatePicker && (
                  <div className="absolute z-10 top-full mt-2 left-0 right-0">
                    <DateRange
                      editableDateInputs={true}
                      onChange={item => setDateRange([item.selection])}
                      moveRangeOnFirstSelection={false}
                      ranges={dateRange}
                    />
                  </div>
                )}
              </div>

              {/* Results Count */}
              <div className="flex items-center text-gray-600">
                <Filter className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">{filteredBookings.length} results</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        {currentBookings.length === 0 ? (
          <div className="bg-white border border-gray-200 p-12 rounded-lg text-center shadow-sm">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-600 mb-6">
              {bookings.length === 0
                ? "You haven't received any booking requests yet. Students will be able to book sessions with you once you're listed."
                : "No bookings match your current filters. Try adjusting your search criteria."
              }
            </p>
            {bookings.length === 0 && (
              <button
                onClick={() => navigate('/teacher/dashboard')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Go to Dashboard
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {currentBookings.map((booking) => (
              <BookingCard
                key={booking._id || booking.id}
                booking={booking}
                onStatusChange={handleStatusChange}
                onViewDetails={(booking) => {
                  setSelectedBooking(booking);
                  setShowDetails(true);
                }}
                formatDate={formatDate}
                formatCurrency={formatCurrency}
                updatingBooking={updatingBooking}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-8 space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-gray-700 px-4 font-medium">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {showDetails && selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={() => setShowDetails(false)}
          onStatusChange={handleStatusChange}
          formatDate={formatDate}
          formatCurrency={formatCurrency}
        />
      )}
    </div>
  );
}

// Booking Card Component
function BookingCard({ booking, onStatusChange, onViewDetails, formatDate, formatCurrency, updatingBooking }) {
  const statusConfig = STATUS_CONFIG[booking.status];
  const StatusIcon = statusConfig.icon;
  const bookingId = booking._id || booking.id;

  const isAccepting = updatingBooking.id === bookingId && updatingBooking.action === 'accept';
  const isRejecting = updatingBooking.id === bookingId && updatingBooking.action === 'reject';
  const isUpdating = updatingBooking.id === bookingId;

  return (
    <div className="bg-white border border-gray-200 p-6 rounded-lg hover:border-gray-300 transition-colors duration-200 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Main Info */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-1">
                <User className="w-5 h-5 text-gray-600" />
                {booking.student.name}
              </h3>
              <p className="text-gray-600 text-sm">{booking.student.email}</p>
            </div>

            <div className={`px-3 py-1 rounded-full flex items-center gap-2 ${statusConfig.bgColor} ${statusConfig.borderColor} border`}>
              <div className={`w-2 h-2 rounded-full ${statusConfig.dotColor}`}></div>
              <span className={`text-sm font-medium capitalize ${statusConfig.textColor}`}>
                {booking.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <BookOpen className="w-4 h-4 text-gray-500" />
              <span className="font-medium">{booking.subject}</span>
            </div>

            <div className="flex items-center gap-2 text-gray-600">
              <CalendarDays className="w-4 h-4 text-gray-500" />
              <span className="font-medium">{formatDate(booking.date)}</span>
            </div>

            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="font-medium">{booking.time} ({booking.duration}h)</span>
            </div>

            <div className="flex items-center gap-2 text-gray-600">
              <DollarSign className="w-4 h-4 text-gray-500" />
              <span className="font-semibold text-gray-900">{formatCurrency(booking.amount)}</span>
            </div>
          </div>

          {booking.notes && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-gray-700 text-sm">{booking.notes}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 lg:min-w-[200px]">
          <button
            onClick={() => onViewDetails(booking)}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center gap-2 shadow-sm"
            disabled={isUpdating}
          >
            <Eye className="w-4 h-4" />
            Details
          </button>

          {booking.status === BOOKING_STATUS.PENDING && (
            <div className="flex gap-2">
              <button
                onClick={() => onStatusChange(bookingId, BOOKING_STATUS.CONFIRMED)}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center justify-center gap-1 shadow-sm"
                disabled={isUpdating}
              >
                {isAccepting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {isAccepting ? 'Saving...' : 'Accept'}
              </button>
              <button
                onClick={() => onStatusChange(bookingId, BOOKING_STATUS.CANCELLED)}
                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center justify-center gap-1 shadow-sm"
                disabled={isUpdating}
              >
                {isRejecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                {isRejecting ? 'Saving...' : 'Reject'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Booking Details Modal Component
function BookingDetailsModal({ booking, onClose, onStatusChange, formatDate, formatCurrency }) {
  const statusConfig = STATUS_CONFIG[booking.status];
  const StatusIcon = statusConfig.icon;
  const bookingId = booking._id || booking.id;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Booking Details</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-gray-600 font-medium">Status</span>
            <div className={`px-4 py-2 rounded-full flex items-center gap-2 ${statusConfig.bgColor} ${statusConfig.borderColor} border`}>
              <div className={`w-2 h-2 rounded-full ${statusConfig.dotColor}`}></div>
              <span className={`font-medium capitalize ${statusConfig.textColor}`}>
                {booking.status}
              </span>
            </div>
          </div>

          {/* Student Info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-gray-600" />
              Student Information
            </h3>
            <div className="space-y-3 text-gray-700 bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-gray-500" />
                <span className="font-medium">{booking.student.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <span>{booking.student.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <span>{booking.student.phone}</span>
              </div>
            </div>
          </div>

          {/* Session Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-gray-600" />
              Session Details
            </h3>
            <div className="grid grid-cols-2 gap-4 text-gray-700 bg-gray-50 p-4 rounded-lg">
              <div>
                <span className="text-gray-500 block text-sm font-medium">Subject</span>
                <span className="font-semibold text-gray-900">{booking.subject}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-sm font-medium">Date</span>
                <span className="font-semibold text-gray-900">{formatDate(booking.date)}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-sm font-medium">Time</span>
                <span className="font-semibold text-gray-900">{booking.time}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-sm font-medium">Duration</span>
                <span className="font-semibold text-gray-900">{booking.duration} hours</span>
              </div>
              <div>
                <span className="text-gray-500 block text-sm font-medium">Amount</span>
                <span className="font-semibold text-green-600">{formatCurrency(booking.amount)}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-sm font-medium">Booked On</span>
                <span className="font-semibold text-gray-900">{formatDate(booking.createdAt || booking.date)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {booking.notes && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes</h3>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-700">{booking.notes}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            {booking.status === BOOKING_STATUS.PENDING && (
              <>
                <button
                  onClick={() => {
                    onStatusChange(bookingId, BOOKING_STATUS.CONFIRMED);
                    onClose();
                  }}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center justify-center gap-2 shadow-sm"
                >
                  <CheckCircle className="w-5 h-5" />
                  Accept Booking
                </button>
                <button
                  onClick={() => {
                    onStatusChange(bookingId, BOOKING_STATUS.CANCELLED);
                    onClose();
                  }}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center justify-center gap-2 shadow-sm"
                >
                  <XCircle className="w-5 h-5" />
                  Reject Booking
                </button>
              </>
            )}

            {booking.status === BOOKING_STATUS.CONFIRMED && (
              <button
                onClick={() => {
                  onStatusChange(bookingId, BOOKING_STATUS.COMPLETED);
                  onClose();
                }}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2 shadow-sm"
              >
                <CheckCircle className="w-5 h-5" />
                Mark Complete
              </button>
            )}

            <button
              onClick={onClose}
              className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 shadow-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// No changes needed for cookie setup in this file.
// Your API calls (e.g., bookingAPI.getTeacherBookings, bookingAPI.updateBookingStatus) already use credentials: 'include' internally (if implemented like your other pages).
// As long as your backend expects authentication via cookies and your fetch/axios calls use credentials: 'include', you do not need to manually set cookies here.