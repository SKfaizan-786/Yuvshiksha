/**
 * Example usage of Auth Middleware in your Yuvshiksha project
 * 
 * This file demonstrates how to use the auth middleware we just created
 */

import express from 'express';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/authMiddleware';
import { requireRole, requireProfileComplete } from '../middleware/roleCheck';

const router = express.Router();

// Example 1: Public route (no authentication required)
router.get('/public-info', (req, res) => {
  res.json({ message: 'This is a public endpoint' });
});

// Example 2: Protected route (authentication required)
router.get('/protected', authMiddleware, (req, res) => {
  res.json({ 
    message: 'You are authenticated!',
    user: {
      id: req.user?._id,
      email: req.user?.email,
      role: req.user?.role
    }
  });
});

// Example 3: Student-only route
router.get('/student-only', 
  authMiddleware,              // First check authentication
  requireRole('student'),      // Then check if user is a student
  (req, res) => {
    res.json({ 
      message: 'Hello student!',
      studentData: req.user?.studentProfile 
    });
  }
);

// Example 4: Teacher-only route
router.get('/teacher-only',
  authMiddleware,
  requireRole('teacher'),
  (req, res) => {
    res.json({ 
      message: 'Hello teacher!',
      teacherData: req.user?.teacherProfile 
    });
  }
);

// Example 5: Multiple roles allowed
router.get('/student-or-teacher',
  authMiddleware,
  requireRole(['student', 'teacher']), // Accept both roles
  (req, res) => {
    res.json({ 
      message: `Hello ${req.user?.role}!`,
      user: req.user
    });
  }
);

// Example 6: Profile completion required
router.get('/dashboard',
  authMiddleware,
  requireProfileComplete,      // User must have completed profile
  (req, res) => {
    res.json({ 
      message: 'Welcome to your dashboard!',
      user: req.user 
    });
  }
);

// Example 7: Optional authentication (works for both authenticated and non-authenticated users)
router.get('/courses',
  optionalAuthMiddleware,      // Authentication is optional
  (req, res) => {
    if (req.user) {
      // User is logged in - show personalized courses
      res.json({ 
        message: 'Your personalized courses',
        courses: [], // Would fetch user's enrolled courses
        user: req.user
      });
    } else {
      // User is not logged in - show public courses
      res.json({ 
        message: 'Public courses available',
        courses: [] // Would fetch public/free courses
      });
    }
  }
);

// Example 8: Complex route with multiple middleware
router.post('/teacher/create-course',
  authMiddleware,              // Must be authenticated
  requireRole('teacher'),      // Must be a teacher
  requireProfileComplete,      // Must have completed profile
  (req, res) => {
    // At this point, we know:
    // - User is authenticated
    // - User is a teacher
    // - User has completed their profile
    
    res.json({ 
      message: 'Course creation endpoint',
      teacher: req.user 
    });
  }
);

export default router;
