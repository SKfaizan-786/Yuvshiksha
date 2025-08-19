import mongoose, { Document, Schema, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

// Define interfaces for nested objects
export interface ITeachingSubject {
  id: number;
  text: string;
}

export interface ITeachingBoard {
  id: number;
  text: string;
}

export interface ITeachingClass {
  id: number;
  text: string;
}

export interface ITeachingAchievement {
  id: number;
  text: string;
}

export interface IAvailability {
  day: string;
  startTime: string;
  endTime: string;
  slots?: string[];
}

export interface IStudentProfile {
  phone?: string;
  location?: string;
  grade?: string;
  subjects?: string[];
  learningGoals?: string[];
  bio?: string;
  photoUrl?: string;
}

export interface ITeacherProfile {
  phone?: string;
  location?: string;
  qualifications?: string;
  experienceYears?: number;
  currentOccupation?: string;
  subjects?: ITeachingSubject[];
  boards?: ITeachingBoard[];
  classes?: ITeachingClass[];
  teachingMode?: string;
  preferredSchedule?: string;
  bio?: string;
  teachingApproach?: string;
  achievements?: ITeachingAchievement[];
  hourlyRate?: number;
  photoUrl?: string;
  availability?: IAvailability[];
  isListed?: boolean; // Add this field
  listedAt?: Date; // Optional: track when teacher got listed
  maritalStatus?: 'married' | 'unmarried';
}

export interface IUser extends Document {
  _id: string;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  googleId?: string;
  role: 'student' | 'teacher' | 'admin';
  profileComplete: boolean;
  studentProfile?: IStudentProfile;
  teacherProfile?: ITeacherProfile;
  favourites?: string[]; // Array of teacher IDs
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  matchPassword(enteredPassword: string): Promise<boolean>;
}

const TeachingSubjectSchema = new Schema({
  id: Number,
  text: String
});

const TeachingBoardSchema = new Schema({
  id: Number,
  text: String
});

const TeachingClassSchema = new Schema({
  id: Number,
  text: String
});

const TeachingAchievementSchema = new Schema({
  id: Number,
  text: String
});

const AvailabilitySchema = new Schema({
  day: String,
  startTime: String,
  endTime: String
});

const TeacherProfileSchema = new Schema({
  phone: String,
  location: String,
  qualifications: String,
  experienceYears: Number,
  currentOccupation: String,
  subjects: [TeachingSubjectSchema],
  boards: [TeachingBoardSchema],
  classes: [TeachingClassSchema],
  teachingMode: String,
  preferredSchedule: String,
  bio: String,
  teachingApproach: String,
  achievements: [TeachingAchievementSchema],
  hourlyRate: Number,
  photoUrl: String,
  availability: [AvailabilitySchema],
  isListed: { 
    type: Boolean, 
    default: false // Default to false (not listed)
  },
  listedAt: { 
    type: Date 
  },
  maritalStatus: {
    type: String,
    enum: ['married', 'unmarried'],
    required: true
  }
}, { timestamps: true });

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    avatar: {
      type: String,
      trim: true,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    role: {
      type: String,
      enum: ['student', 'teacher', 'admin'],
      default: 'student',
    },
    profileComplete: {
      type: Boolean,
      default: false,
    },
    studentProfile: {
      phone: String,
      location: String,
      grade: String,
      subjects: [String],
      learningGoals: [String],
      bio: String,
      photoUrl: String,
      mode: String,
      board: String,
    },
    teacherProfile: TeacherProfileSchema,
    favourites: [{ type: String }], // Array of teacher IDs
  },
  {
    timestamps: true,
  }
);

// Hash password before saving (only if modified and present)
// Hash password before saving (only if modified and present)
UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed password
UserSchema.methods.matchPassword = async function (enteredPassword: string): Promise<boolean> {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

// âœ… Export UserDocument type for type-safe request.user
export type UserDocument = IUser & Document;

// âœ… Export the model correctly
const UserModel = mongoose.model<UserDocument>('User', UserSchema);
export default UserModel;