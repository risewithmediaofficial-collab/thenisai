import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  searchQuery: '',
  activeCategory: 'all',
  customerPhone: '',
  customerName: '',
  paymentMethod: 'CASH',
  receivedCash: '',
  discountPercent: 0,
  scannerActive: true,
  lastScannedSku: '',
  activeWeightPreset: '500g',
};

const posSlice = createSlice({
  name: 'pos',
  initialState,
  reducers: {
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setActiveCategory: (state, action) => {
      state.activeCategory = action.payload;
    },
    setCustomerPhone: (state, action) => {
      state.customerPhone = action.payload;
    },
    setCustomerName: (state, action) => {
      state.customerName = action.payload;
    },
    setPaymentMethod: (state, action) => {
      state.paymentMethod = action.payload;
    },
    setReceivedCash: (state, action) => {
      state.receivedCash = action.payload;
    },
    setDiscountPercent: (state, action) => {
      state.discountPercent = Math.max(0, Math.min(100, Number(action.payload) || 0));
    },
    setScannerActive: (state, action) => {
      state.scannerActive = Boolean(action.payload);
    },
    setLastScannedSku: (state, action) => {
      state.lastScannedSku = action.payload;
    },
    setActiveWeightPreset: (state, action) => {
      state.activeWeightPreset = action.payload;
    },
    resetPosState: (state) => {
      state.searchQuery = '';
      state.customerPhone = '';
      state.customerName = '';
      state.paymentMethod = 'CASH';
      state.receivedCash = '';
      state.discountPercent = 0;
      state.lastScannedSku = '';
    },
  },
});

export const {
  setSearchQuery,
  setActiveCategory,
  setCustomerPhone,
  setCustomerName,
  setPaymentMethod,
  setReceivedCash,
  setDiscountPercent,
  setScannerActive,
  setLastScannedSku,
  setActiveWeightPreset,
  resetPosState,
} = posSlice.actions;

export default posSlice.reducer;
