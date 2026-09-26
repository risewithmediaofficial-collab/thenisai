import mongoose from 'mongoose';

const staffSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  title: String,
  role: { type: String, enum: ['admin', 'cashier', 'company_manager', 'manager', 'tester'], required: true },
  counter: String,
}, { strict: true });

export const Staff = mongoose.model('Staff', staffSchema);
export default Staff;
