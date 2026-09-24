import { createSlice, createSelector } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  stockLogs: [],
  searchFilter: '',
  selectedCategory: 'all',
  statusFilter: 'all',
  isLoading: false,
};

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    setInventoryItems: (state, action) => {
      state.items = action.payload;
    },
    updateSingleItemStock: (state, action) => {
      const { id, godownStock, counterStock, stockKg } = action.payload;
      const index = state.items.findIndex((item) => item.id === id);
      if (index !== -1) {
        if (godownStock !== undefined) state.items[index].godownStock = godownStock;
        if (counterStock !== undefined) state.items[index].counterStock = counterStock;
        if (stockKg !== undefined) state.items[index].stockKg = stockKg;
      }
    },
    inwardStockLocal: (state, action) => {
      const { productId, quantity } = action.payload;
      const item = state.items.find((i) => i.id === productId);
      if (item) {
        const qty = parseFloat(quantity) || 0;
        const current = item.counterStock ?? item.stockKg ?? 0;
        const next = Math.round((current + qty) * 100) / 100;
        item.counterStock = next;
        item.stockKg = next;
      }
    },
    returnToGodownLocal: (state, action) => {
      const { productId, quantity } = action.payload;
      const item = state.items.find((i) => i.id === productId);
      if (item) {
        const qty = parseFloat(quantity) || 0;
        const current = item.counterStock ?? item.stockKg ?? 0;
        const next = Math.max(0, Math.round((current - qty) * 100) / 100);
        item.counterStock = next;
        item.stockKg = next;
      }
    },
    setStockLogs: (state, action) => {
      state.stockLogs = action.payload;
    },
    addStockLog: (state, action) => {
      state.stockLogs.unshift(action.payload);
      if (state.stockLogs.length > 100) state.stockLogs.pop();
    },
    setSearchFilter: (state, action) => {
      state.searchFilter = action.payload;
    },
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
    },
    setStatusFilter: (state, action) => {
      state.statusFilter = action.payload;
    },
  },
});

export const {
  setInventoryItems,
  updateSingleItemStock,
  inwardStockLocal,
  returnToGodownLocal,
  setStockLogs,
  addStockLog,
  setSearchFilter,
  setSelectedCategory,
  setStatusFilter,
} = inventorySlice.actions;

// Memoized Selectors for O(1) Lookups & Filtered Computations
export const selectAllInventory = (state) => state.inventory.items;
export const selectStockLogs = (state) => state.inventory.stockLogs;
export const selectInventoryFilters = (state) => ({
  search: state.inventory.searchFilter,
  category: state.inventory.selectedCategory,
  status: state.inventory.statusFilter,
});

export const selectFilteredInventory = createSelector(
  [selectAllInventory, selectInventoryFilters],
  (items, { search, category, status }) => {
    const q = search.toLowerCase().trim();
    return items.filter((item) => {
      if (q) {
        const nameMatch =
          (item.name && item.name.toLowerCase().includes(q)) ||
          (item.englishName && item.englishName.toLowerCase().includes(q)) ||
          (item.tamilName && item.tamilName.toLowerCase().includes(q)) ||
          (item.skuCode && String(item.skuCode).toLowerCase().includes(q));
        if (!nameMatch) return false;
      }

      if (category !== 'all' && item.category !== category) {
        return false;
      }

      const stock = item.counterStock ?? item.stockKg ?? 0;
      const minThresh = item.minThreshold || (item.unit === '1 Pc' ? 15 : 8);

      if (status === 'low_stock' || status === 'low_counter') return stock > 0 && stock <= minThresh;
      if (status === 'out_of_stock') return stock <= 0;

      return true;
    });
  }
);

export const selectInventorySummary = createSelector(
  [selectAllInventory],
  (items) => {
    let totalShopStock = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    items.forEach((item) => {
      const stock = item.counterStock ?? item.stockKg ?? 0;
      const minThresh = item.minThreshold || (item.unit === '1 Pc' ? 15 : 8);

      totalShopStock += stock;
      if (stock <= 0) {
        outOfStockCount++;
      } else if (stock <= minThresh) {
        lowStockCount++;
      }
    });

    return {
      totalProducts: items.length,
      totalShopStock: Math.round(totalShopStock * 10) / 10,
      totalCounter: Math.round(totalShopStock * 10) / 10,
      lowStock: lowStockCount,
      lowCounter: lowStockCount,
      outOfStock: outOfStockCount,
    };
  }
);

export default inventorySlice.reducer;
