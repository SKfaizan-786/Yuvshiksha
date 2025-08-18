import mongoose, { Document, Schema, Types } from 'mongoose';

// Define Course interface
export interface ICourse extends Document {
  title: string;
  description: string;
  instructor: Types.ObjectId; // Reference to teacher
  category: string;
  subjects: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in hours
  price: number;
  maxStudents: number;
  currentStudents: number;
  thumbnailUrl?: string;
  syllabus: {
    week: number;
    topics: string[];
    resources?: string[];
  }[];
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Course Schema
const CourseSchema = new Schema<ICourse>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  instructor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Mathematics', 'Science', 'Languages', 'Programming', 'Arts', 'Business', 'Other']
  },
  subjects: [{
    type: String,
    required: true
  }],
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  duration: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  maxStudents: {
    type: Number,
    default: 50,
    min: 1
  },
  currentStudents: {
    type: Number,
    default: 0,
    min: 0
  },
  thumbnailUrl: {
    type: String,
    default: null
  },
  syllabus: [{
    week: {
      type: Number,
      required: true
    },
    topics: [{
      type: String,
      required: true
    }],
    resources: [{
      type: String
    }]
  }],
  tags: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
CourseSchema.index({ instructor: 1 });
CourseSchema.index({ category: 1 });
CourseSchema.index({ tags: 1 });
CourseSchema.index({ isActive: 1 });
CourseSchema.index({ price: 1 });

export default mongoose.model<ICourse>('Course', CourseSchema);
