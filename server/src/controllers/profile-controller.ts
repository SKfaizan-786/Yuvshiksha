// -------------------- Favourites (Student/Teacher) --------------------
import { Request, Response } from 'express';
import User, { ITeacherProfile, IStudentProfile } from '../models/User';
import { uploadToCloudinary } from '../utils/cloudinary';

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
/**
 * Helper function to safely parse a JSON string or return an empty array if invalid.
 * This is crucial for handling the way FormData sends arrays.
 * @param data The JSON string or array from req.body
 * @returns A parsed array or an empty array.
 */
const safelyParseJsonArray = (data: any): any[] => {
  if (data && typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return Array.isArray(data) ? data : [];
};

export const updateTeacherProfile = async (req: Request, res: Response) => {
  try {
    console.log('Received data:', req.body);
    if (!req.user?._id) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    let photoUrl = req.body.photoUrl;
    if (req.file && req.file.buffer) {
      const result = await uploadToCloudinary(req.file.buffer, 'profile-images');
      photoUrl = result.url;
    }

    // FIX: Use the new helper function to safely parse all array fields
    const subjectsTaught = safelyParseJsonArray(req.body.subjectsTaught);
    const boardsTaught = safelyParseJsonArray(req.body.boardsTaught);
    const classesTaught = safelyParseJsonArray(req.body.classesTaught);
    const achievements = safelyParseJsonArray(req.body.achievements);
    const availability = safelyParseJsonArray(req.body.availability);
    const teachingMode = safelyParseJsonArray(req.body.teachingMode);

    const teacherProfileUpdate: Partial<ITeacherProfile> = {
      phone: req.body.phone,
      location: req.body.location,
      pinCode: req.body.pinCode,
      medium: req.body.medium,
      qualifications: req.body.qualifications,
      experienceYears: req.body.experienceYears,
      currentOccupation: req.body.currentOccupation,
      subjects: subjectsTaught,
      boards: boardsTaught,
      classes: classesTaught,
      teachingMode: Array.isArray(teachingMode) ? teachingMode : [],
      bio: req.body.bio,
      teachingApproach: req.body.teachingApproach,
      achievements: achievements,
      hourlyRate: req.body.hourlyRate,
      availability: availability
    };

    if (Object.prototype.hasOwnProperty.call(req.body, 'isListed')) {
      teacherProfileUpdate.isListed = req.body.isListed;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'listedAt')) {
      teacherProfileUpdate.listedAt = req.body.listedAt;
    }
    if (photoUrl !== undefined) {
      teacherProfileUpdate.photoUrl = photoUrl;
    }

    const updateFields: any = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      profileComplete: true,
    };
    
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
    if (!req.user?._id) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    let photoUrl: string | undefined;

    if (req.file && req.file.buffer) {
      const result = await uploadToCloudinary(req.file.buffer, 'profile-images');
      photoUrl = result.url;
    } else if (req.body.photoUrl) {
      photoUrl = req.body.photoUrl;
    } else {
      const userInDb = await User.findById(req.user._id).select('studentProfile.photoUrl');
      photoUrl = userInDb?.studentProfile?.photoUrl;
    }
    
    // FIX: Remove .map(s => s.text) as frontend is now sending a clean array of strings
    const subjects = safelyParseJsonArray(req.body.subjects);
    const learningGoals = safelyParseJsonArray(req.body.learningGoals);
    const mode = safelyParseJsonArray(req.body.mode);
    
    const updateData = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      profileComplete: true,
      studentProfile: {
        phone: req.body.phone,
        location: req.body.location,
        pinCode: req.body.pinCode || '',
        medium: req.body.medium || '',
        grade: req.body.subject || req.body.grade || '',
        subjects: subjects,
        learningGoals: learningGoals,
        mode: mode,
        board: req.body.board || '',
        bio: req.body.bio || '',
        photoUrl,
      }
    };

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
      _id: user._id,
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
    const allTeachers = await User.find({ role: 'teacher' });
    const listedTeachers = await User.find({
      role: 'teacher',
      'teacherProfile.isListed': true
    }).select('firstName lastName email teacherProfile');
    
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