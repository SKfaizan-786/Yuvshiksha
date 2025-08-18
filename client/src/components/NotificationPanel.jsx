import React, { useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
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
  X,
  Settings,
  Filter,
  MoreVertical,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ 
  isOpen, 
  onClose, 
  position = 'top-right' 
}) => {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    showToast
  } = useNotifications();
  
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'unread' | 'booking' | 'payment' | 'message'>('all');
  const [showActions, setShowActions] = useState<string | null>(null);

  // Get icon for notification type
  const getNotificationIcon = (type: string, priority: string) => {
    const iconProps = {
      className: `w-5 h-5 ${
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
      case 'payment_received':
      case 'payment_refunded':
        return <CreditCard {...iconProps} />;
      case 'message':
        return <MessageSquare {...iconProps} />;
      case 'class_reminder':
        return <Bell {...iconProps} />;
      default:
        return <Bell {...iconProps} />;
    }
  };

  // Get notification color based on type and read status
  const getNotificationColor = (notification: any) => {
    if (!notification.isRead) {
      switch (notification.priority) {
        case 'urgent':
          return 'bg-red-50 border-red-200';
        case 'high':
          return 'bg-orange-50 border-orange-200';
        case 'medium':
          return 'bg-blue-50 border-blue-200';
        default:
          return 'bg-purple-50 border-purple-200';
      }
    }
    return 'bg-gray-50 border-gray-200';
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.isRead;
    return notification.category === filter;
  });

  // Handle notification click
  const handleNotificationClick = async (notification: any) => {
    // Mark as read if unread
    if (!notification.isRead) {
      await markAsRead([notification._id]);
    }

    // Navigate to action URL if available
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      onClose();
    }
  };

  // Handle mark as read
  const handleMarkAsRead = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    await markAsRead([notificationId]);
    showToast('Notification marked as read', 'success');
  };

  // Handle delete
  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
    showToast('Notification deleted', 'success');
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    showToast('All notifications marked as read', 'success');
  };

  // Format time ago
  const formatTimeAgo = (timestamp: string) => {
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

  if (!isOpen) return null;

  const positionClasses = {
    'top-right': 'top-16 right-4',
    'top-left': 'top-16 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className={`
        fixed ${positionClasses[position]} z-50 w-96 max-w-[90vw] max-h-[80vh]
        bg-white rounded-xl shadow-2xl border border-gray-200 
        transform transition-all duration-300 ease-out
        animate-in slide-in-from-top-2
      `}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Filter tabs */}
          <div className="flex space-x-1 mt-3">
            {[
              { key: 'all', label: 'All' },
              { key: 'unread', label: 'Unread' },
              { key: 'booking', label: 'Bookings' },
              { key: 'payment', label: 'Payments' },
              { key: 'message', label: 'Messages' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`
                  px-3 py-1 text-xs rounded-full transition-colors
                  ${filter === tab.key 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Actions */}
          {unreadCount > 0 && (
            <div className="flex justify-end mt-2">
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-purple-600 hover:text-purple-700 font-medium"
              >
                Mark all read
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredNotifications.map(notification => (
                <div
                  key={notification._id}
                  className={`
                    p-4 hover:bg-gray-50 cursor-pointer transition-colors relative
                    ${getNotificationColor(notification)}
                    ${!notification.isRead ? 'border-l-4' : ''}
                  `}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type, notification.priority)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className={`text-sm ${!notification.isRead ? 'font-semibold' : 'font-medium'} text-gray-900 line-clamp-1`}>
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">
                              {formatTimeAgo(notification.createdAt)}
                            </span>
                            {notification.actionRequired && (
                              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                                Action Required
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions dropdown */}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowActions(showActions === notification._id ? null : notification._id);
                            }}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                          >
                            <MoreVertical className="w-4 h-4 text-gray-400" />
                          </button>

                          {showActions === notification._id && (
                            <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[120px]">
                              {!notification.isRead && (
                                <button
                                  onClick={(e) => handleMarkAsRead(e, notification._id)}
                                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                                >
                                  <Check className="w-4 h-4" />
                                  <span>Mark read</span>
                                </button>
                              )}
                              {notification.actionUrl && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(notification.actionUrl!);
                                    onClose();
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  <span>Open</span>
                                </button>
                              )}
                              <button
                                onClick={(e) => handleDelete(e, notification._id)}
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

                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0 mt-2"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            onClick={() => {
              navigate('/notifications');
              onClose();
            }}
            className="w-full text-center text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            View all notifications
          </button>
        </div>
      </div>
    </>
  );
};

export default NotificationPanel;
