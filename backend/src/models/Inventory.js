import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  englishName: String,
  tamilName: String,
  nameTa: String,
  tagline: String,
  description: String,
  price: { type: Number },
  pricePerKg: { type: Number, default: 500 },
  unitPrice: { type: Number },
  unit: { type: String, default: 'kg' },
  itemNumber: Number,
  skuCode: { type: String, default: '' },
  stockKg: { type: Number, default: 0 },
  godownStock: { type: Number, default: 0 },
  counterStock: { type: Number, default: 0 },
  minThreshold: { type: Number, default: 8 },
  isInactive: { type: Boolean, default: false },
  isCustom: { type: Boolean, default: false },
  batchDate: String,
  batchNote: String,
  batchCode: String,
  image: { type: String, default: '/images/products/palkova_card.jpg' },
  category: { type: String, default: 'Ghee Sweets' },
  hsn: { type: String, default: '2106' },
  isUnlimitedStock: { type: Boolean, default: false },
}, { strict: true });

export const Inventory = mongoose.model('Inventory', inventorySchema);
export default Inventory;
