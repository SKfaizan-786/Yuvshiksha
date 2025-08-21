import { Response } from 'express';
import { Booking, IBooking } from '../models/Booking';
import UserModel, { IUser } from '../models/User';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { notificationService } from '../services/notificationService';
import Payment from '../models/Payment';
import mongoose from 'mongoose';

export const bookingController = {
  getTeacherBookings: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const teacherId = req.user?.id;
      if (!teacherId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { status, page = 1, limit = 10, search, dateFilter } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const query: any = { 'teacher.id': teacherId };

      if (status && status !== 'all') {
        query.status = status;
      }

      if (search) {
        query.$or = [
          { 'student.name': { $regex: search, $options: 'i' } },
          { 'student.email': { $regex: search, $options: 'i' } },
          { subject: { $regex: search, $options: 'i' } }
        ];
      }

      if (dateFilter && dateFilter !== 'all') {
        const now = new Date();
        switch (dateFilter) {
          case 'today':
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
            query.date = { $gte: today, $lt: tomorrow };
            break;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            query.date = { $gte: weekAgo, $lte: now };
            break;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            query.date = { $gte: monthAgo, $lte: now };
            break;
        }
      }

      let bookings = await Booking.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

      // Ensure teacher.phone is always present in the response
      bookings = bookings.map(b => {
        if (!b.teacher.phone) {
          b.teacher.phone = 'N/A';
        }
        return b;
      });

      const total = await Booking.countDocuments(query);

      const stats = {
        total: await Booking.countDocuments({ 'teacher.id': teacherId }),
        pending: await Booking.countDocuments({ 'teacher.id': teacherId, status: 'pending' }),
        confirmed: await Booking.countDocuments({ 'teacher.id': teacherId, status: 'confirmed' }),
        completed: await Booking.countDocuments({ 'teacher.id': teacherId, status: 'completed' }),
        cancelled: await Booking.countDocuments({ 'teacher.id': teacherId, status: 'cancelled' })
      };

      res.json({
        bookings,
        pagination: {
          current: Number(page),
          total: Math.ceil(total / Number(limit)),
          count: total
        },
        stats
      });
    } catch (error) {
      console.error('Error fetching teacher bookings:', error);
      res.status(500).json({ message: 'Error fetching bookings' });
    }
  },

  getStudentBookings: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const studentId = req.user?.id;
      if (!studentId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { status, page = 1, limit = 10 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const query: any = { 'student.id': studentId };
      if (status && status !== 'all') {
        query.status = status;
      }

      let bookings = await Booking.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

      // Ensure teacher.phone is always present in the response
      bookings = bookings.map(b => {
        if (!b.teacher.phone) {
          b.teacher.phone = 'N/A';
        }
        return b;
      });

      const total = await Booking.countDocuments(query);

      res.json({
        bookings,
        pagination: {
          current: Number(page),
          total: Math.ceil(total / Number(limit)),
          count: total
        }
      });
    } catch (error) {
      console.error('Error fetching student bookings:', error);
      res.status(500).json({ message: 'Error fetching bookings' });
    }
  },

  createBooking: async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log('Incoming booking request:', {
        body: req.body,
        headers: req.headers,
        user: req.user
      });
      const studentId = req.user?.id;
      if (!studentId) {
        console.log('Booking failed: Unauthorized');
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Support both legacy (time/duration) and new (slots) booking
      let { teacherId, subject, date, time, duration, notes, slots } = req.body;

      // If slots is provided (multi-slot booking)
      if (Array.isArray(slots) && slots.length > 0) {
        // Assume slot format is "HH:mm - HH:mm" or "HH:mm"
        // Use the first slot's start as time, duration = slots.length
        const firstSlot = slots[0];
        // Extract start time (before ' - ' if present)
        time = typeof firstSlot === 'string' ? firstSlot.split(' - ')[0] : firstSlot;
        duration = slots.length;
      }

      if (!teacherId || !subject || !date || !time || !duration) {
        console.log('Booking failed: Missing required fields', req.body);
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const teacher = await UserModel.findById(teacherId);
      if (!teacher || teacher.role !== 'teacher') {
        console.log('Booking failed: Teacher not found', teacherId);
        return res.status(404).json({ message: 'Teacher not found' });
      }

      const student = await UserModel.findById(studentId);
      if (!student || student.role !== 'student') {
        console.log('Booking failed: Student not found', studentId);
        return res.status(404).json({ message: 'Student not found' });
      }

      const existingBookings = await Booking.find({
        'teacher.id': teacherId,
        date: {
          $gte: new Date(new Date(date).toISOString().split('T')[0]),
          $lt: new Date(new Date(new Date(date).toISOString().split('T')[0]).getTime() + 24 * 60 * 60 * 1000)
        },
        status: { $in: ['pending', 'confirmed'] }
      });

      const startTime = new Date(`${new Date(date).toISOString().split('T')[0]}T${time}:00`);
      const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000);

      const hasConflict = existingBookings.some(booking => {
        const existingStart = new Date(`${booking.date.toISOString().split('T')[0]}T${booking.time}:00`);
        const existingEnd = new Date(existingStart.getTime() + booking.duration * 60 * 60 * 1000);
        return startTime < existingEnd && endTime > existingStart;
      });

      if (hasConflict) {
        console.log('Booking failed: Conflict detected');
        return res.status(409).json({ message: 'Teacher is not available at the selected time' });
      }

      const hourlyRate = teacher.teacherProfile?.hourlyRate || 800;
      const amount = hourlyRate * duration;

      const booking = new Booking({
        student: {
          id: studentId,
          name: `${student.firstName} ${student.lastName}`,
          email: student.email,
          phone: student.studentProfile?.phone || 'N/A'
        },
        teacher: {
          id: teacherId,
          name: `${teacher.firstName} ${teacher.lastName}`,
          email: teacher.email,
          phone: teacher.teacherProfile?.phone || 'N/A'
        },
        subject,
        date: new Date(date),
        time,
        duration,
        slots: Array.isArray(slots) && slots.length > 0 ? slots : undefined,
        amount,
        notes: notes || '',
        status: 'pending'
      });

      await booking.save();
      console.log('Booking created successfully:', booking._id);

      // Send notification to teacher about new booking request
      await notificationService.notifyBookingPending(booking);

      res.status(201).json({
        message: 'Booking created successfully',
        booking: {
          id: booking._id,
          status: booking.status,
          student: booking.student,
          teacher: booking.teacher,
          subject: booking.subject,
          date: booking.date,
          time: booking.time,
          duration: booking.duration,
          slots: booking.slots,
          amount: booking.amount,
          notes: booking.notes,
          // Ensure teacher phone is always included in the response
          teacherPhone: booking.teacher.phone || 'N/A'
        }
      });
    } catch (error) {
      console.error('Error creating booking:', error);
      if (error instanceof Error) {
        // Log stack and error details
        console.error('Error stack:', error.stack);
        if ((error as any).errors) {
          // Mongoose validation errors
          for (const [field, err] of Object.entries((error as any).errors)) {
            console.error(`Validation error for ${field}:`, (err as any).message);
          }
        }
        res.status(500).json({ message: 'Error creating booking', error: error.message, stack: error.stack, details: (error as any).errors });
      } else if (typeof error === 'string') {
        res.status(500).json({ message: 'Error creating booking', error });
      } else {
        res.status(500).json({ message: 'Error creating booking', error: 'Unknown error' });
      }
    }
  },

  updateBookingStatus: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { bookingId } = req.params;
      const { status, cancelReason, meetingLink } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      const isTeacher = booking.teacher.id.toString() === userId;
      const isStudent = booking.student.id.toString() === userId;

      if (!isTeacher && !isStudent) {
        return res.status(403).json({ message: 'Unauthorized to update this booking' });
      }

      const validTransitions: { [key: string]: string[] } = {
        pending: ['confirmed', 'cancelled'],
        confirmed: ['completed', 'cancelled', 'rescheduled'],
        completed: [],
        cancelled: [],
        rescheduled: ['confirmed', 'cancelled']
      };

      if (!validTransitions[booking.status].includes(status)) {
        return res.status(400).json({ 
          message: `Cannot change status from ${booking.status} to ${status}` 
        });
      }

      booking.status = status;

      if (status === 'cancelled') {
        booking.cancelledBy = isTeacher ? 'teacher' : 'student';
        booking.cancelReason = cancelReason || '';
      }

      if (status === 'confirmed' && meetingLink) {
        booking.meetingLink = meetingLink;
      }

      await booking.save();

      // Send notifications based on status change
      if (status === 'confirmed' && isTeacher) {
        // Teacher approved the booking
        const teacher = await UserModel.findById(userId);
        const teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Teacher';
        await notificationService.notifyBookingApproved(booking, teacherName, meetingLink);
      } else if (status === 'cancelled') {
        // Handle cancellation notifications and refunds
        if (isTeacher) {
          // Teacher rejected the booking - initiate refund
          const teacher = await UserModel.findById(userId);
          const teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Teacher';
          
          // Find and process refund
          const payment = await Payment.findOne({ booking: booking._id });
          if (payment && payment.status === 'completed') {
            payment.refundStatus = 'completed';
            payment.refundAmount = payment.amount;
            payment.refundReason = cancelReason || 'Booking rejected by teacher';
            payment.refundedAt = new Date();
            await payment.save();

            // Notify about refund
            await notificationService.notifyRefundProcessed(payment, payment.refundReason || 'Booking rejected by teacher');
          }

          // Notify about booking rejection
          await notificationService.notifyBookingRejected(booking, teacherName, payment?.amount);
        }
        // Note: Student cancellation notifications can be added here if needed
      }

      res.json({
        message: 'Booking status updated successfully',
        booking
      });
    } catch (error) {
      console.error('Error updating booking status:', error);
      res.status(500).json({ message: 'Error updating booking status' });
    }
  },

  rescheduleBooking: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { bookingId } = req.params;
      const { date, time } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      const isTeacher = booking.teacher.id.toString() === userId;
      const isStudent = booking.student.id.toString() === userId;

      if (!isTeacher && !isStudent) {
        return res.status(403).json({ message: 'Unauthorized to reschedule this booking' });
      }

      if (!['pending', 'confirmed'].includes(booking.status)) {
        return res.status(400).json({ message: 'Booking cannot be rescheduled' });
      }

      const existingBookings = await Booking.find({
        'teacher.id': booking.teacher.id,
        date: {
          $gte: new Date(new Date(date).toISOString().split('T')[0]),
          $lt: new Date(new Date(new Date(date).toISOString().split('T')[0]).getTime() + 24 * 60 * 60 * 1000)
        },
        status: { $in: ['pending', 'confirmed'] },
        _id: { $ne: bookingId }
      });

      const startTime = new Date(`${new Date(date).toISOString().split('T')[0]}T${time}:00`);
      const endTime = new Date(startTime.getTime() + booking.duration * 60 * 60 * 1000);

      const hasConflict = existingBookings.some(existingBooking => {
        const existingStart = new Date(`${existingBooking.date.toISOString().split('T')[0]}T${existingBooking.time}:00`);
        const existingEnd = new Date(existingStart.getTime() + existingBooking.duration * 60 * 60 * 1000);
        return startTime < existingEnd && endTime > existingStart;
      });

      if (hasConflict) {
        return res.status(409).json({ message: 'Teacher is not available at the selected time' });
      }

      booking.rescheduledFrom = {
        date: booking.date,
        time: booking.time
      };

      booking.date = new Date(date);
      booking.time = time;
      booking.status = 'rescheduled';

      await booking.save();

      res.json({
        message: 'Booking rescheduled successfully',
        booking
      });
    } catch (error) {
      console.error('Error rescheduling booking:', error);
      res.status(500).json({ message: 'Error rescheduling booking' });
    }
  },

  getBookingDetails: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { bookingId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      const isTeacher = booking.teacher.id.toString() === userId;
      const isStudent = booking.student.id.toString() === userId;

      if (!isTeacher && !isStudent) {
        return res.status(403).json({ message: 'Unauthorized to view this booking' });
      }

      res.json({ booking });
    } catch (error) {
      console.error('Error fetching booking details:', error);
      res.status(500).json({ message: 'Error fetching booking details' });
    }
  },

  getTeacherAvailability: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { teacherId } = req.params;
      const { date } = req.query;

      if (!date) {
        return res.status(400).json({ message: 'Date is required' });
      }

      const bookings = await Booking.find({
        'teacher.id': teacherId,
        date: {
          $gte: new Date(date as string),
          $lt: new Date(new Date(date as string).getTime() + 24 * 60 * 60 * 1000)
        },
        status: { $in: ['pending', 'confirmed'] }
      });

      const availableSlots = [];
      for (let hour = 9; hour < 21; hour++) {
        const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
        
        const hasConflict = bookings.some(booking => {
          const bookingStart = new Date(`${booking.date.toISOString().split('T')[0]}T${booking.time}:00`);
          const bookingEnd = new Date(bookingStart.getTime() + booking.duration * 60 * 60 * 1000);
          const slotStart = new Date(`${booking.date.toISOString().split('T')[0]}T${timeSlot}:00`);
          const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);
          
          return slotStart < bookingEnd && slotEnd > bookingStart;
        });

        if (!hasConflict) {
          availableSlots.push(timeSlot);
        }
      }

      res.json({ availableSlots });
    } catch (error) {
      console.error('Error fetching teacher availability:', error);
      res.status(500).json({ message: 'Error fetching availability' });
    }
  }
};