import mongoose from 'mongoose';

const priceOverrideLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  invoiceNumber: { type: String, default: 'COUNTER-DRAFT' },
  cashier: {
    id: String,
    name: String,
    role: String,
    username: String,
    counter: String,
  },
  productId: String,
  productName: String,
  weightOrUnit: String,
  originalRate: Number,
  customRate: Number,
  difference: Number,
  quantity: { type: Number, default: 1 },
  reason: { type: String, default: 'Customer Request / Special Rate' },
  timestamp: { type: Number, default: Date.now },
  dateStr: String,
  timeStr: String,
}, { strict: true });

export const PriceOverrideLog = mongoose.model('PriceOverrideLog', priceOverrideLogSchema);
export default PriceOverrideLog;
