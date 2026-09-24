import { configureStore } from '@reduxjs/toolkit';
import posReducer from './slices/posSlice';
import inventoryReducer from './slices/inventorySlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    pos: posReducer,
    inventory: inventoryReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false, // Disables runtime checks for maximum production & dev speed
    }),
});

export default store;
