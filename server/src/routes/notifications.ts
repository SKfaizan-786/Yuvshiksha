import { Router } from 'express';
import { notificationController } from '../controllers/notification-controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Debug route to test if notification routes are loaded
router.get('/test', (req, res) => {
  res.json({ message: 'Notification routes are working!', timestamp: new Date() });
});

// All notification routes require authentication
router.use(authMiddleware);

// Get notifications for authenticated user
router.get('/', notificationController.getNotifications);

// Get unread notifications count
router.get('/unread-count', notificationController.getUnreadCount);

// Get notification statistics
router.get('/stats', notificationController.getNotificationStats);

// Get recent activity
router.get('/recent', notificationController.getRecentActivity);

// Mark specific notifications as read
router.patch('/mark-read', notificationController.markAsRead);

// Mark all notifications as read
router.patch('/mark-all-read', notificationController.markAllAsRead);

// Delete a notification
router.delete('/:notificationId', notificationController.deleteNotification);

export default router;
