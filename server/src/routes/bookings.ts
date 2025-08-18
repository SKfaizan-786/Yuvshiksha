import { Router } from 'express';
import { bookingController } from '../controllers/booking-controller';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleCheck';

const router = Router();

// All booking routes require authentication
router.use(authMiddleware);

// Teacher routes
router.get('/teacher', requireRole('teacher'), bookingController.getTeacherBookings);

// Student routes  
router.get('/student', requireRole('student'), bookingController.getStudentBookings);
router.post('/', requireRole('student'), bookingController.createBooking);

// Shared routes (both teacher and student can access)
router.get('/:bookingId', bookingController.getBookingDetails);
router.patch('/:bookingId/status', bookingController.updateBookingStatus);
router.patch('/:bookingId/reschedule', bookingController.rescheduleBooking);

// Utility routes
router.get('/teacher/:teacherId/availability', bookingController.getTeacherAvailability);

export default router;
