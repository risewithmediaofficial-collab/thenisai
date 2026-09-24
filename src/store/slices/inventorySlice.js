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
      const { productId, quantity, target = 'godown' } = action.payload;
      const item = state.items.find((i) => i.id === productId);
      if (item) {
        const qty = parseFloat(quantity) || 0;
        if (target === 'godown') {
          const current = item.godownStock ?? Math.round((item.stockKg || 25) * 1.5);
          item.godownStock = Math.round((current + qty) * 100) / 100;
        } else {
          const current = item.counterStock ?? item.stockKg ?? 0;
          const next = Math.round((current + qty) * 100) / 100;
          item.counterStock = next;
          item.stockKg = next;
        }
      }
    },
    dispatchToCounterLocal: (state, action) => {
      const { productId, quantity } = action.payload;
      const item = state.items.find((i) => i.id === productId);
      if (item) {
        const qty = parseFloat(quantity) || 0;
        const currentGodown = item.godownStock ?? Math.round((item.stockKg || 25) * 1.5);
        const currentCounter = item.counterStock ?? item.stockKg ?? 0;
        item.godownStock = Math.max(0, Math.round((currentGodown - qty) * 100) / 100);
        const nextC = Math.round((currentCounter + qty) * 100) / 100;
        item.counterStock = nextC;
        item.stockKg = nextC;
      }
    },
    returnToGodownLocal: (state, action) => {
      const { productId, quantity, reason } = action.payload;
      const item = state.items.find((i) => i.id === productId);
      if (item) {
        const qty = parseFloat(quantity) || 0;
        const currentGodown = item.godownStock ?? Math.round((item.stockKg || 25) * 1.5);
        const currentCounter = item.counterStock ?? item.stockKg ?? 0;
        item.counterStock = Math.max(0, Math.round((currentCounter - qty) * 100) / 100);
        item.stockKg = item.counterStock;
        if (reason !== 'wastage' && reason !== 'spoilage') {
          item.godownStock = Math.round((currentGodown + qty) * 100) / 100;
        }
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
  dispatchToCounterLocal,
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

      const counter = item.counterStock ?? item.stockKg ?? 0;
      const godown = item.godownStock ?? Math.round(counter * 1.5);
      const minThresh = item.minThreshold || (item.unit === '1 Pc' ? 15 : 8);

      if (status === 'low_godown') return godown <= minThresh;
      if (status === 'low_counter') return counter <= minThresh;
      if (status === 'out_of_stock') return counter <= 0 && godown <= 0;

      return true;
    });
  }
);

export const selectInventorySummary = createSelector(
  [selectAllInventory],
  (items) => {
    let totalGodown = 0;
    let totalCounter = 0;
    let lowGodown = 0;
    let lowCounter = 0;
    let outOfStock = 0;

    items.forEach((item) => {
      const counter = item.counterStock ?? item.stockKg ?? 0;
      const godown = item.godownStock ?? Math.round(counter * 1.5);
      const minThresh = item.minThreshold || 8;

      totalGodown += godown;
      totalCounter += counter;

      if (godown <= minThresh) lowGodown++;
      if (counter <= minThresh) lowCounter++;
      if (godown <= 0 && counter <= 0) outOfStock++;
    });

    return {
      totalProducts: items.length,
      totalGodown: Math.round(totalGodown * 10) / 10,
      totalCounter: Math.round(totalCounter * 10) / 10,
      lowGodown,
      lowCounter,
      outOfStock,
    };
  }
);

export default inventorySlice.reducer;
