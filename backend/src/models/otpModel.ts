import mongoose, { Schema, Document } from 'mongoose';

export interface IOTP extends Document {
  email: string;
  otp: string;
  createdAt: Date;
}

const otpSchema = new Schema<IOTP>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      index: true,
    },
    otp: {
      type: String,
      required: [true, 'OTP is required'],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);


otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 });

export const OTP = mongoose.model<IOTP>('OTP', otpSchema);