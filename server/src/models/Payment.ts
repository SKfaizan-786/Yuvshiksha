import mongoose, { Document, Schema, Types } from 'mongoose';

// Define Payment interface
export interface IPayment extends Document {
  user: Types.ObjectId; // Reference to user (student)
  booking?: Types.ObjectId; // Reference to booking
  course?: Types.ObjectId; // Reference to course
  teacher: Types.ObjectId; // Reference to teacher
  amount: number;
  currency: string;
  paymentMethod: 'card' | 'upi' | 'netbanking' | 'wallet' | 'razorpay' | 'stripe';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';
  transactionId?: string; // Payment gateway transaction ID
  gatewayOrderId?: string; // Gateway order ID (Razorpay, Stripe)
  gatewayPaymentId?: string; // Gateway payment ID
  gatewayResponse?: any; // Store gateway response
  description: string;
  metadata?: {
    sessionDuration?: number;
    subject?: string;
    scheduledDate?: Date;
  };
  refund?: {
    amount: number;
    reason: string;
    refundId: string;
    processedAt: Date;
  };
  // Additional refund tracking fields
  refundStatus?: 'none' | 'requested' | 'processing' | 'completed' | 'rejected';
  refundAmount?: number;
  refundReason?: string;
  refundRequestedAt?: Date;
  refundedAt?: Date;
  adminNotes?: string;
  processedBy?: Types.ObjectId;
  paidAt?: Date;
  platformFee: number; // Fee charged by platform
  teacherEarning: number; // Amount credited to teacher
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Payment Schema
const PaymentSchema = new Schema<IPayment>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  booking: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
    default: null
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    default: null
  },
  teacher: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR']
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'upi', 'netbanking', 'wallet', 'razorpay', 'stripe'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  transactionId: {
    type: String,
    default: null
  },
  gatewayOrderId: {
    type: String,
    default: null
  },
  gatewayPaymentId: {
    type: String,
    default: null
  },
  gatewayResponse: {
    type: Schema.Types.Mixed,
    default: null
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  metadata: {
    sessionDuration: Number,
    subject: String,
    scheduledDate: Date
  },
  refund: {
    amount: {
      type: Number,
      min: 0
    },
    reason: {
      type: String,
      maxlength: 500
    },
    refundId: String,
    processedAt: Date
  },
  platformFee: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  // Additional refund tracking fields
  refundStatus: {
    type: String,
    enum: ['none', 'requested', 'processing', 'completed', 'rejected'],
    default: 'none'
  },
  refundAmount: {
    type: Number,
    min: 0,
    default: 0
  },
  refundReason: {
    type: String,
    maxlength: 500
  },
  refundRequestedAt: {
    type: Date,
    default: null
  },
  refundedAt: {
    type: Date,
    default: null
  },
  adminNotes: {
    type: String,
    maxlength: 1000
  },
  processedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  paidAt: {
    type: Date,
    default: null
  },
  teacherEarning: {
    type: Number,
    required: true,
    min: 0
  },
  failureReason: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Indexes for better performance
PaymentSchema.index({ user: 1 });
PaymentSchema.index({ teacher: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ transactionId: 1 });
PaymentSchema.index({ gatewayOrderId: 1 });
PaymentSchema.index({ createdAt: -1 }); // For recent payments

// Calculate platform fee and teacher earning before saving
PaymentSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('amount')) {
    // Platform takes 10% commission
    this.platformFee = Math.round(this.amount * 0.10);
    this.teacherEarning = this.amount - this.platformFee;
  }
  next();
});

export default mongoose.model<IPayment>('Payment', PaymentSchema);
