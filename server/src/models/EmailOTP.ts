import mongoose, { Document, Schema } from 'mongoose';

export interface IEmailOTP extends Document {
  email: string;
  otp: string;
  expiresAt: Date;
  verified: boolean;
}

const EmailOTPSchema = new Schema<IEmailOTP>({
  email: { type: String, required: true, unique: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  verified: { type: Boolean, default: false },
});

const EmailOTPModel = mongoose.model<IEmailOTP>('EmailOTP', EmailOTPSchema);
export default EmailOTPModel;
