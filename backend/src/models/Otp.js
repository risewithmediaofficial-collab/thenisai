import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  otp: String,
  expiresAt: Number,
  verified: { type: Boolean, default: false },
  token: String,
  attempts: { type: Number, default: 0 },
  createdAt: { type: Number, default: Date.now },
}, { strict: true });

export const Otp = mongoose.model('Otp', otpSchema);
export default Otp;
