import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Calendar,
  CreditCard,
  MessageSquare,
  AlertTriangle,
  Gift,
  Filter,
  Settings,
  ArrowLeft,
  ExternalLink,
  MoreVertical,
  Loader2,
  RefreshCw
} from 'lucide-react';

const NotificationsPage = () => {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    showToast
  } = useNotifications();

  const navigate = useNavigate();
  // Add 'recent' as the default filter
  const [filter, setFilter] = useState('recent');
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [showActions, setShowActions] = useState(null);

  // Refetch notifications on component mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Get icon for notification type (payment types removed)
  const getNotificationIcon = (type, priority) => {
    const iconProps = {
      className: `w-6 h-6 ${
        priority === 'urgent' ? 'text-red-500' :
        priority === 'high' ? 'text-orange-500' :
        priority === 'medium' ? 'text-blue-500' : 'text-gray-500'
      }`
    };
    switch (type) {
      case 'booking_pending':
      case 'booking_approved':
      case 'booking_rejected':
        return <Calendar {...iconProps} />;
      case 'message':
        return <MessageSquare {...iconProps} />;
      case 'class_reminder':
        return <Bell {...iconProps} />;
      default:
        return <Bell {...iconProps} />;
    }
  };

  // Get notification color based on type and read status
  const getNotificationColor = (notification) => {
    if (!notification.isRead) {
      switch (notification.priority) {
        case 'urgent':
          return 'bg-red-50 border-l-4 border-red-500';
        case 'high':
          return 'bg-orange-50 border-l-4 border-orange-500';
        case 'medium':
          return 'bg-blue-50 border-l-4 border-blue-500';
        default:
          return 'bg-purple-50 border-l-4 border-purple-500';
      }
    }
    return 'bg-white border-l-4 border-transparent';
  };

  // Filter notifications
  let filteredNotifications = notifications;
  if (filter === 'recent') {
    filteredNotifications = notifications.slice(0, 5);
  } else if (filter === 'all') {
    // show all
  } else if (filter === 'unread') {
    filteredNotifications = notifications.filter(n => !n.isRead);
  } else {
    filteredNotifications = notifications.filter(n => n.category === filter);
  }

  // Handle notification click: only message notifications redirect to /student/messages
  const handleNotificationClick = async (notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      await markAsRead([notification._id]);
    }
    // Only message notifications redirect
    if (notification.type === 'message') {
      navigate('/student/messages');
    } else {
      // For bookings and reminders, do not redirect
      showToast('No page to open for this notification.', 'info');
    }
  };

  // Handle bulk actions
  const handleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map(n => n._id));
    }
  };

  const handleBulkMarkAsRead = async () => {
    const unreadSelected = selectedNotifications.filter(id => {
      const notification = notifications.find(n => n._id === id);
      return notification && !notification.isRead;
    });

    if (unreadSelected.length > 0) {
      await markAsRead(unreadSelected);
      showToast(`Marked ${unreadSelected.length} notifications as read`, 'success');
    }
    setSelectedNotifications([]);
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Delete ${selectedNotifications.length} notifications?`)) {
      for (const id of selectedNotifications) {
        await deleteNotification(id);
      }
      showToast(`Deleted ${selectedNotifications.length} notifications`, 'success');
      setSelectedNotifications([]);
    }
  };

  // Format time ago
  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 7) {
      return time.toLocaleDateString();
    } else if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes > 0 ? `${diffMinutes}m ago` : 'Just now';
    }
  };

  const filterStats = {
    recent: Math.min(5, notifications.length),
    all: notifications.length,
    unread: notifications.filter(n => !n.isRead).length,
    booking: notifications.filter(n => n.category === 'booking').length,
    message: notifications.filter(n => n.category === 'message').length,
    reminder: notifications.filter(n => n.category === 'reminder').length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center space-x-3">
                <Bell className="w-6 h-6 text-purple-600" />
                <h1 className="text-xl font-semibold text-gray-900">Notifications</h1>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-sm px-2 py-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={fetchNotifications}
                disabled={loading}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="p-4 border-b">
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'recent', label: 'Recent', count: filterStats.recent },
                { key: 'all', label: 'All', count: filterStats.all },
                { key: 'unread', label: 'Unread', count: filterStats.unread },
                { key: 'booking', label: 'Bookings', count: filterStats.booking },
                { key: 'message', label: 'Messages', count: filterStats.message },
                { key: 'reminder', label: 'Reminders', count: filterStats.reminder }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${filter === tab.key 
                      ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                      : 'text-gray-600 hover:bg-gray-100 border border-transparent'
                    }
                  `}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                      filter === tab.key 
                        ? 'bg-purple-200 text-purple-800' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Bulk actions */}
          {selectedNotifications.length > 0 && (
            <div className="p-4 bg-gray-50 border-b">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {selectedNotifications.length} notification{selectedNotifications.length > 1 ? 's' : ''} selected
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleBulkMarkAsRead}
                    className="px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    Mark as read
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-1">
          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchNotifications}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-500">
                {filter === 'unread' ? 'All caught up! No unread notifications.' : 'You have no notifications yet.'}
              </p>
            </div>
          ) : (
            <>
              {/* Select all option */}
              <div className="bg-white rounded-lg p-4 shadow-sm mb-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.length === filteredNotifications.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Select all ({filteredNotifications.length})
                  </span>
                </label>
              </div>

              {/* Notification items */}
              {filteredNotifications.map(notification => (
                <div
                  key={notification._id}
                  className={`
                    bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200
                    ${getNotificationColor(notification)}
                  `}
                >
                  <div className="p-4">
                    <div className="flex items-start space-x-4">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedNotifications.includes(notification._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedNotifications([...selectedNotifications, notification._id]);
                          } else {
                            setSelectedNotifications(selectedNotifications.filter(id => id !== notification._id));
                          }
                        }}
                        className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />

                      {/* Icon */}
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type, notification.priority)}
                      </div>

                      {/* Content */}
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className={`text-sm ${!notification.isRead ? 'font-semibold' : 'font-medium'} text-gray-900 mb-1`}>
                              {notification.title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <span className="text-xs text-gray-500">
                                  {formatTimeAgo(notification.createdAt)}
                                </span>
                                {notification.actionRequired && (
                                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
                                    Action Required
                                  </span>
                                )}
                                {notification.priority === 'urgent' && (
                                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                                    Urgent
                                  </span>
                                )}
                              </div>
                              {(notification.actionUrl || notification.category === 'message') && (
                                <ExternalLink className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowActions(showActions === notification._id ? null : notification._id);
                              }}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                            >
                              <MoreVertical className="w-4 h-4 text-gray-400" />
                            </button>

                            {showActions === notification._id && (
                              <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[120px]">
                                {!notification.isRead && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAsRead([notification._id]);
                                      setShowActions(null);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                                  >
                                    <Check className="w-4 h-4" />
                                    <span>Mark read</span>
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(notification._id);
                                    setShowActions(null);
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Unread indicator */}
                      {!notification.isRead && (
                        <div className="w-3 h-3 bg-purple-500 rounded-full flex-shrink-0 mt-2"></div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
