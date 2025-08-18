import express from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware';
import { Booking } from '../models/Booking';
import User from '../models/User';

const router = express.Router();

// Create a booking
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { teacherId, subject, date, time, duration, notes } = req.body;
    const student = req.user;

    if (!student) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const teacher = await User.findById(teacherId).select('firstName lastName email teacherProfile');
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    const newBooking = new Booking({
      student: {
        id: student._id,
        name: `${student.firstName} ${student.lastName}`,
        email: student.email,
        phone: student.studentProfile?.phone
      },
      teacher: {
        id: teacher._id,
        name: `${teacher.firstName} ${teacher.lastName}`,
        email: teacher.email
      },
      subject,
      date,
      time,
      duration,
      status: 'pending',
      amount: teacher.teacherProfile?.hourlyRate || 0,
      notes
    });

    await newBooking.save();
    res.status(201).json(newBooking);
  } catch (error) {
    console.error('âŒ Error creating booking:', error);
    res.status(500).json({ message: 'Failed to create booking' });
  }
});

export default router;