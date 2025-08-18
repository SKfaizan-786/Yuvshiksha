import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../utils/authHelpers';
import Course from '../models/Course';
import { Booking } from '../models/Booking';
import { getUserFromRequest } from '../utils/authHelpers';

// Create a new course (Teachers only)
export const createCourse = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    
    if (!user || user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can create courses' });
    }

    const courseData = {
      ...req.body,
      instructor: user._id
    };

    const course = new Course(courseData);
    await course.save();

    res.status(201).json({
      message: 'Course created successfully',
      course
    });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ message: 'Failed to create course' });
  }
};

// Get all courses with filtering and pagination
export const getCourses = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      subject,
      level,
      priceMin,
      priceMax,
      search,
      instructor
    } = req.query;

    const query: any = { isActive: true };

    // Apply filters
    if (subject) query.subject = subject;
    if (level) query.level = level;
    if (instructor) query.instructor = instructor;
    
    if (priceMin || priceMax) {
      query.pricing = {};
      if (priceMin) query.pricing.$gte = Number(priceMin);
      if (priceMax) query.pricing.$lte = Number(priceMax);
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const courses = await Course.find(query)
      .populate('instructor', 'firstName lastName profilePicture teacherProfile.specializations')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Course.countDocuments(query);

    res.json({
      courses,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalCourses: total,
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ message: 'Failed to fetch courses' });
  }
};

// Get a single course by ID
export const getCourseById = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId)
      .populate('instructor', 'firstName lastName profilePicture teacherProfile');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json(course);
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ message: 'Failed to fetch course' });
  }
};

// Update a course (Instructor only)
export const updateCourse = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    const { courseId } = req.params;

    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user is the instructor or admin
    if (course.instructor.toString() !== user._id.toString() && user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this course' });
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      req.body,
      { new: true, runValidators: true }
    ).populate('instructor', 'firstName lastName profilePicture');

    res.json({
      message: 'Course updated successfully',
      course: updatedCourse
    });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ message: 'Failed to update course' });
  }
};

// Delete a course (Instructor only)
export const deleteCourse = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    const { courseId } = req.params;

    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user is the instructor or admin
    if (course.instructor.toString() !== user._id.toString() && user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this course' });
    }

    // Soft delete by setting isActive to false
    await Course.findByIdAndUpdate(courseId, { isActive: false });

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ message: 'Failed to delete course' });
  }
};

// Get courses by instructor
export const getCoursesByInstructor = async (req: Request, res: Response) => {
  try {
    const { instructorId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const courses = await Course.find({ 
      instructor: instructorId, 
      isActive: true 
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Course.countDocuments({ 
      instructor: instructorId, 
      isActive: true 
    });

    res.json({
      courses,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalCourses: total
      }
    });
  } catch (error) {
    console.error('Error fetching instructor courses:', error);
    res.status(500).json({ message: 'Failed to fetch instructor courses' });
  }
};
