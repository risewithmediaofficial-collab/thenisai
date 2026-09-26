import mongoose from 'mongoose';

const preOrderItemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  englishName: String,
  tamilName: String,
  price: { type: Number, default: 0 },
  quantity: { type: Number, default: 1 },
  weight: String,
  unit: String,
  itemTotal: Number,
}, { _id: false });

const preOrderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  invoiceNumber: { type: String, required: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  items: { type: [preOrderItemSchema], default: [] },
  grandTotal: { type: Number, required: true },
  note: { type: String, default: '' },
  totalItems: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'accepted', 'billed', 'cancelled'], default: 'pending' },
  acceptedAt: Number,
  billedAt: Number,
  createdAt: { type: Number, default: Date.now },
}, { strict: true });

export const PreOrder = mongoose.model('PreOrder', preOrderSchema);
export default PreOrder;
