import express from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware';
import User from '../models/User';
import { getListedTeachers } from '../controllers/profile-controller';

const router = express.Router();

// Add debug route (temporarily)
router.get('/debug', authMiddleware, getListedTeachers);

// Get list of all available teachers (PUBLIC - no auth required)
router.get('/list', async (req, res) => {
  try {
    console.log('ðŸ” API: Getting teacher list...');
    
    const teachers = await User.find({
      role: 'teacher',
      'teacherProfile.isListed': true
    }).select('firstName lastName email teacherProfile');

    console.log(`ðŸ“Š Found ${teachers.length} listed teachers`);
    
    // Log each found teacher
    teachers.forEach(teacher => {
      console.log(`âœ… Listed teacher: ${teacher.firstName} ${teacher.lastName} (${teacher.email})`);
    });

    res.json(teachers);
  } catch (error) {
    console.error('âŒ Error fetching teachers:', error);
    res.status(500).json({ message: 'Failed to fetch teachers' });
  }
});

// Get specific teacher details
router.get('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const teacher = await User.findOne({
      _id: req.params.id,
      role: 'teacher'
    }).select('firstName lastName email teacherProfile');

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    res.json(teacher);
  } catch (error) {
    console.error('Error fetching teacher:', error);
    res.status(500).json({ message: 'Failed to fetch teacher details' });
  }
});

// Get teacher availability for a specific date
router.get('/:id/availability', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const teacher = await User.findOne({ _id: req.params.id, role: 'teacher' }).select('teacherProfile.availability');
    if (!teacher || !teacher.teacherProfile) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    const availability = teacher.teacherProfile.availability || [];
  // Parse date as yyyy-mm-dd in UTC to avoid timezone issues
  const [year, month, day] = (date as string).split('-').map(Number);
  const jsDate = new Date(Date.UTC(year, month - 1, day));
  const dayOfWeek = jsDate.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });

    // Debug logs
    console.log('--- Teacher Availability Debug ---');
    console.log('Requested date:', date);
    console.log('Computed dayOfWeek:', dayOfWeek);
    console.log('Teacher availability:', availability);
    console.log('-------------------------------');

    // Find the availability for the requested day only
    const slotsForDay = availability.filter(a => a.day === dayOfWeek);
    if (!slotsForDay.length) {
      // Teacher is not available on this day
      return res.json({ slots: [] });
    }

    let slots: string[] = [];
    const avail = slotsForDay[0];
    if (avail.slots && Array.isArray(avail.slots)) {
      // Old format: explicit slots
      slots = avail.slots;
    } else if (avail.startTime && avail.endTime) {
      // New format: generate user-friendly slots within the available time range
      const start: string = avail.startTime;
      const end: string = avail.endTime;
      function generateSlots(start: string, end: string): string[] {
        const slotsArr: string[] = [];
        let [sh, sm] = start.split(':').map(Number);
        let [eh, em] = end.split(':').map(Number);
        let current = new Date(2000, 0, 1, sh, sm);
        const endTime = new Date(2000, 0, 1, eh, em);
        while (current < endTime) {
          const next = new Date(current.getTime() + 60 * 60 * 1000);
          if (next > endTime) break;
          const pad = (n: number) => n.toString().padStart(2, '0');
          slotsArr.push(`${pad(current.getHours())}:${pad(current.getMinutes())} - ${pad(next.getHours())}:${pad(next.getMinutes())}`);
          current = next;
        }
        return slotsArr;
      }
      slots = generateSlots(start, end);
    }
    res.json({ slots });
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ message: 'Failed to fetch availability' });
  }
});

export default router;