import mongoose from 'mongoose';

const deletedBySchema = new mongoose.Schema({
  id: String,
  name: String,
  username: String,
  role: String,
}, { _id: false });

const deletedProductSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  englishName: String,
  tamilName: String,
  productData: { type: mongoose.Schema.Types.Mixed, required: true },
  deletedBy: { type: deletedBySchema, required: true },
  deletionReason: { type: String, default: 'Product removed from catalog' },
  deletedAt: { type: Number, default: Date.now },
  expiresAt: { type: Number, default: () => Date.now() + 30 * 24 * 60 * 60 * 1000 },
}, { strict: true });

export const DeletedProduct = mongoose.model('DeletedProduct', deletedProductSchema);
export default DeletedProduct;
