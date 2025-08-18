// -------------------- Favourites (Student/Teacher) --------------------

import { Request, Response } from 'express';
import User, { IUser, ITeacherProfile } from '../models/User';

// Utility to extract error message
const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Internal server error';

// Get all favourite teachers for the logged-in user
export const getFavourites = async (req: Request, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    const user = await User.findById(req.user._id).select('favourites');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ favourites: user.favourites || [] });
  } catch (error) {
    res.status(500).json({ message: getErrorMessage(error) });
  }
};

// Add a teacher to favourites
export const addFavourite = async (req: Request, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    const { teacherId } = req.body;
    if (!teacherId) {
      return res.status(400).json({ message: 'teacherId is required' });
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { favourites: teacherId } },
      { new: true }
    ).select('favourites');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ favourites: user.favourites });
  } catch (error) {
    res.status(500).json({ message: getErrorMessage(error) });
  }
};

// Remove a teacher from favourites
export const removeFavourite = async (req: Request, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    const { teacherId } = req.body;
    if (!teacherId) {
      return res.status(400).json({ message: 'teacherId is required' });
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { favourites: teacherId } },
      { new: true }
    ).select('favourites');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ favourites: user.favourites });
  } catch (error) {
    res.status(500).json({ message: getErrorMessage(error) });
  }
};

// -------------------- Teacher Profile --------------------
export const updateTeacherProfile = async (req: Request, res: Response) => {
  try {
    console.log('Received data:', req.body);
    if (!req.user?._id) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    // Build teacherProfile update object
    const teacherProfileUpdate: Partial<ITeacherProfile> = {
      phone: req.body.phone,
      location: req.body.location,
      qualifications: req.body.qualifications,
      experienceYears: req.body.experienceYears,
      currentOccupation: req.body.currentOccupation,
      subjects: req.body.subjectsTaught || req.body.subjects,
      boards: req.body.boardsTaught || req.body.boards,
      classes: req.body.classesTaught || req.body.classes,
      teachingMode: req.body.teachingMode,
      preferredSchedule: req.body.preferredSchedule,
      bio: req.body.bio,
      teachingApproach: req.body.teachingApproach,
      achievements: req.body.achievements,
      hourlyRate: req.body.hourlyRate,
      photoUrl: req.body.photoUrl,
      availability: req.body.availability
    };

    if (Object.prototype.hasOwnProperty.call(req.body, 'isListed')) {
      teacherProfileUpdate.isListed = req.body.isListed;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'listedAt')) {
      teacherProfileUpdate.listedAt = req.body.listedAt;
    }

    // Prepare the update object to use $set for specific fields
    const updateFields: any = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      profileComplete: true,
    };
    
    // Add teacherProfile fields to the update using dot notation
    for (const key in teacherProfileUpdate) {
      const typedKey = key as keyof ITeacherProfile;
      if (teacherProfileUpdate[typedKey] !== undefined) {
        updateFields[`teacherProfile.${key}`] = teacherProfileUpdate[typedKey];
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      user: {
        _id: updatedUser._id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        profileComplete: updatedUser.profileComplete,
        teacherProfile: updatedUser.teacherProfile
      }
    });

  } catch (error: unknown) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: getErrorMessage(error)
    });
  }
};

export const getTeacherProfile = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user?._id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'teacher') {
      return res.status(403).json({ message: 'Access denied. Teacher profile required.' });
    }

    res.status(200).json({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      profileComplete: user.profileComplete,
      teacherProfile: user.teacherProfile
    });

  } catch (error: unknown) {
    console.error('Teacher profile fetch error:', error);
    res.status(500).json({ message: 'Server error fetching teacher profile', error: getErrorMessage(error) });
  }
};

