import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  password: { type: String }, // Mobile number itself is the password
  name: { type: String, default: 'Valued Customer' },
  email: String,
  wishlist: [{ type: String }],
  token: String,
  createdAt: { type: Number, default: Date.now },
  lastLogin: { type: Number, default: Date.now },
}, { strict: true });

export const Customer = mongoose.model('Customer', customerSchema);
export default Customer;
