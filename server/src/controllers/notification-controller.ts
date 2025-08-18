import { Response } from 'express';
import { Types } from 'mongoose';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { notificationService } from '../services/notificationService';
import { Notification } from '../models/Notification';

export const notificationController = {
  // Get notifications for authenticated user
  getNotifications: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const {
        page = 1,
        limit = 20,
        unreadOnly = false,
        category
      } = req.query;

      const options = {
        page: Number(page),
        limit: Number(limit),
        unreadOnly: unreadOnly === 'true',
        category: category as string
      };

      const result = await notificationService.getUserNotifications(
        new Types.ObjectId(userId),
        options
      );

      res.json({
        notifications: result.notifications,
        pagination: {
          current: Number(page),
          total: Math.ceil(result.total / Number(limit)),
          count: result.total
        },
        unreadCount: result.unreadCount
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: 'Error fetching notifications' });
    }
  },

  // Get unread notifications count
  getUnreadCount: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const unreadCount = await Notification.countDocuments({
        recipient: new Types.ObjectId(userId),
        isRead: false
      });

      res.json({ unreadCount });
    } catch (error) {
      console.error('Error fetching unread count:', error);
      res.status(500).json({ message: 'Error fetching unread count' });
    }
  },

  // Mark specific notifications as read
  markAsRead: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { notificationIds } = req.body;

      if (!notificationIds || !Array.isArray(notificationIds)) {
        return res.status(400).json({ message: 'Invalid notification IDs' });
      }

      // Verify notifications belong to the user
      const notifications = await Notification.find({
        _id: { $in: notificationIds },
        recipient: new Types.ObjectId(userId)
      });

      if (notifications.length !== notificationIds.length) {
        return res.status(403).json({ message: 'Some notifications do not belong to you' });
      }

      await notificationService.markNotificationsAsRead(notificationIds);

      res.json({ message: 'Notifications marked as read' });
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      res.status(500).json({ message: 'Error marking notifications as read' });
    }
  },

  // Mark all notifications as read
  markAllAsRead: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      await notificationService.markAllAsRead(new Types.ObjectId(userId));

      res.json({ message: 'All notifications marked as read' });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ message: 'Error marking all notifications as read' });
    }
  },

  // Delete a notification
  deleteNotification: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const { notificationId } = req.params;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      await notificationService.deleteNotification(notificationId, new Types.ObjectId(userId));

      res.json({ message: 'Notification deleted' });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ message: 'Error deleting notification' });
    }
  },

  // Get notification statistics
  getNotificationStats: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const userObjectId = new Types.ObjectId(userId);

      // Get counts by category and read status
      const stats = await Notification.aggregate([
        { $match: { recipient: userObjectId } },
        {
          $group: {
            _id: {
              category: '$category',
              isRead: '$isRead'
            },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: '$_id.category',
            total: { $sum: '$count' },
            unread: {
              $sum: {
                $cond: [{ $eq: ['$_id.isRead', false] }, '$count', 0]
              }
            }
          }
        }
      ]);

      // Format the results
      const formattedStats = {
        total: 0,
        unread: 0,
        categories: {} as Record<string, { total: number; unread: number }>
      };

      for (const stat of stats) {
        formattedStats.total += stat.total;
        formattedStats.unread += stat.unread;
        formattedStats.categories[stat._id] = {
          total: stat.total,
          unread: stat.unread
        };
      }

      res.json(formattedStats);
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      res.status(500).json({ message: 'Error fetching notification stats' });
    }
  },

  // Get recent activity (last 24 hours)
  getRecentActivity: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const recentNotifications = await Notification.find({
        recipient: new Types.ObjectId(userId),
        createdAt: { $gte: yesterday }
      })
        .populate('sender', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(10);

      res.json(recentNotifications);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      res.status(500).json({ message: 'Error fetching recent activity' });
    }
  }
};