// -------------------- Student Profile --------------------
export const updateStudentProfile = async (req: Request, res: Response) => {
  try {
    console.log('=== REQUEST BODY ===', req.body);
    
    if (!req.user?._id) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    // Build update data with all possible fields from the form
    // Ensure learningGoals is always an array of strings
    let learningGoals = [];
    if (Array.isArray(req.body.learningGoals)) {
      learningGoals = req.body.learningGoals.filter((g: string) => typeof g === 'string' && g.trim() !== '');
    } else if (typeof req.body.learningGoals === 'string' && req.body.learningGoals.trim() !== '') {
      learningGoals = [req.body.learningGoals.trim()];
    } else if (Array.isArray(req.body.goals)) {
      learningGoals = req.body.goals.filter((g: string) => typeof g === 'string' && g.trim() !== '');
    }

    const updateData = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      profileComplete: true,
      studentProfile: {
        phone: req.body.phone,
        location: req.body.location,
        grade: req.body.subject || req.body.grade || '',
        subjects: req.body.subjects && Array.isArray(req.body.subjects) && req.body.subjects.length > 0
          ? req.body.subjects
          : (req.body.learningInterest ? [req.body.learningInterest] : []),
        learningGoals,
        mode: req.body.mode || '',
        board: req.body.board || '',
        bio: req.body.bio || '',
        photoUrl: req.body.photoUrl || '',
      }
    };

    console.log('=== UPDATE DATA ===', updateData);

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { 
        new: true,
        runValidators: true
      }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    console.log('=== UPDATED USER ===', updatedUser);
    
    return res.status(200).json({
      success: true,
      user: updatedUser
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(500).json({
      success: false,
      message: getErrorMessage(error)
    });
  }
};

export const getStudentProfile = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user?._id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'student') {
      return res.status(403).json({ message: 'Access denied. Student profile required.' });
    }

    res.status(200).json({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      profileComplete: user.profileComplete,
      studentProfile: user.studentProfile,
      photoUrl: user.studentProfile?.photoUrl || user.avatar
    });

  } catch (error: unknown) {
    console.error('Student profile fetch error:', error);
    res.status(500).json({ message: 'Server error fetching student profile', error: getErrorMessage(error) });
  }
};


// -------------------- Listing/Unlisting --------------------
export const updateTeacherListingStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { isListed } = req.body;

    if (typeof isListed !== 'boolean') {
      return res.status(400).json({ message: 'Invalid listing status provided.' });
    }

    const updateFields = {
      'teacherProfile.isListed': isListed,
    };

    if (isListed) {
      Object.assign(updateFields, { 'teacherProfile.listedAt': new Date() });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: `Teacher profile successfully ${isListed ? 'listed' : 'unlisted'}.`,
      isListed: updatedUser.teacherProfile?.isListed,
      listedAt: updatedUser.teacherProfile?.listedAt
    });
    
  } catch (error) {
    console.error('Error updating listing status:', error);
    res.status(500).json({ message: 'Failed to update listing status' });
  }
};

export const getListedTeachers = async (req: Request, res: Response) => {
  try {
    console.log('🔍 Getting listed teachers...');
    
    const allTeachers = await User.find({ role: 'teacher' });
    console.log(`📊 Total teachers found: ${allTeachers.length}`);
    
    allTeachers.forEach(teacher => {
      console.log(`👨‍🏫 Teacher: ${teacher.firstName} ${teacher.lastName}`);
      console.log(`📧 Email: ${teacher.email}`);
      console.log(`✅ Has teacher profile: ${!!teacher.teacherProfile}`);
      console.log(`📝 isListed: ${teacher.teacherProfile?.isListed}`);
      console.log(`📅 listedAt: ${teacher.teacherProfile?.listedAt}`);
      console.log('---');
    });
    
    const listedTeachers = await User.find({
      role: 'teacher',
      'teacherProfile.isListed': true
    }).select('firstName lastName email teacherProfile');
    
    console.log(`🎯 Listed teachers found: ${listedTeachers.length}`);
    
    res.json({
      totalTeachers: allTeachers.length,
      listedTeachers: listedTeachers.length,
      teachers: listedTeachers
    });
    
  } catch (error) {
    console.error('Error fetching listed teachers:', error);
    res.status(500).json({ message: 'Failed to get listed teachers' });
  }
};