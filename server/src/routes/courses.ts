import express from 'express';
import {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  getCoursesByInstructor
} from '../controllers/course-controller';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleCheck';

const router = express.Router();

// Public routes
router.get('/', getCourses);
router.get('/:courseId', getCourseById);
router.get('/instructor/:instructorId', getCoursesByInstructor);

// Protected routes
router.post('/', authMiddleware, requireRole('teacher'), createCourse);
router.put('/:courseId', authMiddleware, updateCourse);
router.delete('/:courseId', authMiddleware, deleteCourse);

export default router;
