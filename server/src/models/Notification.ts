import mongoose, { Document, Schema, Types } from 'mongoose';

export interface INotification extends Document {
  _id: string;
  recipient: Types.ObjectId; // User who will receive the notification
  sender?: Types.ObjectId; // User who triggered the notification (optional)
  title: string;
  message: string;
  type: 'booking_pending' | 'booking_approved' | 'booking_rejected' | 'payment_received' | 'payment_refunded' | 'class_reminder' | 'message' | 'general';
  data?: {
    bookingId?: Types.ObjectId;
    paymentId?: Types.ObjectId;
    messageId?: Types.ObjectId;
    teacherId?: Types.ObjectId;
    studentId?: Types.ObjectId;
    amount?: number;
    refundAmount?: number;
    classDate?: Date;
    classTime?: string;
    subject?: string;
    [key: string]: any;
  };
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'booking' | 'payment' | 'message' | 'reminder' | 'system';
  actionRequired?: boolean;
  actionUrl?: string; // URL to redirect when clicking notification
  expiresAt?: Date; // For temporary notifications
  emailSent?: boolean; // Track if email notification was sent
  pushSent?: boolean; // Track if push notification was sent
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  type: {
    type: String,
    enum: ['booking_pending', 'booking_approved', 'booking_rejected', 'payment_received', 'payment_refunded', 'class_reminder', 'message', 'general'],
    required: true,
    index: true
  },
  data: {
    type: Schema.Types.Mixed,
    default: {}
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['booking', 'payment', 'message', 'reminder', 'system'],
    required: true,
    index: true
  },
  actionRequired: {
    type: Boolean,
    default: false
  },
  actionUrl: {
    type: String,
    default: null
  },
  expiresAt: {
    type: Date,
    default: null
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  pushSent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better performance
NotificationSchema.index({ recipient: 1, isRead: 1 });
NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ type: 1, createdAt: -1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired notifications

// Virtual for notification age
NotificationSchema.virtual('age').get(function(this: INotification) {
  const now = new Date();
  const diffMs = now.getTime() - this.createdAt.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return diffMinutes > 0 ? `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago` : 'Just now';
  }
});

// Static method to mark notifications as read
NotificationSchema.statics.markAsRead = function(notificationIds: string[]) {
  return this.updateMany(
    { _id: { $in: notificationIds } },
    { isRead: true, updatedAt: new Date() }
  );
};

// Static method to get unread count for a user
NotificationSchema.statics.getUnreadCount = function(userId: Types.ObjectId) {
  return this.countDocuments({ recipient: userId, isRead: false });
};

// Static method to delete old read notifications
NotificationSchema.statics.cleanupOldNotifications = function(daysOld: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return this.deleteMany({
    isRead: true,
    createdAt: { $lt: cutoffDate }
  });
};

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);