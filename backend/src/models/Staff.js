import mongoose from 'mongoose';

const pushSubscriptionSchema = new mongoose.Schema({
  endpoint: { type: String, required: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
  },
  userAgent: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const staffSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  title: String,
  role: { type: String, enum: ['admin', 'cashier', 'company_manager', 'manager', 'tester'], required: true },
  counter: String,
  pushSubscriptions: { type: [pushSubscriptionSchema], default: [] },
}, { strict: true });

export const Staff = mongoose.model('Staff', staffSchema);
export default Staff;
