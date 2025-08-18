import mongoose, { Document, Schema, Types } from 'mongoose';

// Define Review interface
export interface IReview extends Document {
  reviewer: Types.ObjectId; // Student who is giving the review
  reviewee: Types.ObjectId; // Teacher being reviewed
  booking: Types.ObjectId; // Reference to the completed booking
  rating: number; // 1-5 star rating
  comment?: string;
  tags?: string[]; // e.g., ['punctual', 'knowledgeable', 'friendly']
  isAnonymous: boolean;
  isApproved: boolean; // For moderation
  moderatedBy?: Types.ObjectId; // Admin who approved/rejected
  moderatedAt?: Date;
  helpfulVotes: number; // Count of helpful votes from other users
  reportCount: number; // Count of reports for inappropriate content
  response?: {
    content: string;
    respondedAt: Date;
  }; // Teacher's response to the review
  createdAt: Date;
  updatedAt: Date;
}

// Review Schema
const ReviewSchema = new Schema<IReview>({
  reviewer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewee: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  booking: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true // One review per booking
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    validate: {
      validator: function(v: number) {
        return v >= 1 && v <= 5 && Number.isInteger(v);
      },
      message: 'Rating must be an integer between 1 and 5'
    }
  },
  comment: {
    type: String,
    maxlength: 1000,
    trim: true
  },
  tags: [{
    type: String,
    enum: [
      'punctual', 'knowledgeable', 'friendly', 'patient', 'clear_explanation',
      'well_prepared', 'helpful', 'professional', 'engaging', 'responsive',
      'experienced', 'motivating', 'organized', 'flexible', 'supportive'
    ]
  }],
  isAnonymous: {
    type: Boolean,
    default: false
  },
  isApproved: {
    type: Boolean,
    default: true // Auto-approve by default, can be moderated later
  },
  moderatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  moderatedAt: {
    type: Date,
    default: null
  },
  helpfulVotes: {
    type: Number,
    default: 0,
    min: 0
  },
  reportCount: {
    type: Number,
    default: 0,
    min: 0
  },
  response: {
    content: {
      type: String,
      maxlength: 500,
      trim: true
    },
    respondedAt: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Indexes for better performance
ReviewSchema.index({ reviewee: 1, isApproved: 1 });
ReviewSchema.index({ reviewer: 1 });
ReviewSchema.index({ booking: 1 });
ReviewSchema.index({ rating: 1 });
ReviewSchema.index({ createdAt: -1 });

// Virtual for average rating calculation
ReviewSchema.virtual('isHighRated').get(function() {
  return this.rating >= 4;
});

export default mongoose.model<IReview>('Review', ReviewSchema);

// Define Analytics interface for platform insights
export interface IAnalytics extends Document {
  userId: Types.ObjectId; // User this analytics record belongs to
  userType: 'student' | 'teacher';
  
  // Booking analytics
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  noShowBookings: number;
  
  // Financial analytics (for teachers)
  totalEarnings?: number;
  platformFees?: number;
  netEarnings?: number;
  averageBookingValue?: number;
  
  // Rating analytics
  averageRating?: number;
  totalReviews?: number;
  ratingDistribution?: {
    oneStar: number;
    twoStar: number;
    threeStar: number;
    fourStar: number;
    fiveStar: number;
  };
  
  // Activity analytics
  profileViews?: number;
  searchAppearances?: number;
  responseRate?: number; // For teachers
  responseTime?: number; // Average response time in minutes
  
  // Time-based metrics
  peakHours?: number[]; // Hours of the day when most active (0-23)
  activeMonths?: number[]; // Months when most active (1-12)
  
  // Calculated fields
  completionRate: number; // Percentage of completed bookings
  popularityScore?: number; // Overall score based on various factors
  
  lastCalculated: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Analytics Schema
const AnalyticsSchema = new Schema<IAnalytics>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  userType: {
    type: String,
    enum: ['student', 'teacher'],
    required: true
  },
  totalBookings: {
    type: Number,
    default: 0,
    min: 0
  },
  completedBookings: {
    type: Number,
    default: 0,
    min: 0
  },
  cancelledBookings: {
    type: Number,
    default: 0,
    min: 0
  },
  noShowBookings: {
    type: Number,
    default: 0,
    min: 0
  },
  totalEarnings: {
    type: Number,
    default: 0,
    min: 0
  },
  platformFees: {
    type: Number,
    default: 0,
    min: 0
  },
  netEarnings: {
    type: Number,
    default: 0,
    min: 0
  },
  averageBookingValue: {
    type: Number,
    default: 0,
    min: 0
  },
  averageRating: {
    type: Number,
    min: 1,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0,
    min: 0
  },
  ratingDistribution: {
    oneStar: { type: Number, default: 0, min: 0 },
    twoStar: { type: Number, default: 0, min: 0 },
    threeStar: { type: Number, default: 0, min: 0 },
    fourStar: { type: Number, default: 0, min: 0 },
    fiveStar: { type: Number, default: 0, min: 0 }
  },
  profileViews: {
    type: Number,
    default: 0,
    min: 0
  },
  searchAppearances: {
    type: Number,
    default: 0,
    min: 0
  },
  responseRate: {
    type: Number,
    min: 0,
    max: 100 // Percentage
  },
  responseTime: {
    type: Number,
    min: 0 // Minutes
  },
  peakHours: [{
    type: Number,
    min: 0,
    max: 23
  }],
  activeMonths: [{
    type: Number,
    min: 1,
    max: 12
  }],
  completionRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100 // Percentage
  },
  popularityScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  lastCalculated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better performance
AnalyticsSchema.index({ userId: 1 });
AnalyticsSchema.index({ userType: 1 });
AnalyticsSchema.index({ averageRating: -1 });
AnalyticsSchema.index({ popularityScore: -1 });

// Pre-save middleware to calculate completion rate
AnalyticsSchema.pre('save', function(next) {
  if (this.totalBookings > 0) {
    this.completionRate = (this.completedBookings / this.totalBookings) * 100;
  } else {
    this.completionRate = 0;
  }
  
  // Calculate popularity score based on multiple factors
  if (this.userType === 'teacher') {
    let score = 0;
    
    // Rating contribution (40%)
    if (this.averageRating) {
      score += (this.averageRating / 5) * 40;
    }
    
    // Completion rate contribution (30%)
    score += (this.completionRate / 100) * 30;
    
    // Review count contribution (20%)
    if (this.totalReviews) {
      score += Math.min((this.totalReviews / 50) * 20, 20); // Max 20 points for 50+ reviews
    }
    
    // Profile views contribution (10%)
    if (this.profileViews) {
      score += Math.min((this.profileViews / 1000) * 10, 10); // Max 10 points for 1000+ views
    }
    
    this.popularityScore = Math.round(score);
  }
  
  this.lastCalculated = new Date();
  next();
});

export const Analytics = mongoose.model<IAnalytics>('Analytics', AnalyticsSchema);
