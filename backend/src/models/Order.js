import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
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

const orderCustomerSchema = new mongoose.Schema({
  fullName: { type: String, default: '' },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  verifiedViaOtp: { type: Boolean, default: false },
}, { _id: false });

const shippingAddressSchema = new mongoose.Schema({
  street: { type: String, default: '' },
  city: { type: String, default: '' },
  pincode: { type: String, default: '' },
  state: { type: String, default: '' },
  landmark: { type: String, default: '' },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  invoiceNumber: { type: String, required: true },
  orderDate: { type: String, required: true },
  orderTime: { type: String, required: true },
  customer: { type: orderCustomerSchema, required: true },
  shippingAddress: { type: shippingAddressSchema, default: () => ({}) },
  items: { type: [orderItemSchema], default: [] },
  subtotal: { type: Number, default: 0 },
  deliveryFee: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  paymentMethod: { type: String, default: 'cod' },
  upiUtr: { type: String, default: '' },
  giftNote: { type: String, default: '' },
  source: { type: String, default: 'online' },
  status: { type: String, default: 'New' },
  createdAt: { type: Number, default: Date.now },
}, { strict: true });

export const Order = mongoose.model('Order', orderSchema);
export default Order;
