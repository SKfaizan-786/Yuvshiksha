import { Types } from 'mongoose';
import { Notification, INotification } from '../models/Notification';
import { Booking, IBooking } from '../models/Booking';
import Payment, { IPayment } from '../models/Payment';
import UserModel, { IUser } from '../models/User';
import { sendEmail } from '../utils/sendEmail';

// Import socket.io instance for real-time notifications
let io: any = null;

export const setSocketIO = (socketIOInstance: any) => {
  io = socketIOInstance;
};

export interface NotificationData {
  recipient: Types.ObjectId | string;
  sender?: Types.ObjectId | string;
  title: string;
  message: string;
  type: INotification['type'];
  category: INotification['category'];
  priority?: INotification['priority'];
  data?: any;
  actionRequired?: boolean;
  actionUrl?: string;
  expiresAt?: Date;
  sendEmail?: boolean;
}

class NotificationService {
  // Create a new notification
  async createNotification(notificationData: NotificationData): Promise<INotification> {
    try {
      const notification = new Notification({
        recipient: typeof notificationData.recipient === 'string' 
          ? new Types.ObjectId(notificationData.recipient) 
          : notificationData.recipient,
        sender: notificationData.sender 
          ? (typeof notificationData.sender === 'string' 
              ? new Types.ObjectId(notificationData.sender) 
              : notificationData.sender)
          : undefined,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        category: notificationData.category,
        priority: notificationData.priority || 'medium',
        data: notificationData.data || {},
        actionRequired: notificationData.actionRequired || false,
        actionUrl: notificationData.actionUrl,
        expiresAt: notificationData.expiresAt
      });

      await notification.save();

      // Send real-time notification via socket.io
      if (io) {
        io.to(`user_${notificationData.recipient.toString()}`).emit('new_notification', {
          id: notification._id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          priority: notification.priority,
          category: notification.category,
          actionRequired: notification.actionRequired,
          actionUrl: notification.actionUrl,
          data: notification.data,
          createdAt: notification.createdAt
        });
      }

      // Send email notification if requested
      if (notificationData.sendEmail) {
        await this.sendEmailNotification(notification);
      }

      console.log(`✅ Notification created: ${notificationData.type} for user ${notificationData.recipient}`);
      return notification;
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      throw error;
    }
  }

  // Send email notification
  async sendEmailNotification(notification: INotification): Promise<void> {
    try {
      const user = await UserModel.findById(notification.recipient);
      if (!user || !user.email) {
        console.warn('⚠️ User not found or no email for notification:', notification._id);
        return;
      }

      const emailTemplate = this.getEmailTemplate(notification);
      await sendEmail(user.email, emailTemplate.subject, emailTemplate.html);
      
      // Mark email as sent
      notification.emailSent = true;
      await notification.save();

      console.log(`📧 Email notification sent to ${user.email}`);
    } catch (error) {
      console.error('❌ Error sending email notification:', error);
    }
  }

