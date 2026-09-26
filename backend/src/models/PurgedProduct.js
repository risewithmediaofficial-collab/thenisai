import mongoose from 'mongoose';

const purgedProductSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  purgedAt: { type: Number, default: Date.now },
}, { strict: true });

export const PurgedProduct = mongoose.model('PurgedProduct', purgedProductSchema);
export default PurgedProduct;
