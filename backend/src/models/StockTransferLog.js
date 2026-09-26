import mongoose from 'mongoose';

const stockTransferLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  type: { type: String, enum: ['GODOWN_INWARD', 'DISPATCH_TO_COUNTER', 'COUNTER_RETURN', 'WASTAGE'], required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, default: 'kg' },
  godownRemaining: { type: Number, default: 0 },
  counterRemaining: { type: Number, default: 0 },
  performedBy: { type: String, default: 'Company Manager' },
  note: { type: String, default: '' },
  date: { type: String, default: () => new Date().toLocaleDateString('en-IN') },
  createdAt: { type: Number, default: () => Date.now() },
}, { strict: true });

export const StockTransferLog = mongoose.model('StockTransferLog', stockTransferLogSchema);
export default StockTransferLog;