  // Get email template based on notification type
  private getEmailTemplate(notification: INotification): { subject: string; html: string } {
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    
    const templates = {
      booking_pending: {
        subject: '📚 New Class Booking Request - Action Required',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #7c3aed;">New Class Booking Request</h2>
            <p>Hello,</p>
            <p>You have received a new class booking request that requires your approval.</p>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Student:</strong> ${notification.data?.studentName || 'N/A'}</p>
              <p><strong>Subject:</strong> ${notification.data?.subject || 'N/A'}</p>
              <p><strong>Date:</strong> ${notification.data?.classDate ? new Date(notification.data.classDate).toLocaleDateString() : 'N/A'}</p>
              <p><strong>Time:</strong> ${notification.data?.classTime || 'N/A'}</p>
              <p><strong>Amount:</strong> ₹${notification.data?.amount || 'N/A'}</p>
            </div>
            <p>Please review and approve or reject this booking request.</p>
            ${notification.actionUrl ? `<a href="${baseUrl}${notification.actionUrl}" style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Review Booking</a>` : ''}
            <p style="margin-top: 30px; color: #64748b; font-size: 14px;">Best regards,<br>Studity Team</p>
          </div>
        `
      },
      booking_approved: {
        subject: '✅ Class Booking Approved - Ready to Learn!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">Your Class Booking is Approved!</h2>
            <p>Great news! Your class booking has been approved by your teacher.</p>
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Teacher:</strong> ${notification.data?.teacherName || 'N/A'}</p>
              <p><strong>Subject:</strong> ${notification.data?.subject || 'N/A'}</p>
              <p><strong>Date:</strong> ${notification.data?.classDate ? new Date(notification.data.classDate).toLocaleDateString() : 'N/A'}</p>
              <p><strong>Time:</strong> ${notification.data?.classTime || 'N/A'}</p>
              ${notification.data?.meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${notification.data.meetingLink}">${notification.data.meetingLink}</a></p>` : ''}
            </div>
            <p>Get ready for your learning session!</p>
            ${notification.actionUrl ? `<a href="${baseUrl}${notification.actionUrl}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Details</a>` : ''}
            <p style="margin-top: 30px; color: #64748b; font-size: 14px;">Best regards,<br>Studity Team</p>
          </div>
        `
      },
      booking_rejected: {
        subject: '❌ Class Booking Not Approved - Refund Initiated',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ef4444;">Class Booking Update</h2>
            <p>We regret to inform you that your class booking request was not approved by the teacher.</p>
            <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Teacher:</strong> ${notification.data?.teacherName || 'N/A'}</p>
              <p><strong>Subject:</strong> ${notification.data?.subject || 'N/A'}</p>
              <p><strong>Date:</strong> ${notification.data?.classDate ? new Date(notification.data.classDate).toLocaleDateString() : 'N/A'}</p>
              <p><strong>Refund Amount:</strong> ₹${notification.data?.refundAmount || notification.data?.amount || 'N/A'}</p>
            </div>
            <p>Don't worry! Your payment has been refunded and will be processed within 3-5 business days.</p>
            <p>You can explore other teachers and book again anytime.</p>
            ${notification.actionUrl ? `<a href="${baseUrl}${notification.actionUrl}" style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Find Other Teachers</a>` : ''}
            <p style="margin-top: 30px; color: #64748b; font-size: 14px;">Best regards,<br>Studity Team</p>
          </div>
        `
      },
      payment_received: {
        subject: '💰 Payment Received for Class Booking',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">Payment Received Successfully</h2>
            <p>Great! You have received a payment for an approved class booking.</p>
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Student:</strong> ${notification.data?.studentName || 'N/A'}</p>
              <p><strong>Subject:</strong> ${notification.data?.subject || 'N/A'}</p>
              <p><strong>Date:</strong> ${notification.data?.classDate ? new Date(notification.data.classDate).toLocaleDateString() : 'N/A'}</p>
              <p><strong>Amount Received:</strong> ₹${notification.data?.amount || 'N/A'}</p>
              <p><strong>Platform Fee:</strong> ₹${notification.data?.platformFee || 'N/A'}</p>
              <p><strong>Your Earning:</strong> ₹${notification.data?.teacherEarning || 'N/A'}</p>
            </div>
            <p>The amount will be transferred to your account as per the payment schedule.</p>
            ${notification.actionUrl ? `<a href="${baseUrl}${notification.actionUrl}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Earnings</a>` : ''}
            <p style="margin-top: 30px; color: #64748b; font-size: 14px;">Best regards,<br>Studity Team</p>
          </div>
        `
      },
      payment_refunded: {
        subject: '💸 Refund Processed - Amount Credited',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f59e0b;">Refund Processed Successfully</h2>
            <p>Your refund has been processed and will be credited to your account shortly.</p>
            <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Booking ID:</strong> ${notification.data?.bookingId || 'N/A'}</p>
              <p><strong>Refund Amount:</strong> ₹${notification.data?.refundAmount || 'N/A'}</p>
              <p><strong>Reason:</strong> ${notification.data?.refundReason || 'Booking cancelled'}</p>
              <p><strong>Processing Time:</strong> 3-5 business days</p>
            </div>
            <p>If you have any questions about this refund, please contact our support team.</p>
            ${notification.actionUrl ? `<a href="${baseUrl}${notification.actionUrl}" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Transaction</a>` : ''}
            <p style="margin-top: 30px; color: #64748b; font-size: 14px;">Best regards,<br>Studity Team</p>
          </div>
        `
      },
      class_reminder: {
        subject: '⏰ Class Reminder - Starting Soon!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #7c3aed;">Class Reminder</h2>
            <p>This is a reminder that your class is starting soon!</p>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Subject:</strong> ${notification.data?.subject || 'N/A'}</p>
              <p><strong>Date:</strong> ${notification.data?.classDate ? new Date(notification.data.classDate).toLocaleDateString() : 'N/A'}</p>
              <p><strong>Time:</strong> ${notification.data?.classTime || 'N/A'}</p>
              ${notification.data?.meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${notification.data.meetingLink}">${notification.data.meetingLink}</a></p>` : ''}
            </div>
            <p>Make sure you're ready and have all necessary materials!</p>
            ${notification.actionUrl ? `<a href="${baseUrl}${notification.actionUrl}" style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Join Class</a>` : ''}
            <p style="margin-top: 30px; color: #64748b; font-size: 14px;">Best regards,<br>Studity Team</p>
          </div>
        `
      },
      message: {
        subject: 'New Message Received',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>${notification.title}</h2>
            <p>${notification.message}</p>
            <p style="margin-top: 30px; color: #64748b; font-size: 14px;">Best regards,<br>Studity Team</p>
          </div>
        `
      }
    };

    return templates[notification.type as keyof typeof templates] || {
      subject: notification.title,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>${notification.title}</h2>
          <p>${notification.message}</p>
          <p style="margin-top: 30px; color: #64748b; font-size: 14px;">Best regards,<br>Studity Team</p>
        </div>
      `
    };
  }

  // Booking-related notifications
  async notifyBookingPending(booking: IBooking): Promise<void> {
    try {
      await this.createNotification({
        recipient: booking.teacher.id,
        sender: booking.student.id,
        title: 'New Class Booking Request',
        message: `${booking.student.name} has requested a class booking for ${booking.subject}. Please review and approve.`,
        type: 'booking_pending',
        category: 'booking',
        priority: 'high',
        actionRequired: true,
        actionUrl: `/teacher/bookings/${booking._id}`,
        data: {
          bookingId: booking._id,
          studentId: booking.student.id,
          studentName: booking.student.name,
          subject: booking.subject,
          classDate: booking.date,
          classTime: booking.time,
          amount: booking.amount
        },
        sendEmail: true
      });
    } catch (error) {
      console.error('Error sending booking pending notification:', error);
    }
  }

  async notifyBookingApproved(booking: IBooking, teacherName: string, meetingLink?: string): Promise<void> {
    try {
      // Notify student
      await this.createNotification({
        recipient: booking.student.id,
        sender: booking.teacher.id,
        title: 'Class Booking Approved! 🎉',
        message: `Great news! ${teacherName} has approved your class booking for ${booking.subject}. Get ready to learn!`,
        type: 'booking_approved',
        category: 'booking',
        priority: 'high',
        actionUrl: `/student/bookings/${booking._id}`,
        data: {
          bookingId: booking._id,
          teacherId: booking.teacher.id,
          teacherName: teacherName,
          subject: booking.subject,
          classDate: booking.date,
          classTime: booking.time,
          meetingLink: meetingLink
        },
        sendEmail: true
      });

      // Notify teacher about payment received (if payment exists)
      const payment = await Payment.findOne({ booking: booking._id });
      if (payment && payment.status === 'completed') {
        await this.notifyPaymentReceived(payment, booking.student.name);
      }
    } catch (error) {
      console.error('Error sending booking approved notification:', error);
    }
  }

  async notifyBookingRejected(booking: IBooking, teacherName: string, refundAmount?: number): Promise<void> {
    try {
      await this.createNotification({
        recipient: booking.student.id,
        sender: booking.teacher.id,
        title: 'Booking Not Approved - Refund Initiated',
        message: `Unfortunately, ${teacherName} couldn't approve your class booking for ${booking.subject}. Your payment has been refunded.`,
        type: 'booking_rejected',
        category: 'booking',
        priority: 'medium',
        actionUrl: '/student/teachers',
        data: {
          bookingId: booking._id,
          teacherId: booking.teacher.id,
          teacherName: teacherName,
          subject: booking.subject,
          classDate: booking.date,
          classTime: booking.time,
          amount: booking.amount,
          refundAmount: refundAmount || booking.amount
        },
        sendEmail: true
      });
    } catch (error) {
      console.error('Error sending booking rejected notification:', error);
    }
  }

  // Payment-related notifications
  async notifyPaymentReceived(payment: IPayment, studentName: string): Promise<void> {
    try {
      await this.createNotification({
        recipient: payment.teacher,
        title: 'Payment Received! 💰',
        message: `You've received a payment of ₹${payment.teacherEarning} from ${studentName}. Keep up the great teaching!`,
        type: 'payment_received',
        category: 'payment',
        priority: 'medium',
        actionUrl: '/teacher/earnings',
        data: {
          paymentId: payment._id,
          bookingId: payment.booking,
          studentName: studentName,
          amount: payment.amount,
          platformFee: payment.platformFee,
          teacherEarning: payment.teacherEarning,
          subject: payment.metadata?.subject
        },
        sendEmail: true
      });
    } catch (error) {
      console.error('Error sending payment received notification:', error);
    }
  }

  async notifyRefundProcessed(payment: IPayment, refundReason: string): Promise<void> {
    try {
      await this.createNotification({
        recipient: payment.user,
        title: 'Refund Processed Successfully',
        message: `Your refund of ₹${payment.refundAmount || payment.amount} has been processed and will be credited to your account within 3-5 business days.`,
        type: 'payment_refunded',
        category: 'payment',
        priority: 'medium',
        actionUrl: `/student/payments/${payment._id}`,
        data: {
          paymentId: payment._id,
          bookingId: payment.booking,
          refundAmount: payment.refundAmount || payment.amount,
          refundReason: refundReason
        },
        sendEmail: true
      });
    } catch (error) {
      console.error('Error sending refund notification:', error);
    }
  }

  // Class reminder notifications
  async sendClassReminder(booking: IBooking, reminderType: '24h' | '1h' = '1h'): Promise<void> {
    try {
      const timeText = reminderType === '24h' ? '24 hours' : '1 hour';
      
      // Remind both student and teacher
      const notifications = [
        {
          recipient: booking.student.id,
          title: `Class Reminder - ${timeText} to go!`,
          message: `Your ${booking.subject} class with ${booking.teacher.name} starts in ${timeText}. Don't forget!`
        },
        {
          recipient: booking.teacher.id,
          title: `Class Reminder - ${timeText} to go!`,
          message: `Your ${booking.subject} class with ${booking.student.name} starts in ${timeText}. Get ready!`
        }
      ];

      for (const notif of notifications) {
        await this.createNotification({
          ...notif,
          type: 'class_reminder',
          category: 'reminder',
          priority: reminderType === '1h' ? 'high' : 'medium',
          actionUrl: `/bookings/${booking._id}`,
          data: {
            bookingId: booking._id,
            subject: booking.subject,
            classDate: booking.date,
            classTime: booking.time,
            meetingLink: booking.meetingLink
          },
          sendEmail: reminderType === '24h' // Only send email for 24h reminder
        });
      }
    } catch (error) {
      console.error('Error sending class reminder:', error);
    }
  }

  // Get notifications for a user
  async getUserNotifications(userId: Types.ObjectId, options: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
    category?: string;
  } = {}): Promise<{ notifications: INotification[]; total: number; unreadCount: number }> {
    try {
      const { page = 1, limit = 20, unreadOnly = false, category } = options;
      const skip = (page - 1) * limit;

      const query: any = { recipient: userId };
      
      if (unreadOnly) {
        query.isRead = false;
      }
      
      if (category) {
        query.category = category;
      }

      const notifications = await Notification.find(query)
        .populate('sender', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Notification.countDocuments(query);
      const unreadCount = await Notification.countDocuments({ recipient: userId, isRead: false });

      return { notifications, total, unreadCount };
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      throw error;
    }
  }

  // Mark notifications as read
  async markNotificationsAsRead(notificationIds: string[]): Promise<void> {
    try {
      await Notification.updateMany(
        { _id: { $in: notificationIds } },
        { isRead: true, updatedAt: new Date() }
      );
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId: Types.ObjectId): Promise<void> {
    try {
      await Notification.updateMany(
        { recipient: userId, isRead: false },
        { isRead: true, updatedAt: new Date() }
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Delete notification
  async deleteNotification(notificationId: string, userId: Types.ObjectId): Promise<void> {
    try {
      await Notification.findOneAndDelete({
        _id: notificationId,
        recipient: userId
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Cleanup old notifications (run as a cron job)
  async cleanupOldNotifications(daysOld: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const result = await Notification.deleteMany({
        isRead: true,
        createdAt: { $lt: cutoffDate }
      });

      console.log(`🧹 Cleaned up ${result.deletedCount} old notifications`);
    } catch (error) {
      console.error('Error cleaning up notifications:', error);
    }
  }
}

export const notificationService = new NotificationService();
