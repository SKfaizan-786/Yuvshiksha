import cron from 'node-cron';
import { Booking } from '../models/Booking';
import { notificationService } from './notificationService';

class ReminderService {
  private isInitialized = false;

  init() {
    if (this.isInitialized) {
      return;
    }

    console.log('🔔 Initializing reminder service...');

    // Run every 15 minutes to check for upcoming classes
    cron.schedule('*/15 * * * *', () => {
      this.checkUpcomingClasses();
    });

    // Run daily at 9 AM to send 24-hour reminders
    cron.schedule('0 9 * * *', () => {
      this.send24HourReminders();
    });

    // Run every hour to send 1-hour reminders
    cron.schedule('0 * * * *', () => {
      this.send1HourReminders();
    });

    // Cleanup old notifications every Sunday at 2 AM
    cron.schedule('0 2 * * 0', () => {
      notificationService.cleanupOldNotifications();
    });

    this.isInitialized = true;
    console.log('✅ Reminder service initialized');
  }

  private async checkUpcomingClasses() {
    try {
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      
      // Find confirmed bookings that start within the next hour
      const upcomingBookings = await Booking.find({
        status: 'confirmed',
        date: {
          $gte: new Date(now.toDateString()), // Today
          $lt: new Date(now.getTime() + 24 * 60 * 60 * 1000) // Next 24 hours
        }
      });

      for (const booking of upcomingBookings) {
        const classDateTime = new Date(`${booking.date.toDateString()} ${booking.time}`);
        const timeDiff = classDateTime.getTime() - now.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        // Send 1-hour reminder
        if (hoursDiff > 0.8 && hoursDiff <= 1.2) {
          await this.sendClassReminder(booking, '1h');
        }
      }
    } catch (error) {
      console.error('Error checking upcoming classes:', error);
    }
  }

  private async send24HourReminders() {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

      // Find confirmed bookings for tomorrow
      const tomorrowBookings = await Booking.find({
        status: 'confirmed',
        date: {
          $gte: tomorrow,
          $lt: dayAfterTomorrow
        }
      });

      for (const booking of tomorrowBookings) {
        await this.sendClassReminder(booking, '24h');
      }

      console.log(`📅 Sent 24-hour reminders for ${tomorrowBookings.length} classes`);
    } catch (error) {
      console.error('Error sending 24-hour reminders:', error);
    }
  }

  private async send1HourReminders() {
    try {
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

      // Find confirmed bookings that start within the next hour
      const upcomingBookings = await Booking.find({
        status: 'confirmed',
        date: {
          $gte: new Date(now.toDateString()),
          $lt: new Date(now.getTime() + 24 * 60 * 60 * 1000)
        }
      });

      let remindersSent = 0;

      for (const booking of upcomingBookings) {
        const classDateTime = new Date(`${booking.date.toDateString()} ${booking.time}`);
        const timeDiff = classDateTime.getTime() - now.getTime();
        const minutesDiff = timeDiff / (1000 * 60);

        // Send reminder if class is 45-75 minutes away
        if (minutesDiff > 45 && minutesDiff <= 75) {
          await this.sendClassReminder(booking, '1h');
          remindersSent++;
        }
      }

      if (remindersSent > 0) {
        console.log(`⏰ Sent 1-hour reminders for ${remindersSent} classes`);
      }
    } catch (error) {
      console.error('Error sending 1-hour reminders:', error);
    }
  }

  private async sendClassReminder(booking: any, reminderType: '24h' | '1h') {
    try {
      await notificationService.sendClassReminder(booking, reminderType);
    } catch (error) {
      console.error(`Error sending ${reminderType} reminder for booking ${booking._id}:`, error);
    }
  }

  // Manual method to send a reminder for a specific booking
  async sendManualReminder(bookingId: string, reminderType: '24h' | '1h' = '1h') {
    try {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        throw new Error('Booking not found');
      }

      if (booking.status !== 'confirmed') {
        throw new Error('Can only send reminders for confirmed bookings');
      }

      await this.sendClassReminder(booking, reminderType);
      console.log(`📢 Manual reminder sent for booking ${bookingId}`);
    } catch (error) {
      console.error('Error sending manual reminder:', error);
      throw error;
    }
  }

  // Get reminder statistics
  async getReminderStats() {
    try {
      const now = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

      // Count upcoming confirmed bookings
      const upcomingToday = await Booking.countDocuments({
        status: 'confirmed',
        date: {
          $gte: new Date(now.toDateString()),
          $lt: tomorrow
        }
      });

      const upcomingTomorrow = await Booking.countDocuments({
        status: 'confirmed',
        date: {
          $gte: tomorrow,
          $lt: dayAfterTomorrow
        }
      });

      const upcomingThisWeek = await Booking.countDocuments({
        status: 'confirmed',
        date: {
          $gte: now,
          $lt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        }
      });

      return {
        upcomingToday,
        upcomingTomorrow,
        upcomingThisWeek,
        lastChecked: now
      };
    } catch (error) {
      console.error('Error getting reminder stats:', error);
      throw error;
    }
  }
}

export const reminderService = new ReminderService();
