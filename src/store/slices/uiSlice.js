import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isAddStockOpen: false,
  isDispatchOpen: false,
  isReturnOpen: false,
  selectedItemIdForModal: null,
  toastMessage: null,
  toastType: 'info', // 'success' | 'error' | 'warning' | 'info'
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openAddStockModal: (state, action) => {
      state.isAddStockOpen = true;
      state.selectedItemIdForModal = action.payload || null;
    },
    closeAddStockModal: (state) => {
      state.isAddStockOpen = false;
      state.selectedItemIdForModal = null;
    },
    openDispatchModal: (state, action) => {
      state.isDispatchOpen = true;
      state.selectedItemIdForModal = action.payload || null;
    },
    closeDispatchModal: (state) => {
      state.isDispatchOpen = false;
      state.selectedItemIdForModal = null;
    },
    openReturnModal: (state, action) => {
      state.isReturnOpen = true;
      state.selectedItemIdForModal = action.payload || null;
    },
    closeReturnModal: (state) => {
      state.isReturnOpen = false;
      state.selectedItemIdForModal = null;
    },
    showToast: (state, action) => {
      state.toastMessage = action.payload.message;
      state.toastType = action.payload.type || 'info';
    },
    hideToast: (state) => {
      state.toastMessage = null;
    },
  },
});

export const {
  openAddStockModal,
  closeAddStockModal,
  openDispatchModal,
  closeDispatchModal,
  openReturnModal,
  closeReturnModal,
  showToast,
  hideToast,
} = uiSlice.actions;

export default uiSlice.reducer;
