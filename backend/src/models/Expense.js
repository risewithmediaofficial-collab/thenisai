import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  amount: { type: Number, required: true, min: 0 },
  purpose: { type: String, required: true, trim: true },
  category: { type: String, default: 'General', trim: true },
  date: { type: String, required: true }, // 'DD Mon YYYY'
  cashier: {
    id: String,
    name: String,
    username: String,
    role: String,
    counter: String,
  },
  note: { type: String, default: '' },
  createdAt: { type: Number, default: Date.now },
}, { strict: true });

export const Expense = mongoose.model('Expense', expenseSchema);
export default Expense;
