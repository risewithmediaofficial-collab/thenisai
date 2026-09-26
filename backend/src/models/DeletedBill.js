import mongoose from 'mongoose';

const deletedBySchema = new mongoose.Schema({
  id: String,
  name: String,
  username: String,
  role: String,
}, { _id: false });

const deletedBillSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  invoiceNumber: { type: String, required: true },
  billData: { type: mongoose.Schema.Types.Mixed, required: true },
  deletedBy: { type: deletedBySchema, required: true },
  deletionReason: { type: String, required: true },
  deletedAt: { type: Number, default: Date.now },
  expiresAt: { type: Number, default: () => Date.now() + 30 * 24 * 60 * 60 * 1000 },
}, { strict: true });

export const DeletedBill = mongoose.model('DeletedBill', deletedBillSchema);
export default DeletedBill;
