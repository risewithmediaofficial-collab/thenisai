import mongoose from 'mongoose';

const billItemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  englishName: String,
  tamilName: String,
  price: { type: Number, default: 0 },
  unitPrice: Number,
  quantity: { type: Number, default: 1 },
  weight: String,
  unit: String,
  skuCode: String,
  hsn: String,
  itemTotal: Number,
}, { _id: false });

const billCustomerSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
}, { _id: false });

const billCashierSchema = new mongoose.Schema({
  id: String,
  name: String,
  username: String,
  role: String,
  counter: String,
}, { _id: false });

const billEditEventSchema = new mongoose.Schema({
  id: String,
  editedAt: Number,
  dateStr: String,
  timeStr: String,
  editedBy: billCashierSchema,
  reason: String,
  originalGrandTotal: Number,
  newGrandTotal: Number,
  difference: Number,
  previousItemCount: Number,
  newItemCount: Number,
}, { _id: false });

const billSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  invoiceNumber: { type: String, required: true },
  orderDate: { type: String, required: true },
  orderTime: { type: String, required: true },
  items: { type: [billItemSchema], default: [] },
  customer: { type: billCustomerSchema, default: () => ({}) },
  subtotal: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  roundOff: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  paymentMethod: { type: String, default: 'cash' },
  splitCash: { type: Number, default: 0 },
  splitUpi: { type: Number, default: 0 },
  upiUtr: { type: String, default: '' },
  cashier: { type: billCashierSchema, default: () => ({}) },
  source: { type: String, default: 'counter' },
  status: { type: String, default: 'Completed' },
  isEdited: { type: Boolean, default: false },
  editHistory: { type: [billEditEventSchema], default: [] },
  syncedAt: Number,
  isOfflineBackup: { type: Boolean, default: false },
  createdAt: { type: Number, default: Date.now },
}, { strict: true });

export const Bill = mongoose.model('Bill', billSchema);
export default Bill;
