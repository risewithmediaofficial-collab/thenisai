import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useScrollLock } from '../../hooks/useScrollLock';
import SideNavbar from '../Nav/SideNavbar';
import DailyRevenueReport from './DailyRevenueReport';
import AddProductInlinePanel from '../Inventory/AddProductInlinePanel';
import DeleteBillModal from '../Billing/DeleteBillModal';
import EditBillModal from '../Billing/EditBillModal';
import StaffManagement from './StaffManagement';
import CatalogSettingsModal from './CatalogSettingsModal';
import { translateToTamil } from '../../utils/translateToTamil';
export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const {
    orders,
    bills,
    fetchBills,
    acceptOrder,
    updateOrderStatus,
    openInvoice,
    navigateTo,
    taxSettings,
    priceOverrideLogs,
    fetchPriceOverrideLogs,
    inventory,
    // Dynamic Products & Availability
    allBillingProducts,
    customProducts,
    productAvailabilityMap,
    toggleProductAvailability,
    addNewProduct,
    deleteProduct,
    updateProductMasterPrice,
    updateProductDetails,
    updateProductSkuCode,
    // Bill Deletion & 30-Day Recycle Bin
    recycleBinBills,
    deleteBill,
    deleteBills,
    restoreBill,
    restoreBills,
    permanentDeleteBill,
    permanentDeleteBills,
    fetchRecycleBinBills,
    // Product Deletion & 30-Day Recycle Bin
    recycleBinProducts,
    restoreProduct,
    restoreProducts,
    permanentDeleteProduct,
    permanentDeleteProducts,
    fetchRecycleBinProducts,
    // Unified Activity Audit Trail
    activityLogs,
    fetchActivityLogs,
  } = useCart();

  const resolveAdminTabFromHash = () => {
    const h = window.location.hash.toLowerCase();
    const normalized = h.replace(/^#admin\//, '').replace(/^#/, '');

    if (normalized.includes('daily') || normalized.includes('revenue') || normalized.includes('shift')) return 'daily-revenue';
    if (normalized.includes('recycle') || normalized.includes('trash') || normalized.includes('bin')) return 'recycle-bin';
    if (normalized.includes('inventory') || normalized.includes('product') || normalized.includes('stock')) return 'inventory';
    if (normalized.includes('activity') || normalized.includes('audit')) return 'activity-logs';
    if (normalized.includes('price') || normalized.includes('override')) return 'activity-logs';
    if (normalized.includes('sales') || normalized.includes('ledger')) return 'sales';
    if (normalized.includes('staff') || normalized.includes('user') || normalized.includes('account')) return 'staff';
    if (normalized.includes('dispatch') || normalized.includes('order')) return 'orders';
    return 'inventory';
  };

  const [activeTab, setActiveTab] = useState(resolveAdminTabFromHash);
  const [orderFilter, setOrderFilter] = useState('all'); // 'all' | 'New' | 'Accepted' | 'Dispatched' | 'Delivered'
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [editingPriceProduct, setEditingPriceProduct] = useState(null);
  const [newPriceInput, setNewPriceInput] = useState('');
  const [productEditForm, setProductEditForm] = useState({
    nameEn: '',
    nameTa: '',
    category: 'sweets',
    unit: 'kg',
    price: '',
  });
  const [editingSkuProduct, setEditingSkuProduct] = useState(null); // { id, name, skuCode }
  const [newSkuInput, setNewSkuInput] = useState('');
  const [skuError, setSkuError] = useState('');
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [billToDelete, setBillToDelete] = useState(null);
  const [selectedSalesIds, setSelectedSalesIds] = useState(new Set());
  const [billToRestore, setBillToRestore] = useState(null);
  const [billToPurge, setBillToPurge] = useState(null);
  const [editBillModalItem, setEditBillModalItem] = useState(null);
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);

  useEffect(() => {
    const handleDocClick = () => setActiveActionMenuId(null);
    if (activeActionMenuId) {
      document.addEventListener('click', handleDocClick);
      return () => document.removeEventListener('click', handleDocClick);
    }
  }, [activeActionMenuId]);

  // Inventory filter state
  const [inventorySearchTerm, setInventorySearchTerm] = useState('');
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState('all');
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'

  // Recycle Bin filter & sub-tab state
  const [recycleBinTab, setRecycleBinTab] = useState('bills'); // 'bills' | 'products'
  const [recycleSearchTerm, setRecycleSearchTerm] = useState('');
  const [selectedRecycleBillIds, setSelectedRecycleBillIds] = useState(new Set());
  const [selectedRecycleProductIds, setSelectedRecycleProductIds] = useState(new Set());
  const [isRefreshingRecycle, setIsRefreshingRecycle] = useState(false);
  const [productToRestore, setProductToRestore] = useState(null);
  const [productToPurge, setProductToPurge] = useState(null);
  const [recycleActionLoading, setRecycleActionLoading] = useState({
    isRunning: false,
    message: '',
    current: 0,
    total: 0,
  });
  const [isCatalogSettingsOpen, setIsCatalogSettingsOpen] = useState(false);

  // Activity Logs filter state
  const [activitySearchTerm, setActivitySearchTerm] = useState('');
  const [activityTypeFilter, setActivityTypeFilter] = useState('all');
  const [activityStaffFilter, setActivityStaffFilter] = useState('all');
  const [isRefreshingActivities, setIsRefreshingActivities] = useState(false);

  // Price Override Logs filter state
  const [logSearchTerm, setLogSearchTerm] = useState('');
  const [logCashierFilter, setLogCashierFilter] = useState('all');
  const [isRefreshingLogs, setIsRefreshingLogs] = useState(false);

  // Sync hash routing for admin tabs on back/forward/direct link
  useEffect(() => {
    const handleAdminHashSync = () => {
      const h = window.location.hash.toLowerCase();
      if (h.startsWith('#billing')) return;
      if (h === '#admin/billing' || h.startsWith('#admin/billing') || h === '#admin/pos' || h.startsWith('#admin/pos')) {
        return;
      }
      if (!h.startsWith('#admin') && !['#orders', '#dispatch', '#inventory', '#sales', '#daily-revenue', '#shift-bills', '#activity-logs', '#recycle-bin', '#staff', '#admin/staff'].includes(h)) return;
      const tab = resolveAdminTabFromHash();
      setActiveTab(tab);
      const adminRouteMap = {
        orders: '#admin/dispatch',
        dispatch: '#admin/dispatch',
        inventory: '#admin/inventory',
        sales: '#admin/sales',
        'daily-revenue': '#admin/shift-bills',
        'shift-bills': '#admin/shift-bills',
        'activity-logs': '#admin/activity-logs',
        'recycle-bin': '#admin/recycle-bin',
        staff: '#admin/staff',
      };
      const target = adminRouteMap[tab] || '#admin/inventory';
      if (window.location.hash !== target && window.location.hash !== '#admin/orders' && window.location.hash !== '#admin/daily-revenue') {
        window.location.hash = target;
      }
    };
    handleAdminHashSync();
    window.addEventListener('hashchange', handleAdminHashSync);
    window.addEventListener('popstate', handleAdminHashSync);
    return () => {
      window.removeEventListener('hashchange', handleAdminHashSync);
      window.removeEventListener('popstate', handleAdminHashSync);
    };
  }, []);

  const syncAdminHash = (hash) => {
    if (window.location.hash !== hash) {
      window.location.hash = hash;
    }
  };

  const handleSwitchAdminTab = (tab) => {
    setActiveTab(tab);
    if (tab === 'orders' || tab === 'dispatch') {
      syncAdminHash('#admin/dispatch');
    } else if (tab === 'inventory') {
      syncAdminHash('#admin/inventory');
    } else if (tab === 'sales') {
      syncAdminHash('#admin/sales');
      handleSyncAllSales();
    } else if (tab === 'daily-revenue' || tab === 'shift-bills') {
      syncAdminHash('#admin/shift-bills');
      handleSyncAllSales();
    } else if (tab === 'activity-logs' || tab === 'price-logs') {
      syncAdminHash('#admin/activity-logs');
      if (fetchActivityLogs) fetchActivityLogs();
      if (fetchPriceOverrideLogs) fetchPriceOverrideLogs();
    } else if (tab === 'recycle-bin') {
      syncAdminHash('#admin/recycle-bin');
      if (fetchRecycleBinBills) fetchRecycleBinBills();
      if (fetchRecycleBinProducts) fetchRecycleBinProducts();
    } else if (tab === 'staff') {
      syncAdminHash('#admin/staff');
    }
  };

  const handleRefreshActivities = async () => {
    setIsRefreshingActivities(true);
    try {
      if (fetchActivityLogs) await fetchActivityLogs();
      if (fetchPriceOverrideLogs) await fetchPriceOverrideLogs();
    } finally {
      setIsRefreshingActivities(false);
    }
  };

  const handleRefreshRecycle = async () => {
    setIsRefreshingRecycle(true);
    try {
      if (fetchRecycleBinBills) await fetchRecycleBinBills();
      if (fetchRecycleBinProducts) await fetchRecycleBinProducts();
    } finally {
      setIsRefreshingRecycle(false);
    }
  };

  const handleRefreshLogs = async () => {
    setIsRefreshingLogs(true);
    try {
      if (fetchPriceOverrideLogs) await fetchPriceOverrideLogs();
    } finally {
      setIsRefreshingLogs(false);
    }
  };

  // Sales Tab Filters & States
  const [salesSearchTerm, setSalesSearchTerm] = useState('');
  const [salesCashierFilter, setSalesCashierFilter] = useState('all');
  const [salesSourceFilter, setSalesSourceFilter] = useState('all'); // 'all' | 'counter' | 'online'
  const [salesPaymentFilter, setSalesPaymentFilter] = useState('all'); // 'all' | 'cash' | 'upi' | 'card' | 'split'
  const [salesSortBy, setSalesSortBy] = useState('date-desc');
  const [isSyncingSales, setIsSyncingSales] = useState(false);

  // Mobile Sidebar State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Lock scroll on background when mobile drawer is open
  useScrollLock(isMobileMenuOpen);

  // Consolidate all sales: counter bills from DB + online orders (excluding items in Recycle Bin)
  const allSales = useMemo(() => {
    const deletedIds = new Set();
    (recycleBinBills || []).forEach((rb) => {
      if (rb.id) deletedIds.add(String(rb.id));
      if (rb._id) deletedIds.add(String(rb._id));
      if (rb.billData?.id) deletedIds.add(String(rb.billData.id));
      if (rb.billData?._id) deletedIds.add(String(rb.billData._id));
    });

    const map = new Map();
    // Add bills from database (/api/bills & cache) - key by unique id
    (bills || []).forEach((b) => {
      const key = b.id || b._id || b.invoiceNumber;
      const bId = String(b.id || b._id || '');
      if (key && !deletedIds.has(bId) && !deletedIds.has(String(b._id))) {
        map.set(key, { ...b, source: b.source || 'counter' });
      }
    });
    // Add orders (online website orders & fallback) - key by unique id
    (orders || []).forEach((o) => {
      const key = o.id || o._id || o.invoiceNumber;
      const oId = String(o.id || o._id || '');
      if (key && !map.has(key) && !deletedIds.has(oId) && !deletedIds.has(String(o._id))) {
        map.set(key, o);
      }
    });
    return Array.from(map.values()).sort(
      (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
    );
  }, [bills, orders, recycleBinBills]);

  // High-level combined KPIs
  const totalRevenue = allSales.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const onlineOrders = allSales.filter((o) => o.source === 'online');
  const counterSales = allSales.filter((o) => (o.source || 'counter') === 'counter' || o.source === 'walk-in');
  const pendingOrders = onlineOrders.filter((o) => o.status === 'New');

  const counterRevenue = counterSales.reduce((sum, s) => sum + (s.grandTotal || 0), 0);
  const onlineRevenue = onlineOrders.reduce((sum, s) => sum + (s.grandTotal || 0), 0);
  const totalCashRevenue = allSales.filter((s) => (s.paymentMethod || '').toLowerCase() === 'cash').reduce((sum, s) => sum + (s.grandTotal || 0), 0);
  const totalUpiRevenue = allSales.filter((s) => (s.paymentMethod || '').toLowerCase() === 'upi').reduce((sum, s) => sum + (s.grandTotal || 0), 0);
  const totalCardRevenue = allSales.filter((s) => (s.paymentMethod || '').toLowerCase() === 'card').reduce((sum, s) => sum + (s.grandTotal || 0), 0);

  // Cashier Performance Aggregation
  const cashierSummary = useMemo(() => {
    const map = {};
    allSales.forEach((sale) => {
      if (sale.cashier || (sale.source || 'counter') === 'counter' || sale.source === 'walk-in') {
        const cid = sale.cashier?.username || sale.cashier?.id || 'counter-desk';
        const name = sale.cashier?.name || 'Counter Staff';
        const counter = sale.cashier?.counter || 'Counter Desk';
        if (!map[cid]) {
          map[cid] = {
            id: cid,
            name,
            counter,
            role: sale.cashier?.role || 'cashier',
            billCount: 0,
            totalAmount: 0,
            cash: 0,
            upi: 0,
            card: 0,
          };
        }
        map[cid].billCount += 1;
        const amt = sale.grandTotal || 0;
        map[cid].totalAmount += amt;
        const pm = (sale.paymentMethod || '').toLowerCase();
        if (pm === 'cash') map[cid].cash += amt;
        else if (pm === 'upi') map[cid].upi += amt;
        else if (pm === 'card') map[cid].card += amt;
      }
    });
    return Object.values(map);
  }, [allSales]);

  // Filtered sales for Tab 3
  const filteredSales = allSales.filter((sale) => {
    const sSource = sale.source === 'online' ? 'online' : 'counter';
    if (salesSourceFilter !== 'all' && sSource !== salesSourceFilter) return false;

    const sPayment = (sale.paymentMethod || '').toLowerCase();
    if (salesPaymentFilter !== 'all') {
      if (salesPaymentFilter === 'cash') {
        if (sPayment !== 'cash' && sPayment !== 'split') return false;
      } else if (salesPaymentFilter === 'upi') {
        if (sPayment !== 'upi' && sPayment !== 'split') return false;
      } else if (salesPaymentFilter === 'card') {
        if (sPayment !== 'card') return false;
      } else if (salesPaymentFilter === 'split') {
        if (sPayment !== 'split') return false;
      } else if (sPayment !== salesPaymentFilter) {
        return false;
      }
    }

    if (salesCashierFilter !== 'all') {
      const cid = sale.cashier?.username || sale.cashier?.id;
      if (cid !== salesCashierFilter) return false;
    }

    if (salesSearchTerm.trim()) {
      const term = salesSearchTerm.toLowerCase();
      const matchInv = sale.invoiceNumber?.toLowerCase().includes(term);
      const matchCust = sale.customer?.fullName?.toLowerCase().includes(term);
      const matchPhone = sale.customer?.phone?.includes(term);
      const matchCashier =
        sale.cashier?.name?.toLowerCase().includes(term) ||
        sale.cashier?.username?.toLowerCase().includes(term);
      if (!matchInv && !matchCust && !matchPhone && !matchCashier) return false;
    }

    return true;
  });

  const sortedSales = useMemo(() => {
    const list = [...filteredSales];
    return list.sort((a, b) => {
      if (salesSortBy === 'date-desc') return (b.createdAt || 0) - (a.createdAt || 0);
      if (salesSortBy === 'date-asc') return (a.createdAt || 0) - (b.createdAt || 0);
      if (salesSortBy === 'inv-asc' || salesSortBy === 'inv-desc') {
        const numA = parseInt(String(a.invoiceNumber || '').replace(/\D/g, '') || '0', 10);
        const numB = parseInt(String(b.invoiceNumber || '').replace(/\D/g, '') || '0', 10);
        return salesSortBy === 'inv-asc' ? numA - numB : numB - numA;
      }
      if (salesSortBy === 'amount-desc') return (b.grandTotal || 0) - (a.grandTotal || 0);
      if (salesSortBy === 'amount-asc') return (a.grandTotal || 0) - (b.grandTotal || 0);
      if (salesSortBy === 'customer-asc') {
        return String(a.customer?.fullName || '').localeCompare(String(b.customer?.fullName || ''));
      }
      return 0;
    });
  }, [filteredSales, salesSortBy]);

  const handleToggleSelectSale = (saleKey) => {
    setSelectedSalesIds((prev) => {
      const next = new Set(prev);
      if (next.has(saleKey)) {
        next.delete(saleKey);
      } else {
        next.add(saleKey);
      }
      return next;
    });
  };

  const isAllFilteredSalesSelected = useMemo(() => {
    if (filteredSales.length === 0) return false;
    return filteredSales.every((s) => selectedSalesIds.has(s.id || s.invoiceNumber));
  }, [filteredSales, selectedSalesIds]);

  const handleToggleSelectAllSales = () => {
    if (isAllFilteredSalesSelected) {
      setSelectedSalesIds(new Set());
    } else {
      const allIds = new Set(filteredSales.map((s) => s.id || s.invoiceNumber));
      setSelectedSalesIds(allIds);
    }
  };

  const handleBulkDeleteSelectedSales = () => {
    const selectedBills = filteredSales.filter((s) => selectedSalesIds.has(s.id || s.invoiceNumber));
    if (selectedBills.length === 0) return;
    setBillToDelete(selectedBills);
  };

  const handleSyncAllSales = async () => {
    setIsSyncingSales(true);
    try {
      await Promise.allSettled([
        fetchBills(),
        fetchRecycleBinBills ? fetchRecycleBinBills() : Promise.resolve(),
      ]);
    } finally {
      setTimeout(() => setIsSyncingSales(false), 400);
    }
  };

  // Automatically synchronize sales and recycle bin bills on mount
  useEffect(() => {
    handleSyncAllSales();
  }, []);

  // Filtered orders list for Tab 1 (Strictly Online Delivery Orders)
  const filteredOrders = useMemo(() => {
    const onlineOnly = (orders || []).filter(
      (order) => order.source === 'online' || (!order.id?.toLowerCase().startsWith('pos-') && !order.invoiceNumber?.toLowerCase().startsWith('pos-'))
    );

    return onlineOnly.filter((order) => {
      const matchesFilter =
        orderFilter === 'all'
          ? true
          : order.status?.toLowerCase() === orderFilter.toLowerCase();

      const matchesSearch =
        searchTerm.trim() === '' ||
        order.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer?.phone?.includes(searchTerm);

      return matchesFilter && matchesSearch;
    });
  }, [orders, orderFilter, searchTerm]);

  // Filtered Price Override Logs for Tab 4
  const filteredOverrideLogs = useMemo(() => {
    return (priceOverrideLogs || []).filter((log) => {
      if (logCashierFilter !== 'all') {
        const staff = (log.staffName || '').toLowerCase();
        if (!staff.includes(logCashierFilter.toLowerCase())) return false;
      }
      if (logSearchTerm.trim()) {
        const q = logSearchTerm.trim().toLowerCase();
        const pName = (log.productName || '').toLowerCase();
        const r = (log.reason || '').toLowerCase();
        const inv = (log.invoiceNumber || '').toLowerCase();
        const s = (log.staffName || '').toLowerCase();
        if (!pName.includes(q) && !r.includes(q) && !inv.includes(q) && !s.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [priceOverrideLogs, logCashierFilter, logSearchTerm]);

  // Filtered Products for Products & Inventory Tab
  const filteredInventoryProducts = useMemo(() => {
    return (allBillingProducts || []).filter((p) => {
      const cat = (p.category || '').toLowerCase();
      const subcat = (p.subcategory || '').toLowerCase();

      if (inventoryCategoryFilter !== 'all') {
        if (inventoryCategoryFilter === 'spices' || inventoryCategoryFilter === 'spices-masalas') {
          if (cat !== 'spices' && cat !== 'spices-masalas' && !subcat.includes('kara') && !subcat.includes('spice')) return false;
        } else if (inventoryCategoryFilter === 'beverages') {
          if (cat !== 'beverages' && !subcat.includes('tea') && !subcat.includes('coffee') && !subcat.includes('malt') && !subcat.includes('snack') && cat !== 'snacks') return false;
        } else if (inventoryCategoryFilter === 'sweets') {
          if (cat !== 'sweets' && !subcat.includes('sweet') && !subcat.includes('halwa') && !subcat.includes('pak') && !subcat.includes('roll') && !subcat.includes('bengali') && !subcat.includes('palkova')) return false;
        } else if (inventoryCategoryFilter === 'savouries') {
          if (cat !== 'savouries' && !subcat.includes('mixture') && !subcat.includes('sev') && !subcat.includes('murukku')) return false;
        } else if (cat !== inventoryCategoryFilter) {
          return false;
        }
      }
      const isInactive = productAvailabilityMap[p.id] !== undefined
        ? Boolean(productAvailabilityMap[p.id])
        : Boolean(p.isInactive || inventory?.find((i) => i.id === p.id)?.isInactive);
      if (inventoryStatusFilter === 'active' && isInactive) return false;
      if (inventoryStatusFilter === 'inactive' && !isInactive) return false;

      if (inventorySearchTerm.trim()) {
        const q = inventorySearchTerm.toLowerCase();
        const matchName = (p.name || '').toLowerCase().includes(q);
        const matchTamil = (p.tamilName || '').toLowerCase().includes(q);
        const matchId = (p.id || '').toLowerCase().includes(q);
        const matchNum = String(p.itemNumber || '').includes(q);
        const matchSku = (p.skuCode || '').toLowerCase().includes(q);
        const matchSub = (p.subcategory || '').toLowerCase().includes(q);
        if (!matchName && !matchTamil && !matchId && !matchNum && !matchSku && !matchSub) return false;
      }
      return true;
    }).sort((a, b) => {
      const getNum = (p) => {
        const sku = String(p?.skuCode ?? '').trim();
        const itemNum = String(p?.itemNumber ?? '').trim();
        const skuMatch = sku.match(/\d+/)?.[0];
        if (skuMatch) return parseInt(skuMatch, 10);
        const itemMatch = itemNum.match(/\d+/)?.[0];
        if (itemMatch) return parseInt(itemMatch, 10);
        return 999999;
      };
      const aNum = getNum(a);
      const bNum = getNum(b);
      if (aNum !== bNum) return aNum - bNum;
      return String(a.englishName || a.name || '').localeCompare(String(b.englishName || b.name || ''));
    });
  }, [allBillingProducts, inventoryCategoryFilter, inventoryStatusFilter, inventorySearchTerm, productAvailabilityMap, inventory]);

  const getItemUnitDisplay = (prod) => {
    if (!prod) return 'kg';
    const cat = (prod.category || '').toLowerCase();
    const u = (prod.unit || '').trim();
    const id = (prod.id || '').toLowerCase();
    if (cat === 'beverages' || id.includes('tea') || id.includes('coffee') || id.includes('milk') || id.includes('boost') || id.includes('horlicks') || u.toLowerCase().includes('cup')) {
      return '1 Cup';
    }
    if (cat === 'snacks' || id === 'vada' || u.toLowerCase().includes('pc')) {
      return '1 Pc';
    }
    if (u.toLowerCase() === 'litre' || u.toLowerCase() === '1 litre') return '1 Litre';
    if (u.toLowerCase() === 'pkt' || u.toLowerCase() === 'packet') return '1 Pkt';
    return u || 'kg';
  };

  const getItemStockDisplay = (prod) => {
    if (!prod) return '0';
    const invItem = (inventory || []).find((i) => i.id === prod.id);
    const stock = invItem ? invItem.stockKg : (prod.stockKg ?? prod.stock ?? 0);
    const cat = (prod.category || '').toLowerCase();
    const u = (prod.unit || '').toLowerCase();
    const id = (prod.id || '').toLowerCase();

    if (cat === 'beverages' || id.includes('tea') || id.includes('coffee') || id.includes('milk') || id.includes('boost') || id.includes('horlicks') || u.includes('cup')) {
      return `${stock} Cups`;
    }
    if (cat === 'snacks' || id === 'vada' || u.includes('pc')) {
      return `${stock} Pcs`;
    }
    if (u.includes('pkt')) {
      return `${stock} Pkts`;
    }
    if (u.includes('bottle') || u.includes('litre') || u.includes('liter') || u === 'l') {
      return `${stock} Litres`;
    }
    return `${stock} kg`;
  };

  // Filtered Bills for 30-Day Recycle Bin Tab
  const filteredRecycleBills = useMemo(() => {
    return (recycleBinBills || []).filter((b) => {
      if (recycleSearchTerm.trim()) {
        const q = recycleSearchTerm.toLowerCase();
        const matchInv = (b.invoiceNumber || '').toLowerCase().includes(q);
        const matchCust = (b.billData?.customer?.fullName || '').toLowerCase().includes(q);
        const matchPhone = (b.billData?.customer?.phone || '').includes(q);
        const matchReason = (b.deletionReason || '').toLowerCase().includes(q);
        const matchBy = (b.deletedBy?.name || '').toLowerCase().includes(q);
        if (!matchInv && !matchCust && !matchPhone && !matchReason && !matchBy) return false;
      }
      return true;
    });
  }, [recycleBinBills, recycleSearchTerm]);

  // Filtered Products for 30-Day Recycle Bin Tab
  const filteredRecycleProducts = useMemo(() => {
    return (recycleBinProducts || []).filter((p) => {
      if (recycleSearchTerm.trim()) {
        const q = recycleSearchTerm.toLowerCase();
        const matchName = (p.name || '').toLowerCase().includes(q);
        const matchEn = (p.englishName || '').toLowerCase().includes(q);
        const matchTa = (p.tamilName || '').toLowerCase().includes(q);
        const matchCat = (p.productData?.category || p.category || '').toLowerCase().includes(q);
        const matchReason = (p.deletionReason || '').toLowerCase().includes(q);
        const matchBy = (p.deletedBy?.name || '').toLowerCase().includes(q);
        if (!matchName && !matchEn && !matchTa && !matchCat && !matchReason && !matchBy) return false;
      }
      return true;
    });
  }, [recycleBinProducts, recycleSearchTerm]);

  // Recycle Bin Bills Selection Handlers
  const handleToggleSelectRecycleBill = (billKey) => {
    setSelectedRecycleBillIds((prev) => {
      const next = new Set(prev);
      if (next.has(billKey)) {
        next.delete(billKey);
      } else {
        next.add(billKey);
      }
      return next;
    });
  };

  const isAllFilteredRecycleBillsSelected = useMemo(() => {
    if (filteredRecycleBills.length === 0) return false;
    return filteredRecycleBills.every((b) => selectedRecycleBillIds.has(b.id || b.invoiceNumber));
  }, [filteredRecycleBills, selectedRecycleBillIds]);

  const handleToggleSelectAllRecycleBills = () => {
    if (isAllFilteredRecycleBillsSelected) {
      setSelectedRecycleBillIds(new Set());
    } else {
      const allIds = new Set(filteredRecycleBills.map((b) => b.id || b.invoiceNumber));
      setSelectedRecycleBillIds(allIds);
    }
  };

  const handleBulkPurgeSelectedBills = () => {
    const selected = filteredRecycleBills.filter((b) => selectedRecycleBillIds.has(b.id || b.invoiceNumber));
    if (selected.length === 0) return;
    setBillToPurge(selected);
  };

  const handleBulkRestoreSelectedBills = () => {
    const selected = filteredRecycleBills.filter((b) => selectedRecycleBillIds.has(b.id || b.invoiceNumber));
    if (selected.length === 0) return;
    setBillToRestore(selected);
  };

  // Recycle Bin Products Selection Handlers
  const handleToggleSelectRecycleProduct = (productId) => {
    setSelectedRecycleProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const isAllFilteredRecycleProductsSelected = useMemo(() => {
    if (filteredRecycleProducts.length === 0) return false;
    return filteredRecycleProducts.every((p) => selectedRecycleProductIds.has(p.id));
  }, [filteredRecycleProducts, selectedRecycleProductIds]);

  const handleToggleSelectAllRecycleProducts = () => {
    if (isAllFilteredRecycleProductsSelected) {
      setSelectedRecycleProductIds(new Set());
    } else {
      const allIds = new Set(filteredRecycleProducts.map((p) => p.id));
      setSelectedRecycleProductIds(allIds);
    }
  };

  const handleBulkPurgeSelectedProducts = () => {
    const selected = filteredRecycleProducts.filter((p) => selectedRecycleProductIds.has(p.id));
    if (selected.length === 0) return;
    setProductToPurge(selected);
  };

  const handleBulkRestoreSelectedProducts = () => {
    const selected = filteredRecycleProducts.filter((p) => selectedRecycleProductIds.has(p.id));
    if (selected.length === 0) return;
    setProductToRestore(selected);
  };

  // Unified Filtered Activities for Audit Trail Tab
  const filteredActivities = useMemo(() => {
    return (activityLogs || []).filter((act) => {
      if (activityTypeFilter !== 'all' && act.actionType !== activityTypeFilter) return false;
      if (activityStaffFilter !== 'all') {
        const staff = (act.performedBy?.name || '').toLowerCase();
        if (!staff.includes(activityStaffFilter.toLowerCase())) return false;
      }
      if (activitySearchTerm.trim()) {
        const q = activitySearchTerm.toLowerCase();
        const matchType = (act.actionType || '').toLowerCase().includes(q);
        const matchTarget = (act.targetName || act.targetId || '').toLowerCase().includes(q);
        const matchReason = (act.reason || '').toLowerCase().includes(q);
        const matchStaff = (act.performedBy?.name || '').toLowerCase().includes(q);
        if (!matchType && !matchTarget && !matchReason && !matchStaff) return false;
      }
      return true;
    });
  }, [activityLogs, activityTypeFilter, activityStaffFilter, activitySearchTerm]);

  return (
    <div className="admin-root side-layout" data-lenis-prevent="true">
      {/* 1. Sleek Left Side Navbar */}
      <SideNavbar
        currentSection={
          activeTab === 'daily-revenue'
            ? 'admin-shift-bills'
            : activeTab === 'orders'
            ? 'admin-dispatch'
            : `admin-${activeTab}`
        }
        onSelectSection={(sec) => {
          if (sec === 'admin-billing' || sec === 'pos-register') navigateTo('admin', 'billing');
          else if (sec === 'admin-shift-bills' || sec === 'admin-daily-revenue' || sec === 'pos-bills' || sec === 'pos-daily-sales') handleSwitchAdminTab('daily-revenue');
          else if (sec === 'admin-dispatch' || sec === 'admin-orders' || sec === 'pos-online') handleSwitchAdminTab('orders');
          else if (sec === 'admin-inventory' || sec === 'pos-inventory') handleSwitchAdminTab('inventory');
          else if (sec === 'admin-sales') handleSwitchAdminTab('sales');
          else if (sec === 'admin-activity-logs' || sec === 'admin-price-logs') handleSwitchAdminTab('activity-logs');
          else if (sec === 'admin-recycle-bin') handleSwitchAdminTab('recycle-bin');
          else if (sec === 'admin-staff') handleSwitchAdminTab('staff');
          else if (sec === 'storefront') navigateTo('storefront');
        }}
        pendingOnlineCount={pendingOrders.length}
        shiftBillsCount={counterSales.length}
        recycleBinBills={recycleBinBills}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* 2. Main Admin Content Area beside Side Navbar */}
      <div className="admin-content-area" data-lenis-prevent="true">
        {/* Compact Mobile Strip with Hamburger Trigger */}
        <header className="admin-mobile-strip mobile-only">
          <button
            type="button"
            className="admin-hamburger-btn"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open Navigation"
          >
            <span className="hamburger-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </span>
          </button>
          <div className="mobile-strip-brand">
            <img src="/images/branding/logo-icon.png" alt="Thenisai" className="mobile-strip-logo" />
            <div className="mobile-strip-brand-text">
              <strong>THENISAI ADMIN</strong>
              <span>Orders &amp; Sales Portal</span>
            </div>
          </div>
        </header>

      <main className="admin-container" data-lenis-prevent="true">
        {/* Admin Top Operations Bar & Overview KPIs (displayed on Orders overview) */}
        {activeTab === 'orders' && (
          <>
            <div className="admin-operations-bar">
              <div className="admin-ops-title-group">
                <h1 className="admin-portal-title">ADMIN MANAGEMENT PORTAL</h1>
                <p className="admin-portal-sub">
                  Logged in as <strong>{user?.name || 'Administrator'}</strong> · Krishnagiri Store Operations
                </p>
              </div>
            </div>

            {/* KPI Cards Grid */}
            <section className="admin-kpi-grid">
              <div
                className="kpi-card revenue"
                onClick={() => handleSwitchAdminTab('daily-revenue')}
                title="Click to view Daily Sales & Revenue Breakdown"
                style={{ cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="kpi-label">Total Revenue</span>
                  <span style={{ fontSize: '10px', color: '#d4a843', fontWeight: 700, letterSpacing: '0.08em' }}>VIEW DAILY ↗</span>
                </div>
                <div className="kpi-value">₹{totalRevenue.toLocaleString('en-IN')}</div>
                <span className="kpi-sub">Online + Store Counter</span>
              </div>

              <div className={`kpi-card pending ${pendingOrders.length > 0 ? 'pulse' : ''}`}>
                <span className="kpi-label">Pending Online Orders</span>
                <div className="kpi-value">{pendingOrders.length}</div>
                <span className="kpi-sub">
                  {pendingOrders.length > 0 ? 'Requires immediate packing' : 'All clear'}
                </span>
              </div>

              <div className="kpi-card online">
                <span className="kpi-label">Total Online Orders</span>
                <div className="kpi-value">{onlineOrders.length}</div>
                <span className="kpi-sub">Deliveries across TN</span>
              </div>

              <div className="kpi-card sales">
                <span className="kpi-label">Counter Invoices</span>
                <div className="kpi-value">{counterSales.length}</div>
                <span className="kpi-sub">In-Store Register Bills</span>
              </div>
            </section>
          </>
        )}

        {/* =========================================
            TAB 1: ONLINE ORDERS PROCESSING
           ========================================= */}
        {activeTab === 'orders' && (
          <section className="tab-content">
            <div className="tab-toolbar">
              <div className="filter-chips">
                {['all', 'New', 'Accepted', 'Dispatched', 'Delivered'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    className={`filter-chip ${orderFilter === st ? 'active' : ''}`}
                    onClick={() => setOrderFilter(st)}
                  >
                    {st === 'all' ? 'All Orders' : st}
                    {st === 'New' && pendingOrders.length > 0 && ` (${pendingOrders.length})`}
                  </button>
                ))}
              </div>

              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search by customer name, phone, or invoice..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="empty-tab-state">
                <div className="empty-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                </div>
                <h3>No Orders Found</h3>
                <p>No orders currently match the selected filter.</p>
              </div>
            ) : (
              <div className="orders-cards-list">
                {filteredOrders.map((ord) => (
                  <div key={ord.id} className={`order-admin-card status-${ord.status?.toLowerCase()}`}>
                    <div className="order-admin-card__top">
                      <div className="order-id-group">
                        <span className="order-invoice-no">{ord.invoiceNumber}</span>
                        <span className="order-time-stamp">
                          {ord.orderDate} at {ord.orderTime}
                        </span>
                        <span className={`source-pill ${ord.source}`}>
                          {ord.source === 'online' ? (
                            <>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}>
                                <circle cx="12" cy="12" r="10" />
                                <line x1="2" y1="12" x2="22" y2="12" />
                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                              </svg>
                              Online Delivery
                            </>
                          ) : (
                            <>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}>
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                <polyline points="9 22 9 12 15 12 15 22" />
                              </svg>
                              In-Store Walk-in
                            </>
                          )}
                        </span>
                      </div>

                      <div className="order-status-badge">
                        <span className={`status-tag ${ord.status?.toLowerCase()}`}>
                          {ord.status}
                        </span>
                      </div>
                    </div>

                    <div className="order-admin-card__grid">
                      {/* Customer & Address */}
                      <div className="order-col customer">
                        <span className="col-heading">Customer & Dispatch Address</span>
                        <div className="customer-name">{ord.customer?.fullName}</div>
                        <div className="customer-contact">
                          <a href={`tel:${ord.customer?.phone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                            </svg>
                            +91 {ord.customer?.phone}
                          </a>
                          {ord.customer?.email && <span> · {ord.customer?.email}</span>}
                        </div>
                        {ord.shippingAddress && (
                          <div className="customer-address" style={{ display: 'flex', alignItems: 'flex-start', gap: '5px' }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            <span>
                              {ord.shippingAddress.doorNo}, {ord.shippingAddress.street},{' '}
                              {ord.shippingAddress.city}, {ord.shippingAddress.state} -{' '}
                              {ord.shippingAddress.pincode}
                            </span>
                          </div>
                        )}
                        {ord.giftNote && (
                          <div className="gift-banner" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 12 20 22 4 22 4 12" />
                              <rect x="2" y="7" width="20" height="5" />
                              <line x1="12" y1="22" x2="12" y2="7" />
                              <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                              <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                            </svg>
                            <em>"{ord.giftNote}"</em>
                          </div>
                        )}
                      </div>

                      {/* Items Ordered */}
                      <div className="order-col items">
                        <span className="col-heading">Items Ordered</span>
                        <div className="admin-items-list">
                          {ord.items?.map((it, idx) => (
                            <div key={idx} className="admin-item-row">
                              <span className="it-name">{it.name}</span>
                              <span className="it-weight">({it.weight})</span>
                              <span className="it-qty">× {it.quantity}</span>
                              <span className="it-price">₹{it.price * it.quantity}</span>
                            </div>
                          ))}
                        </div>
                        <div className="order-total-bar">
                          <span>Total Amount:</span>
                          <span className="total-amount-highlight">₹{ord.grandTotal}</span>
                          <span className="payment-pill-small">
                            {ord.paymentMethod === 'upi' ? 'Direct UPI' : 'Pay on Delivery'}
                          </span>
                        </div>
                      </div>

                      {/* Operations Actions */}
                      <div className="order-col actions">
                        <span className="col-heading">Actions & Processing</span>
                        <div className="admin-actions-group">
                          {ord.status === 'New' && (
                            <button
                              type="button"
                              className="act-btn accept"
                              onClick={() => acceptOrder(ord.id)}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}>
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              Accept Order
                            </button>
                          )}

                          {ord.status === 'Accepted' && (
                            <button
                              type="button"
                              className="act-btn dispatch"
                              onClick={() => updateOrderStatus(ord.id, 'Dispatched')}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}>
                                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                                <path d="m3.3 7 8.7 5 8.7-5" />
                                <path d="M12 22V12" />
                              </svg>
                              Mark Dispatched
                            </button>
                          )}

                          {ord.status === 'Dispatched' && (
                            <button
                              type="button"
                              className="act-btn deliver"
                              onClick={() => updateOrderStatus(ord.id, 'Delivered')}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}>
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                              </svg>
                              Mark Delivered
                            </button>
                          )}

                          <button
                            type="button"
                            className="act-btn invoice"
                            onClick={() => openInvoice(ord)}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}>
                              <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
                              <path d="M16 8h-8" />
                              <path d="M16 12h-8" />
                              <path d="M10 16h-2" />
                            </svg>
                            View / Print Tax Bill
                          </button>

                          {ord.customer?.phone && (
                            <a
                              href={`https://wa.me/91${ord.customer.phone}?text=Namaste%20${encodeURIComponent(
                                ord.customer.fullName
                              )},%20Thenisai%20Sweets%20has%20confirmed%20your%20order%20${ord.invoiceNumber}.`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="act-btn whatsapp"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}>
                                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                              </svg>
                              WhatsApp Customer
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* =========================================
            TAB 2: PRODUCTS & INVENTORY MASTER MANAGEMENT
           ========================================= */}
        {activeTab === 'inventory' && (
          <section className="tab-content admin-inventory-tab">
            <div className="inventory-header-strip" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span className="inventory-eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 800, color: '#d4a843', letterSpacing: '0.08em' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  CATALOG &amp; STOCK MASTER
                </span>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '4px 0 2px' }}>
                  Products &amp; Inventory Management
                </h2>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                  Master control for adjusting selling prices, masking out-of-stock items, and managing products.
                </p>
              </div>

              <div className="inventory-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  className="btn-add-product"
                  onClick={() => setIsAddProductModalOpen((prev) => !prev)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: isAddProductModalOpen ? '#475569' : 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#fff',
                    border: 'none',
                    padding: '9px 16px',
                    borderRadius: '10px',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: isAddProductModalOpen ? 'none' : '0 2px 8px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  {isAddProductModalOpen ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                      <span>Close Add Form</span>
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      <span>Add New Product</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn-catalog-settings"
                  onClick={() => setIsCatalogSettingsOpen(true)}
                  title="Manage custom categories & units"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#f1f5f9',
                    color: '#0f172a',
                    border: '1px solid #cbd5e1',
                    padding: '9px 16px',
                    borderRadius: '10px',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                    <path d="M4.93 4.93a10 10 0 0 0 0 14.14" />
                    <path d="M12 2v2" />
                    <path d="M12 20v2" />
                    <path d="M4.22 4.22l1.42 1.42" />
                    <path d="M18.36 18.36l1.42 1.42" />
                    <path d="M2 12h2" />
                    <path d="M20 12h2" />
                    <path d="M4.22 19.78l1.42-1.42" />
                    <path d="M18.36 5.64l1.42-1.42" />
                  </svg>
                  <span>Catalog Settings</span>
                </button>
                <button
                  type="button"
                  className="btn-return-pos"
                  onClick={() => navigateTo('billing', 'register')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#f1f5f9',
                    color: '#0f172a',
                    border: '1px solid #cbd5e1',
                    padding: '9px 16px',
                    borderRadius: '10px',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                  <span>Return to POS</span>
                </button>
              </div>
            </div>

            {/* In-Screen Collapsible Add New Product Master Panel */}
            <AddProductInlinePanel
              isOpen={isAddProductModalOpen}
              onClose={() => setIsAddProductModalOpen(false)}
              onAddProduct={(p) => addNewProduct(p, user)}
            />

            {/* Category Division Chips (Previous Inventory Layout) */}
            <div className="inventory-category-division-chips" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '4px' }}>
                Categories:
              </span>
              <button
                type="button"
                className={`inv-div-chip ${inventoryCategoryFilter === 'all' ? 'active' : ''}`}
                onClick={() => setInventoryCategoryFilter('all')}
                style={{
                  padding: '7px 14px',
                  borderRadius: '20px',
                  border: inventoryCategoryFilter === 'all' ? '1.5px solid #d97706' : '1px solid #cbd5e1',
                  background: inventoryCategoryFilter === 'all' ? '#fef3c7' : '#fff',
                  color: inventoryCategoryFilter === 'all' ? '#92400e' : '#475569',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>All Products</span>
                <span style={{ fontSize: '11px', background: inventoryCategoryFilter === 'all' ? '#f59e0b' : '#e2e8f0', color: inventoryCategoryFilter === 'all' ? '#fff' : '#475569', padding: '1px 6px', borderRadius: '10px' }}>
                  {allBillingProducts.length}
                </span>
              </button>
              <button
                type="button"
                className={`inv-div-chip ${inventoryCategoryFilter === 'beverages' ? 'active' : ''}`}
                onClick={() => setInventoryCategoryFilter('beverages')}
                style={{
                  padding: '7px 14px',
                  borderRadius: '20px',
                  border: inventoryCategoryFilter === 'beverages' ? '1.5px solid #d97706' : '1px solid #cbd5e1',
                  background: inventoryCategoryFilter === 'beverages' ? '#fef3c7' : '#fff',
                  color: inventoryCategoryFilter === 'beverages' ? '#92400e' : '#475569',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                  <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                  <line x1="6" y1="1" x2="6" y2="4" />
                  <line x1="10" y1="1" x2="10" y2="4" />
                  <line x1="14" y1="1" x2="14" y2="4" />
                </svg>
                <span>Beverages &amp; Hot Drinks (Cups / Pcs)</span>
                <span style={{ fontSize: '11px', background: inventoryCategoryFilter === 'beverages' ? '#f59e0b' : '#e2e8f0', color: inventoryCategoryFilter === 'beverages' ? '#fff' : '#475569', padding: '1px 6px', borderRadius: '10px' }}>
                  {allBillingProducts.filter(p => (p.category || '').toLowerCase() === 'beverages' || (p.category || '').toLowerCase() === 'snacks' || (p.unit && p.unit.toLowerCase().includes('cup')) || p.id === 'vada' || (p.id && p.id.includes('tea')) || (p.id && p.id.includes('coffee'))).length}
                </span>
              </button>
              <button
                type="button"
                className={`inv-div-chip ${inventoryCategoryFilter === 'sweets' ? 'active' : ''}`}
                onClick={() => setInventoryCategoryFilter('sweets')}
                style={{
                  padding: '7px 14px',
                  borderRadius: '20px',
                  border: inventoryCategoryFilter === 'sweets' ? '1.5px solid #d97706' : '1px solid #cbd5e1',
                  background: inventoryCategoryFilter === 'sweets' ? '#fef3c7' : '#fff',
                  color: inventoryCategoryFilter === 'sweets' ? '#92400e' : '#475569',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="8" width="18" height="12" rx="2" />
                  <path d="M12 8V4" />
                  <path d="M8 4h8" />
                </svg>
                <span>Traditional Sweets (Weight in kg)</span>
                <span style={{ fontSize: '11px', background: inventoryCategoryFilter === 'sweets' ? '#f59e0b' : '#e2e8f0', color: inventoryCategoryFilter === 'sweets' ? '#fff' : '#475569', padding: '1px 6px', borderRadius: '10px' }}>
                  {allBillingProducts.filter(p => (p.category || '').toLowerCase() === 'sweets' || (!p.category && !p.id?.includes('tea') && !p.id?.includes('coffee'))).length}
                </span>
              </button>
              <button
                type="button"
                className={`inv-div-chip ${inventoryCategoryFilter === 'spices' ? 'active' : ''}`}
                onClick={() => setInventoryCategoryFilter('spices')}
                style={{
                  padding: '7px 14px',
                  borderRadius: '20px',
                  border: inventoryCategoryFilter === 'spices' ? '1.5px solid #d97706' : '1px solid #cbd5e1',
                  background: inventoryCategoryFilter === 'spices' ? '#fef3c7' : '#fff',
                  color: inventoryCategoryFilter === 'spices' ? '#92400e' : '#475569',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                </svg>
                <span>Spices &amp; Kara Vagai</span>
                <span style={{ fontSize: '11px', background: inventoryCategoryFilter === 'spices' ? '#f59e0b' : '#e2e8f0', color: inventoryCategoryFilter === 'spices' ? '#fff' : '#475569', padding: '1px 6px', borderRadius: '10px' }}>
                  {allBillingProducts.filter(p => (p.category || '').toLowerCase() === 'spices' || (p.subcategory || '').toLowerCase().includes('kara')).length}
                </span>
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="inventory-filter-bar" style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
              <div className="inventory-filter-group" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <select
                  value={inventoryCategoryFilter}
                  onChange={(e) => setInventoryCategoryFilter(e.target.value)}
                  className="admin-select-filter"
                  style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff', color: '#334155', fontWeight: 600 }}
                >
                  <option value="all">All Categories ({allBillingProducts.length})</option>
                  <option value="beverages">Beverages &amp; Hot Drinks (Cups/Pcs)</option>
                  <option value="sweets">Traditional Sweets (kg)</option>
                  <option value="spices">Spices &amp; Kara Vagai</option>
                  <option value="savouries">Savouries &amp; Mixtures</option>
                  <option value="other">Other</option>
                </select>

                <select
                  value={inventoryStatusFilter}
                  onChange={(e) => setInventoryStatusFilter(e.target.value)}
                  className="admin-select-filter"
                  style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff', color: '#334155', fontWeight: 600 }}
                >
                  <option value="all">All Stock Status</option>
                  <option value="active">Active (In Stock Only)</option>
                  <option value="inactive">Masked (Out of Stock Only)</option>
                </select>
              </div>

              <div className="inventory-search-wrap" style={{ flex: 1, position: 'relative', minWidth: '220px' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Search product by English or Tamil name..."
                  value={inventorySearchTerm}
                  onChange={(e) => setInventorySearchTerm(e.target.value)}
                  style={{ width: '100%', padding: '8px 36px 8px 36px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', background: '#fff' }}
                />
                {inventorySearchTerm && (
                  <button
                    type="button"
                    onClick={() => setInventorySearchTerm('')}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Products Table */}
            <div className="inventory-table-wrap">
              {filteredInventoryProducts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 24px', color: '#64748b' }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 12px' }}>
                    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <h3 style={{ fontSize: '16px', color: '#1e293b', margin: '0 0 4px' }}>No Products Found</h3>
                  <p style={{ fontSize: '13px', margin: 0 }}>No catalog items match your search or filter selection.</p>
                </div>
              ) : (
                <table className="inventory-table">
                  <thead>
                    <tr>
                      <th>SKU CODE</th>
                      <th>PRODUCT DETAILS</th>
                      <th>CATEGORY</th>
                      <th>BILLING UNIT</th>
                      <th>SELLING PRICE</th>
                      <th>COUNTER AVAILABILITY</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventoryProducts.map((prod, idx) => {
                      const isInactive = productAvailabilityMap[prod.id] !== undefined
                        ? Boolean(productAvailabilityMap[prod.id])
                        : Boolean(prod.isInactive || inventory?.find((i) => i.id === prod.id)?.isInactive);
                      return (
                        <tr key={prod.id || idx} style={{ opacity: isInactive ? 0.75 : 1 }}>
                          <td>
                            {editingSkuProduct?.id === prod.id ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '80px' }}>
                                <input
                                  type="text"
                                  value={newSkuInput}
                                  onChange={(e) => { setNewSkuInput(e.target.value); setSkuError(''); }}
                                  onKeyDown={async (e) => {
                                    if (e.key === 'Enter') {
                                      const trimmed = newSkuInput.trim();
                                      if (trimmed) {
                                        const duplicate = allBillingProducts.find((p) => p.id !== prod.id && String(p.skuCode ?? p.itemNumber ?? '').trim().toLowerCase() === trimmed.toLowerCase());
                                        if (duplicate) {
                                          setSkuError(`SKU #${trimmed} is already added for "${duplicate.englishName || duplicate.name.split('—')[0].trim()}".`);
                                          return;
                                        }
                                      }
                                      const res = await updateProductSkuCode(prod.id, newSkuInput);
                                      if (res?.success) { setEditingSkuProduct(null); } else { setSkuError(res?.message || 'Error'); }
                                    } else if (e.key === 'Escape') { setEditingSkuProduct(null); setSkuError(''); }
                                  }}
                                  autoFocus
                                  style={{ width: '72px', fontSize: '12px', padding: '3px 6px', border: skuError ? '1px solid #ef4444' : '1px solid #6366f1', borderRadius: '6px', fontFamily: 'monospace', fontWeight: 700, outline: 'none' }}
                                  placeholder="e.g. 42"
                                />
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <button type="button" style={{ fontSize: '10px', padding: '2px 6px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    onClick={async () => {
                                      const trimmed = newSkuInput.trim();
                                      if (trimmed) {
                                        const duplicate = allBillingProducts.find((p) => p.id !== prod.id && String(p.skuCode ?? p.itemNumber ?? '').trim().toLowerCase() === trimmed.toLowerCase());
                                        if (duplicate) {
                                          setSkuError(`SKU #${trimmed} is already added for "${duplicate.englishName || duplicate.name.split('—')[0].trim()}".`);
                                          return;
                                        }
                                      }
                                      const res = await updateProductSkuCode(prod.id, newSkuInput);
                                      if (res?.success) { setEditingSkuProduct(null); } else { setSkuError(res?.message || 'Error'); }
                                    }}
                                  >Save</button>
                                  <button type="button" style={{ fontSize: '10px', padding: '2px 6px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                                    onClick={() => { setEditingSkuProduct(null); setSkuError(''); }}
                                  >
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <line x1="18" y1="6" x2="6" y2="18" />
                                      <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                  </button>
                                </div>
                                {skuError && <span style={{ fontSize: '10px', color: '#ef4444' }}>{skuError}</span>}
                              </div>
                            ) : (
                              <button type="button" className="item-num-badge"
                                onClick={() => { setEditingSkuProduct(prod); setNewSkuInput(prod.skuCode || String(prod.itemNumber || '')); setSkuError(''); }}
                                title="Click to edit SKU/HSN code"
                                style={{ cursor: 'pointer', background: '#ede9fe', color: '#5b21b6', border: '1px dashed #7c3aed', fontFamily: 'monospace', fontWeight: 700 }}
                              >
                                {prod.skuCode || prod.itemNumber || '—'}
                              </button>
                            )}
                          </td>
                          <td>
                            <div>
                              <strong style={{ fontSize: '14px', color: '#0f172a' }}>
                                {prod.englishName || prod.name.split('—')[0].trim()}
                              </strong>
                              {(prod.tamilName || (prod.name.includes('—') ? prod.name.split('—')[1].trim() : '')) && (
                                <span style={{ display: 'block', fontSize: '12px', color: '#b45309', fontWeight: 600 }}>
                                  {prod.tamilName || (prod.name.includes('—') ? prod.name.split('—')[1].trim() : '')}
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <span style={{ fontSize: '12px', color: '#475569', fontWeight: 600, textTransform: 'capitalize' }}>
                              {prod.category?.replace('-', ' ') || 'General'}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                              {getItemUnitDisplay(prod)}
                            </span>
                          </td>

                          <td>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <strong style={{ fontSize: '15px', color: '#0f172a' }}>
                                ₹{prod.price || prod.unitPrice || 0}
                              </strong>
                              <button
                                type="button"
                                className="btn-inline-price"
                                onClick={() => {
                                  const englishName = prod.englishName || (prod.name || '').split('—')[0].trim();
                                  const tamilName = prod.tamilName || ((prod.name || '').includes('—') ? (prod.name || '').split('—')[1].trim() : '');
                                  setEditingPriceProduct(prod);
                                  setNewPriceInput(String(prod.price || prod.unitPrice || ''));
                                  setProductEditForm({
                                    nameEn: englishName,
                                    nameTa: tamilName,
                                    category: prod.category || 'sweets',
                                    unit: prod.unit || 'kg',
                                    price: String(prod.price || prod.unitPrice || ''),
                                  });
                                }}
                                title="Edit product details"
                              >
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                                </svg>
                                Edit Product
                              </button>
                            </div>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="stock-toggle-switch"
                              onClick={() => toggleProductAvailability(prod.id, !isInactive, user)}
                              title={isInactive ? 'Click to mark In Stock / Active' : 'Click to mask Out of Stock'}
                            >
                              <div className={`toggle-track ${!isInactive ? 'active' : ''}`}>
                                <div className="toggle-thumb" />
                              </div>
                              <span className={`toggle-label ${!isInactive ? 'active' : 'inactive'}`}>
                                {!isInactive ? 'IN STOCK' : 'OUT OF STOCK'}
                              </span>
                            </button>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <button
                                type="button"
                                className="btn-delete-prod"
                                onClick={() => setDeletingProduct(prod)}
                                title="Delete Product from Catalog"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        )}

        {/* =========================================
            TAB 3: ALL SALES & BILLING LOG
           ========================================= */}
        {activeTab === 'sales' && (
          <section className="tab-content admin-sales-tab">
            {/* Sales Stats Strip */}
            <div className="tab-toolbar admin-sales-toolbar-top">
              <div>
                <h3 className="section-title">All Sales, Cashier Desks & Invoices</h3>
              </div>

              <button
                type="button"
                className="btn-sync-sales"
                onClick={handleSyncAllSales}
                disabled={isSyncingSales}
              >
                <svg
                  className={isSyncingSales ? 'spin' : ''}
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                </svg>
                <span>{isSyncingSales ? 'Syncing...' : 'Sync Database Bills'}</span>
              </button>


            </div>

            {/* Sales Summary Metrics Strip */}
            <div className="sales-overview-metrics">
              <div className="sales-stat-card total">
                <span className="stat-label">Gross Sales Revenue</span>
                <strong className="stat-val">₹{totalRevenue.toLocaleString('en-IN')}</strong>
                <span className="stat-sub">{allSales.length} Total Bills</span>
              </div>
              <div className="sales-stat-card counter">
                <span className="stat-label">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '5px' }}>
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  Counter Store Sales
                </span>
                <strong className="stat-val">₹{counterRevenue.toLocaleString('en-IN')}</strong>
                <span className="stat-sub">{counterSales.length} In-Store Bills</span>
              </div>
              <div className="sales-stat-card online">
                <span className="stat-label">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '5px' }}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  Online Web Delivery
                </span>
                <strong className="stat-val">₹{onlineRevenue.toLocaleString('en-IN')}</strong>
                <span className="stat-sub">{onlineOrders.length} Online Orders</span>
              </div>
              <div className="sales-stat-card payment">
                <span className="stat-label">Payment Modes</span>
                <div className="payment-split-pills">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="6" width="20" height="12" rx="2" />
                      <circle cx="12" cy="12" r="2" />
                      <path d="M6 12h.01M18 12h.01" />
                    </svg>
                    Cash: ₹{totalCashRevenue.toLocaleString('en-IN')}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                      <line x1="12" y1="18" x2="12.01" y2="18" />
                    </svg>
                    UPI: ₹{totalUpiRevenue.toLocaleString('en-IN')}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                      <line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                    Card: ₹{totalCardRevenue.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Cashier Performance Cards */}
            {cashierSummary.length > 0 && (
              <div className="cashier-performance-section">
                <div className="section-sub-header">
                  <h4 className="sub-title">Staff & Cashier Counter Performance</h4>
                  <span className="sub-note">Click any cashier to filter sales below</span>
                </div>
                <div className="cashier-cards-grid">
                  {cashierSummary.map((c) => {
                    const isSelected = salesCashierFilter === c.id;
                    return (
                      <div
                        key={c.id}
                        className={`cashier-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSalesCashierFilter(isSelected ? 'all' : c.id)}
                      >
                        <div className="cashier-card__header">
                          <div className="cashier-avatar">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                              <circle cx="12" cy="7" r="4" />
                            </svg>
                          </div>
                          <div>
                            <h5 className="cashier-name">{c.name}</h5>
                            <span className="cashier-meta">{c.counter} · {c.role?.toUpperCase()}</span>
                          </div>
                          <span className={`filter-indicator-badge ${isSelected ? 'active' : ''}`}>
                            {isSelected ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Filtered
                              </span>
                            ) : (
                              'Filter'
                            )}
                          </span>
                        </div>
                        <div className="cashier-card__stats">
                          <div>
                            <span className="lbl">Total Collected:</span>
                            <strong className="amt">₹{c.totalAmount.toLocaleString('en-IN')}</strong>
                          </div>
                          <div>
                            <span className="lbl">Invoices:</span>
                            <strong>{c.billCount}</strong>
                          </div>
                        </div>
                        <div className="cashier-card__footer">
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="2" y="6" width="20" height="12" rx="2" />
                              <circle cx="12" cy="12" r="2" />
                            </svg>
                            ₹{c.cash}
                          </span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                              <line x1="12" y1="18" x2="12.01" y2="18" />
                            </svg>
                            ₹{c.upi}
                          </span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                              <line x1="1" y1="10" x2="23" y2="10" />
                            </svg>
                            ₹{c.card}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Toolbar: Filters & Search */}
            <div className="sales-tab-filters-bar">
              <div className="sales-filter-controls">
                {/* Cashier Filter */}
                <select
                  value={salesCashierFilter}
                  onChange={(e) => setSalesCashierFilter(e.target.value)}
                  className="admin-select-filter"
                >
                  <option value="all">All Cashiers & Attendants</option>
                  {cashierSummary.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.counter})
                    </option>
                  ))}
                </select>

                {/* Channel Filter */}
                <select
                  value={salesSourceFilter}
                  onChange={(e) => setSalesSourceFilter(e.target.value)}
                  className="admin-select-filter"
                >
                  <option value="all">All Channels (Counter + Online)</option>
                  <option value="counter">Counter POS Bills</option>
                  <option value="online">Online Website Orders</option>
                </select>

                {/* Payment Filter */}
                <select
                  value={salesPaymentFilter}
                  onChange={(e) => setSalesPaymentFilter(e.target.value)}
                  className="admin-select-filter"
                >
                  <option value="all">All Payment Methods</option>
                  <option value="cash">Cash Only</option>
                  <option value="upi">UPI QR Only</option>
                  <option value="card">Card Swipe Only</option>
                  <option value="split">Split (Cash + UPI)</option>
                </select>

                {/* Sort By Filter */}
                <select
                  value={salesSortBy}
                  onChange={(e) => setSalesSortBy(e.target.value)}
                  className="admin-select-filter"
                  aria-label="Sort sales records"
                >
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="inv-asc">Invoice No: Low to High</option>
                  <option value="inv-desc">Invoice No: High to Low</option>
                  <option value="amount-desc">Amount: High to Low</option>
                  <option value="amount-asc">Amount: Low to High</option>
                  <option value="customer-asc">Customer Name: A to Z</option>
                </select>
              </div>

              {/* Search Box */}
              <div className="sales-search-wrap">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Search invoice, customer, phone, or cashier..."
                  value={salesSearchTerm}
                  onChange={(e) => setSalesSearchTerm(e.target.value)}
                />
                {salesSearchTerm && (
                  <button type="button" className="clear-btn" onClick={() => setSalesSearchTerm('')} aria-label="Clear Search">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Sales Table Card */}
            <div className="sales-table-card" data-lenis-prevent="true">
              {selectedSalesIds.size > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 18px',
                  background: '#f8fafc',
                  borderBottom: '2px solid #e2e8f0',
                  borderTop: '3px solid #ef4444',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                      ✓ {selectedSalesIds.size} {selectedSalesIds.size === 1 ? 'bill' : 'bills'} selected
                    </span>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      (Total Amount: ₹{filteredSales.filter(s => selectedSalesIds.has(s.id || s.invoiceNumber)).reduce((sum, s) => sum + Number(s.grandTotal || 0), 0).toLocaleString('en-IN')})
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedSalesIds(new Set())}
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        padding: '6px 12px',
                        background: '#fff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        color: '#475569',
                        cursor: 'pointer'
                      }}
                    >
                      Deselect All
                    </button>
                    <button
                      type="button"
                      onClick={handleBulkDeleteSelectedSales}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        fontWeight: 700,
                        padding: '6px 14px',
                        background: '#ef4444',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#fff',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(239, 68, 68, 0.25)'
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                      Delete Selected ({selectedSalesIds.size})
                    </button>
                  </div>
                </div>
              )}
              {filteredSales.length === 0 ? (
                <div className="empty-tab-state">
                  <div className="empty-icon">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z" />
                      <path d="M16 8h-8" />
                      <path d="M16 12h-8" />
                      <path d="M10 16h-2" />
                    </svg>
                  </div>
                  <h3>No Sales Records Found</h3>
                  <p>No billing or invoice records match the current filter selection.</p>
                </div>
              ) : (
                <table className="sales-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isAllFilteredSalesSelected}
                          onChange={handleToggleSelectAllSales}
                          title="Select / Deselect all visible bills"
                          style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#ef4444' }}
                        />
                      </th>
                      <th
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => setSalesSortBy(prev => prev === 'inv-asc' ? 'inv-desc' : 'inv-asc')}
                        title="Click to sort by Invoice No"
                      >
                        Invoice No {salesSortBy === 'inv-asc' ? '▲' : salesSortBy === 'inv-desc' ? '▼' : ''}
                      </th>
                      <th
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => setSalesSortBy(prev => prev === 'date-desc' ? 'date-asc' : 'date-desc')}
                        title="Click to sort by Date & Time"
                      >
                        Date & Time {salesSortBy === 'date-desc' ? '▼' : salesSortBy === 'date-asc' ? '▲' : ''}
                      </th>
                      <th>Channel</th>
                      <th>Billed By / Cashier</th>
                      <th
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => setSalesSortBy(prev => prev === 'customer-asc' ? 'date-desc' : 'customer-asc')}
                        title="Click to sort by Customer"
                      >
                        Customer Details {salesSortBy === 'customer-asc' ? '▲' : ''}
                      </th>
                      <th>Items Sold</th>
                      <th>Payment</th>
                      <th
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => setSalesSortBy(prev => prev === 'amount-desc' ? 'amount-asc' : 'amount-desc')}
                        title="Click to sort by Amount"
                      >
                        Amount {salesSortBy === 'amount-desc' ? '▼' : salesSortBy === 'amount-asc' ? '▲' : ''}
                      </th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedSales.map((sale) => {
                      const saleKey = sale.id || sale.invoiceNumber;
                      const isSelected = selectedSalesIds.has(saleKey);
                      return (
                        <tr key={saleKey} style={{ background: isSelected ? '#fef2f2' : undefined }}>
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectSale(saleKey)}
                              style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#ef4444' }}
                            />
                          </td>
                          <td>
                            <strong>{sale.invoiceNumber}</strong>
                          </td>
                        <td>
                          <div>{sale.orderDate}</div>
                          <small style={{ color: '#64748B' }}>{sale.orderTime}</small>
                        </td>
                        <td>
                          <span className={`source-pill ${sale.source === 'online' ? 'online' : 'counter'}`}>
                            {sale.source === 'online' ? (
                              <>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}>
                                  <circle cx="12" cy="12" r="10" />
                                  <line x1="2" y1="12" x2="22" y2="12" />
                                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                </svg>
                                Online
                              </>
                            ) : (
                              <>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}>
                                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                  <polyline points="9 22 9 12 15 12 15 22" />
                                </svg>
                                Counter POS
                              </>
                            )}
                          </span>
                        </td>
                        <td>
                          {sale.cashier ? (
                            <div className="cashier-cell">
                              <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                  <circle cx="12" cy="7" r="4" />
                                </svg>
                                {sale.cashier.name || sale.cashier.username}
                              </strong>
                              <small>{sale.cashier.counter || 'Counter Desk'}</small>
                            </div>
                          ) : (
                            <span className="cashier-online-tag">
                              {sale.source === 'online' ? (
                                <>
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '3px' }}>
                                    <circle cx="12" cy="12" r="10" />
                                  </svg>
                                  Web System
                                </>
                              ) : (
                                <>
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '3px' }}>
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                  </svg>
                                  Store POS
                                </>
                              )}
                            </span>
                          )}
                        </td>
                        <td>
                          <strong>{sale.customer?.fullName || 'Walk-in Guest'}</strong>
                          {sale.customer?.phone && (
                            <div className="sub-phone" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                              </svg>
                              {sale.customer.phone}
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="table-items-summary">
                            {sale.items?.length || 0} item(s)
                            <small>({sale.items?.map((it) => `${it.name} (${it.weight})`).join(', ')})</small>
                          </div>
                        </td>
                        <td>
                          <span className={`payment-pill ${sale.paymentMethod?.toLowerCase()}`}>
                            {sale.paymentMethod === 'upi' ? (
                              <>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '3px' }}>
                                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                                </svg>
                                UPI
                              </>
                            ) : sale.paymentMethod === 'card' ? (
                              <>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '3px' }}>
                                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                                </svg>
                                Card
                              </>
                            ) : (
                              <>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '3px' }}>
                                  <rect x="2" y="6" width="20" height="12" rx="2" />
                                  <circle cx="12" cy="12" r="2" />
                                </svg>
                                Cash
                              </>
                            )}
                          </span>
                        </td>
                        <td>
                          <strong className="sale-amount">₹{sale.grandTotal}</strong>
                        </td>
                        <td>
                          <span className={`status-tag ${sale.status?.toLowerCase() || 'completed'}`}>
                            {sale.status || sale.orderStatus || 'Completed'}
                          </span>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <div className="table-action-cell">
                            <button
                              type="button"
                              className="btn-view-bill-action"
                              onClick={() => openInvoice(sale)}
                              title="Click to view bill (Print, Edit, Delete options inside)"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                              <span>View Bill</span>
                            </button>
                            <div className="table-row-actions-dropdown">
                              <button
                                type="button"
                                className="btn-row-more-actions"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveActionMenuId(activeActionMenuId === (sale.id || sale.invoiceNumber) ? null : (sale.id || sale.invoiceNumber));
                                }}
                                title="More Options"
                              >
                                •••
                              </button>
                              {activeActionMenuId === (sale.id || sale.invoiceNumber) && (
                                <div className="row-actions-popover" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    className="popover-action-item print"
                                    onClick={() => {
                                      setActiveActionMenuId(null);
                                      openInvoice(sale);
                                    }}
                                  >
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="6 9 6 2 18 2 18 9" />
                                      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                                      <rect x="6" y="14" width="12" height="8" />
                                    </svg>
                                    <span>Print Bill</span>
                                  </button>
                                  <button
                                    type="button"
                                    className="popover-action-item edit"
                                    onClick={() => {
                                      setActiveActionMenuId(null);
                                      setEditBillModalItem(sale);
                                    }}
                                  >
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                    <span>Edit Bill</span>
                                  </button>
                                  <button
                                    type="button"
                                    className="popover-action-item delete"
                                    onClick={() => {
                                      setActiveActionMenuId(null);
                                      setBillToDelete(sale);
                                    }}
                                  >
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="3 6 5 6 21 6" />
                                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    </svg>
                                    <span>Delete Bill</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        )}

        {/* =========================================
            TAB 3: DAILY SALES & REVENUE REPORT
           ========================================= */}
        {activeTab === 'daily-revenue' && (
          <section className="tab-content admin-daily-revenue-tab">
            <DailyRevenueReport
              allSales={allSales}
              onOpenInvoice={openInvoice}
              onRefresh={handleSyncAllSales}
              isCashierOnly={false}
              currentUser={user}
            />
          </section>
        )}

        {/* =========================================
            TAB 4: PRICE OVERRIDE & ACTIVITY AUDIT LOG
           ========================================= */}
        {/* =========================================
            TAB 4: UNIFIED ACTIVITY & AUDIT TRAIL
           ========================================= */}
        {(activeTab === 'activity-logs' || activeTab === 'price-logs') && (
          <section className="tab-content admin-price-logs-tab">
            <div className="tab-header-strip" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <span className="inventory-eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 800, color: '#d4a843', letterSpacing: '0.08em' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 8v4l3 3" />
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                  ADMIN AUDIT TRAIL &amp; COMPLIANCE
                </span>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '4px 0 2px' }}>
                  Store Operations &amp; Activity Audit Log
                </h2>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                  Real-time transparent audit of all counter price adjustments, deleted bills with mandatory reasons, catalog updates, and stock availability toggles.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRefreshActivities}
                disabled={isRefreshingActivities}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#334155',
                  cursor: isRefreshingActivities ? 'wait' : 'pointer'
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ animation: isRefreshingActivities ? 'spin 1s linear infinite' : 'none' }}
                >
                  <polyline points="23 4 23 10 17 10" />
                  <polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
                {isRefreshingActivities ? 'Syncing...' : 'Refresh Logs'}
              </button>
            </div>

            {/* Audit KPIs */}
            <div className="inventory-kpis-grid" style={{ marginBottom: '20px' }}>
              <div className="inv-kpi-card total">
                <span className="kpi-label">Total Activities</span>
                <div className="kpi-val">{(activityLogs?.length || 0) + (priceOverrideLogs?.length || 0)}</div>
                <span className="kpi-sub">Total logged operations</span>
              </div>
              <div className="inv-kpi-card warning">
                <span className="kpi-label">Deleted Bills Logged</span>
                <div className="kpi-val">
                  {activityLogs.filter((a) => a.actionType === 'BILL_DELETED').length}
                </div>
                <span className="kpi-sub">Safeguarded in 30-day bin</span>
              </div>
              <div className="inv-kpi-card ready">
                <span className="kpi-label">Price Overrides Logged</span>
                <div className="kpi-val">{priceOverrideLogs?.length || 0}</div>
                <span className="kpi-sub">Counter price adjustments</span>
              </div>
              <div className="inv-kpi-card total">
                <span className="kpi-label">Catalog Changes</span>
                <div className="kpi-val">
                  {activityLogs.filter((a) => a.actionType?.startsWith('PRODUCT_') || a.actionType === 'STOCK_TOGGLED').length}
                </div>
                <span className="kpi-sub">Stock &amp; price revisions</span>
              </div>
            </div>

            {/* Toolbar: Search & Action Type Filters */}
            <div className="inventory-toolbar" style={{ marginBottom: '16px' }}>
              <div className="inventory-search-box">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-icon-svg">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by invoice, product, staff, or reason..."
                  value={activitySearchTerm}
                  onChange={(e) => setActivitySearchTerm(e.target.value)}
                />
                {activitySearchTerm && (
                  <button type="button" onClick={() => setActivitySearchTerm('')} className="search-clear-btn" style={{ display: 'flex', alignItems: 'center' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="inventory-filter-chips">
                <button
                  type="button"
                  className={`filter-chip ${activityTypeFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setActivityTypeFilter('all')}
                >
                  All ({(activityLogs?.length || 0) + (priceOverrideLogs?.length || 0)})
                </button>
                <button
                  type="button"
                  className={`filter-chip ${activityTypeFilter === 'BILL_DELETED' ? 'active' : ''}`}
                  onClick={() => setActivityTypeFilter('BILL_DELETED')}
                >
                  Bill Deletions ({activityLogs.filter((a) => a.actionType === 'BILL_DELETED').length})
                </button>
                <button
                  type="button"
                  className={`filter-chip ${activityTypeFilter === 'PRICE_OVERRIDE' ? 'active' : ''}`}
                  onClick={() => setActivityTypeFilter('PRICE_OVERRIDE')}
                >
                  Price Overrides ({priceOverrideLogs?.length || 0})
                </button>
                <button
                  type="button"
                  className={`filter-chip ${activityTypeFilter === 'BILL_RESTORED' ? 'active' : ''}`}
                  onClick={() => setActivityTypeFilter('BILL_RESTORED')}
                >
                  Restores
                </button>
                <button
                  type="button"
                  className={`filter-chip ${activityTypeFilter === 'STOCK_TOGGLED' ? 'active' : ''}`}
                  onClick={() => setActivityTypeFilter('STOCK_TOGGLED')}
                >
                  Stock Toggles
                </button>
                <button
                  type="button"
                  className={`filter-chip ${activityTypeFilter === 'PRODUCT_ADDED' ? 'active' : ''}`}
                  onClick={() => setActivityTypeFilter('PRODUCT_ADDED')}
                >
                  Products Added
                </button>
                <button
                  type="button"
                  className={`filter-chip ${activityTypeFilter === 'PRODUCT_PRICE_UPDATED' ? 'active' : ''}`}
                  onClick={() => setActivityTypeFilter('PRODUCT_PRICE_UPDATED')}
                >
                  Master Price Edits
                </button>
              </div>
            </div>

            {/* Activities Table */}
            <div className="inventory-table-wrap">
              {(() => {
                // Merge activityLogs and priceOverrideLogs into one unified timeline
                const mergedList = [];
                (activityLogs || []).forEach((act) => {
                  mergedList.push({
                    ...act,
                    sortTime: act.timestamp || 0,
                  });
                });
                (priceOverrideLogs || []).forEach((ovr) => {
                  const orig = Number(ovr.originalPrice) || 0;
                  const cust = Number(ovr.customPrice) || 0;
                  const diff = cust - orig;
                  mergedList.push({
                    id: ovr.id || `ovr-${ovr.timestamp}`,
                    actionType: 'PRICE_OVERRIDE',
                    performedBy: {
                      id: ovr.cashier?.id || ovr.staffId || 'staff-2',
                      username: ovr.cashier?.username || ovr.staffUsername || 'cashier',
                      name: ovr.cashier?.name || ovr.staffName || 'Counter Cashier',
                      role: ovr.cashier?.role || ovr.staffRole || 'cashier',
                      title: ovr.cashier?.title || 'Counter Cashier',
                    },
                    targetId: ovr.invoiceNumber || 'POS Bill',
                    targetName: `${ovr.productName} (${ovr.weight || 'unit'})`,
                    reason: ovr.reason || 'Staff Price Adjustment',
                    timestamp: ovr.timestamp || Date.now(),
                    dateStr: ovr.dateStr,
                    timeStr: ovr.timeStr,
                    details: {
                      originalPrice: orig,
                      customPrice: cust,
                      difference: diff,
                      invoiceNumber: ovr.invoiceNumber,
                    },
                    sortTime: ovr.timestamp || 0,
                  });
                });

                // Sort newest first
                mergedList.sort((a, b) => b.sortTime - a.sortTime);

                // Apply active filters
                const filtered = mergedList.filter((item) => {
                  if (activityTypeFilter !== 'all' && item.actionType !== activityTypeFilter) return false;
                  if (activitySearchTerm.trim()) {
                    const q = activitySearchTerm.toLowerCase();
                    const matchType = (item.actionType || '').toLowerCase().includes(q);
                    const matchTarget = (item.targetName || item.targetId || '').toLowerCase().includes(q);
                    const matchReason = (item.reason || '').toLowerCase().includes(q);
                    const matchStaff = (item.performedBy?.name || '').toLowerCase().includes(q);
                    if (!matchType && !matchTarget && !matchReason && !matchStaff) return false;
                  }
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '48px 24px', color: '#64748b' }}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 12px' }}>
                        <path d="M12 8v4l3 3" />
                        <circle cx="12" cy="12" r="9" />
                      </svg>
                      <h3 style={{ fontSize: '16px', color: '#1e293b', margin: '0 0 4px' }}>No Activity Records Found</h3>
                      <p style={{ fontSize: '13px', margin: 0 }}>
                        Staff operations, bill deletions, and price overrides are logged here automatically in real time.
                      </p>
                    </div>
                  );
                }

                return (
                  <table className="inventory-table activity-audit-table">
                    <thead>
                      <tr>
                        <th className="col-audit-idx">#</th>
                        <th className="col-audit-time">Time &amp; Date</th>
                        <th className="col-audit-type">Activity Type</th>
                        <th className="col-audit-staff">Staff / User ID</th>
                        <th className="col-audit-target">Target Item / Invoice</th>
                        <th className="col-audit-impact">Impact / Difference</th>
                        <th className="col-audit-reason">Stated Reason &amp; Justification</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((item, idx) => {
                        const dateStr = item.timestamp
                          ? new Date(item.timestamp).toLocaleString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                            })
                          : 'Recent';

                        return (
                          <tr key={item.id || idx}>
                            <td className="cell-audit-index">
                              <span className="audit-num-badge">#{idx + 1}</span>
                            </td>
                            <td className="cell-audit-time">
                              <span className="audit-timestamp">{dateStr}</span>
                            </td>
                            <td className="cell-audit-type">
                              <span className={`audit-type-pill ${item.actionType}`}>
                                {item.actionType?.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="cell-audit-staff">
                              <div className="audit-staff-cell">
                                <span className="audit-staff-name">
                                  {item.performedBy?.name || 'Staff User'}
                                </span>
                                <div className="audit-staff-meta">
                                  <span className={`audit-role-tag role-${item.performedBy?.role || 'staff'}`}>
                                    {item.performedBy?.role === 'admin' ? 'ADMINISTRATOR' : 'CASHIER'}
                                  </span>
                                  {(item.performedBy?.id || item.performedBy?.username) && (
                                    <span className="audit-id-tag">
                                      ID: {item.performedBy?.id || item.performedBy?.username}
                                      {item.performedBy?.username && item.performedBy?.username !== item.performedBy?.id ? ` (@${item.performedBy.username})` : ''}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="cell-audit-target">
                              <div className="audit-target-cell">
                                <strong className="audit-target-title">
                                  {item.targetName || item.targetId}
                                </strong>
                                {item.targetId && item.targetName !== item.targetId && (
                                  <span className="audit-target-ref">
                                    Ref: {item.targetId}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="cell-audit-impact">
                              {item.actionType === 'PRICE_OVERRIDE' ? (
                                <span
                                  style={{
                                    display: 'inline-block',
                                    padding: '4px 9px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    whiteSpace: 'nowrap',
                                    background: (item.details?.difference || 0) < 0 ? '#dcfce7' : (item.details?.difference || 0) > 0 ? '#fef3c7' : '#f1f5f9',
                                    color: (item.details?.difference || 0) < 0 ? '#15803d' : (item.details?.difference || 0) > 0 ? '#b45309' : '#64748b',
                                    border: (item.details?.difference || 0) < 0 ? '1px solid #86efac' : '1px solid #fde68a',
                                  }}
                                >
                                  {(item.details?.difference || 0) < 0
                                    ? `− ₹${Math.abs(item.details.difference)} Discount`
                                    : (item.details?.difference || 0) > 0
                                    ? `+ ₹${item.details.difference} Markup`
                                    : 'Standard'}
                                </span>
                              ) : item.actionType === 'BILL_DELETED' ? (
                                <span style={{ color: '#dc2626', fontWeight: 700, fontSize: '12px', whiteSpace: 'nowrap' }}>
                                  ₹{item.details?.grandTotal || 0} Expunged
                                </span>
                              ) : item.actionType === 'BILL_RESTORED' ? (
                                <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '12px', whiteSpace: 'nowrap' }}>
                                  ₹{item.details?.grandTotal || 0} Re-activated
                                </span>
                              ) : item.actionType === 'STOCK_TOGGLED' ? (
                                <span className={`audit-impact-badge ${item.details?.isInactive ? 'inactive-stock' : 'active-stock'}`}>
                                  {item.details?.isInactive ? 'Marked Out of Stock' : 'Reactivated In Stock'}
                                </span>
                              ) : item.actionType === 'PRODUCT_PRICE_UPDATED' ? (
                                <span style={{ fontSize: '12px', fontWeight: 600, color: '#6d28d9', whiteSpace: 'nowrap' }}>
                                  ₹{item.details?.oldPrice} → ₹{item.details?.newPrice}
                                </span>
                              ) : (
                                <span style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                                  Recorded
                                </span>
                              )}
                            </td>
                            <td className="cell-audit-reason">
                              <span className="audit-reason-text">
                                {item.reason || 'Operational action'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          </section>
        )}

        {/* =========================================
            TAB 5: RECYCLE BIN (30 DAYS RETENTION)
           ========================================= */}
        {activeTab === 'recycle-bin' && (
          <section className="tab-content admin-recycle-tab">
            <div className="inventory-header-strip recycle-header-strip">
              <div>
                <span className="inventory-eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 800, color: '#dc2626', letterSpacing: '0.08em' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  30-DAY RECOVERY GUARANTEE
                </span>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '4px 0 2px' }}>
                  Recycle Bin (Invoices &amp; Products)
                </h2>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                  Items deleted from POS Counter or Catalog are safely stored here for 30 days. You can restore them anytime or permanently purge them.
                </p>
              </div>

              <button
                type="button"
                className="btn-refresh-recycle"
                onClick={handleRefreshRecycle}
                disabled={isRefreshingRecycle}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ animation: isRefreshingRecycle ? 'spin 1s linear infinite' : 'none' }}
                >
                  <polyline points="23 4 23 10 17 10" />
                  <polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
                {isRefreshingRecycle ? 'Syncing...' : 'Refresh Recycle Bin'}
              </button>
            </div>

            {/* Recycle Bin KPIs */}
            <div className="inventory-kpis-grid recycle-kpis-grid" style={{ marginBottom: '20px' }}>
              <div className="inv-kpi-card warning">
                <span className="kpi-label">Invoices in Bin</span>
                <div className="kpi-val">{recycleBinBills.length}</div>
                <span className="kpi-sub">Preserved for 30 days</span>
              </div>
              <div className="inv-kpi-card ready">
                <span className="kpi-label">Products in Bin</span>
                <div className="kpi-val" style={{ color: '#0284c7' }}>{recycleBinProducts.length}</div>
                <span className="kpi-sub">Recoverable to Catalog</span>
              </div>
              <div className="inv-kpi-card total">
                <span className="kpi-label">Safeguarded Value</span>
                <div className="kpi-val">
                  ₹{recycleBinBills.reduce((sum, b) => sum + (b.billData?.grandTotal || 0), 0).toLocaleString('en-IN')}
                </div>
                <span className="kpi-sub">Total revenue of deleted bills</span>
              </div>
            </div>

            {/* Sub-Tab Selector: Invoices vs Products */}
            <div className="recycle-subtabs-bar">
              <button
                type="button"
                className={`recycle-subtab-btn ${recycleBinTab === 'bills' ? 'active' : ''}`}
                onClick={() => setRecycleBinTab('bills')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                Deleted Invoices ({recycleBinBills.length})
              </button>

              <button
                type="button"
                className={`recycle-subtab-btn ${recycleBinTab === 'products' ? 'active' : ''}`}
                onClick={() => setRecycleBinTab('products')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                </svg>
                Deleted Products ({recycleBinProducts.length})
              </button>
            </div>

            {/* Search Bar */}
            <div className="inventory-filter-bar recycle-filter-bar">
              <div className="inventory-search-wrap">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder={
                    recycleBinTab === 'bills'
                      ? 'Search deleted bill by invoice, cashier, customer, or reason...'
                      : 'Search deleted product by name, category, or reason...'
                  }
                  value={recycleSearchTerm}
                  onChange={(e) => setRecycleSearchTerm(e.target.value)}
                />
                {recycleSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setRecycleSearchTerm('')}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Table Wrap */}
            <div className="inventory-table-wrap recycle-table-wrap">
              {recycleBinTab === 'bills' ? (
                /* DELETED BILLS TABLE */
                filteredRecycleBills.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 24px', color: '#64748b' }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 12px' }}>
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    <h3 style={{ fontSize: '16px', color: '#1e293b', margin: '0 0 4px' }}>No Invoices in Recycle Bin</h3>
                    <p style={{ fontSize: '13px', margin: 0 }}>
                      No bills have been deleted in the past 30 days. Deleted invoices are preserved here for recovery.
                    </p>
                  </div>
                ) : (
                  <>
                    {selectedRecycleBillIds.size > 0 && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 18px',
                        background: '#f8fafc',
                        borderBottom: '2px solid #e2e8f0',
                        borderTop: '3px solid #dc2626',
                        flexWrap: 'wrap',
                        gap: '10px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                            ✓ {selectedRecycleBillIds.size} {selectedRecycleBillIds.size === 1 ? 'invoice' : 'invoices'} selected
                          </span>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>
                            (Total Amount: ₹{filteredRecycleBills.filter(b => selectedRecycleBillIds.has(b.id || b.invoiceNumber)).reduce((sum, b) => sum + Number(b.billData?.grandTotal || 0), 0).toLocaleString('en-IN')})
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedRecycleBillIds(new Set())}
                            style={{
                              fontSize: '12px',
                              fontWeight: 600,
                              padding: '6px 12px',
                              background: '#fff',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              color: '#475569',
                              cursor: 'pointer'
                            }}
                          >
                            Deselect All
                          </button>
                          <button
                            type="button"
                            onClick={handleBulkRestoreSelectedBills}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '12px',
                              fontWeight: 700,
                              padding: '6px 14px',
                              background: '#16a34a',
                              border: 'none',
                              borderRadius: '6px',
                              color: '#fff',
                              cursor: 'pointer',
                              boxShadow: '0 2px 4px rgba(22, 163, 74, 0.25)'
                            }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="1 4 1 10 7 10" />
                              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                            </svg>
                            Restore Selected ({selectedRecycleBillIds.size})
                          </button>
                          <button
                            type="button"
                            onClick={handleBulkPurgeSelectedBills}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '12px',
                              fontWeight: 700,
                              padding: '6px 14px',
                              background: '#dc2626',
                              border: 'none',
                              borderRadius: '6px',
                              color: '#fff',
                              cursor: 'pointer',
                              boxShadow: '0 2px 4px rgba(220, 38, 38, 0.25)'
                            }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                            Delete Selected ({selectedRecycleBillIds.size})
                          </button>
                        </div>
                      </div>
                    )}
                    <table className="inventory-table recycle-table">
                      <thead>
                        <tr>
                          <th style={{ width: '40px', textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={isAllFilteredRecycleBillsSelected}
                              onChange={handleToggleSelectAllRecycleBills}
                              title="Select / Deselect all visible invoices"
                              style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#dc2626' }}
                            />
                          </th>
                          <th>Invoice No</th>
                          <th>Deleted On</th>
                          <th>30-Day Expiry</th>
                          <th>Cashier / Deleted By</th>
                          <th>Mandatory Reason</th>
                          <th>Customer &amp; Items</th>
                          <th>Amount</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRecycleBills.map((b) => {
                          const billKey = b.id || b.invoiceNumber;
                          const isSelected = selectedRecycleBillIds.has(billKey);
                          const now = Date.now();
                          const expiryTime = b.expiresAt || (b.deletedAt + 30 * 24 * 60 * 60 * 1000);
                          const daysLeft = Math.max(0, Math.ceil((expiryTime - now) / (24 * 60 * 60 * 1000)));

                          const delDateStr = b.deletedAt
                            ? new Date(b.deletedAt).toLocaleString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Recent';

                          return (
                            <tr key={billKey} style={{ background: isSelected ? '#fef2f2' : undefined }}>
                              <td style={{ textAlign: 'center' }}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleSelectRecycleBill(billKey)}
                                  style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#dc2626' }}
                                />
                              </td>
                              <td>
                                <strong style={{ fontSize: '13px', color: '#0284c7' }}>
                                  {b.invoiceNumber}
                                </strong>
                              </td>
                              <td>
                                <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                                  {delDateStr}
                                </span>
                              </td>
                              <td>
                                <span className={`recycle-expiry-pill ${daysLeft <= 3 ? 'warning' : 'safe'}`}>
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                  </svg>
                                  {daysLeft === 0 ? 'Purges Today' : `${daysLeft} days left`}
                                </span>
                              </td>
                              <td>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                                  {b.deletedBy?.name || 'Staff'}
                                </span>
                                {b.deletedBy?.role && (
                                  <span style={{ display: 'block', fontSize: '10px', color: '#64748b' }}>
                                    {b.deletedBy.role?.toUpperCase()}
                                  </span>
                                )}
                              </td>
                              <td>
                                <span className="deletion-reason-badge">
                                  {b.deletionReason || 'Cancelled by staff'}
                                </span>
                              </td>
                              <td>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                                  {b.billData?.customer?.fullName || 'Walk-in Guest'}
                                  {b.billData?.customer?.phone && (
                                    <span style={{ display: 'block', fontSize: '11px', color: '#64748b', fontWeight: 400 }}>
                                      +91 {b.billData.customer.phone}
                                    </span>
                                  )}
                                  <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                                    {b.billData?.items?.length || 0} item(s) sold
                                  </span>
                                </div>
                              </td>
                              <td>
                                <strong style={{ fontSize: '14px', color: '#0f172a' }}>
                                  ₹{b.billData?.grandTotal || 0}
                                </strong>
                              </td>
                              <td className="recycle-action-cell">
                                <div className="recycle-action-buttons">
                                  <button
                                    type="button"
                                    className="btn-restore-bill"
                                    onClick={() => setBillToRestore(b)}
                                    title="Restore bill back to active sales"
                                  >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="1 4 1 10 7 10" />
                                      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                                    </svg>
                                    Restore Bill
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-purge-bill"
                                    onClick={() => setBillToPurge(b)}
                                    title="Permanently delete from database"
                                  >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <line x1="18" y1="6" x2="6" y2="18" />
                                      <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                    Purge
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </>
                )
              ) : (
                /* DELETED PRODUCTS TABLE */
                filteredRecycleProducts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 24px', color: '#64748b' }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 12px' }}>
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    </svg>
                    <h3 style={{ fontSize: '16px', color: '#1e293b', margin: '0 0 4px' }}>No Products in Recycle Bin</h3>
                    <p style={{ fontSize: '13px', margin: 0 }}>
                      When products are deleted from the inventory catalog, they are held here for 30 days before permanent expungement.
                    </p>
                  </div>
                ) : (
                  <>
                    {selectedRecycleProductIds.size > 0 && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 18px',
                        background: '#f8fafc',
                        borderBottom: '2px solid #e2e8f0',
                        borderTop: '3px solid #dc2626',
                        flexWrap: 'wrap',
                        gap: '10px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                            ✓ {selectedRecycleProductIds.size} {selectedRecycleProductIds.size === 1 ? 'product' : 'products'} selected
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedRecycleProductIds(new Set())}
                            style={{
                              fontSize: '12px',
                              fontWeight: 600,
                              padding: '6px 12px',
                              background: '#fff',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              color: '#475569',
                              cursor: 'pointer'
                            }}
                          >
                            Deselect All
                          </button>
                          <button
                            type="button"
                            onClick={handleBulkRestoreSelectedProducts}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '12px',
                              fontWeight: 700,
                              padding: '6px 14px',
                              background: '#16a34a',
                              border: 'none',
                              borderRadius: '6px',
                              color: '#fff',
                              cursor: 'pointer',
                              boxShadow: '0 2px 4px rgba(22, 163, 74, 0.25)'
                            }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="1 4 1 10 7 10" />
                              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                            </svg>
                            Restore Selected ({selectedRecycleProductIds.size})
                          </button>
                          <button
                            type="button"
                            onClick={handleBulkPurgeSelectedProducts}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '12px',
                              fontWeight: 700,
                              padding: '6px 14px',
                              background: '#dc2626',
                              border: 'none',
                              borderRadius: '6px',
                              color: '#fff',
                              cursor: 'pointer',
                              boxShadow: '0 2px 4px rgba(220, 38, 38, 0.25)'
                            }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                            Delete Selected ({selectedRecycleProductIds.size})
                          </button>
                        </div>
                      </div>
                    )}
                    <table className="inventory-table recycle-table">
                      <thead>
                        <tr>
                          <th style={{ width: '40px', textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={isAllFilteredRecycleProductsSelected}
                              onChange={handleToggleSelectAllRecycleProducts}
                              title="Select / Deselect all visible products"
                              style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#dc2626' }}
                            />
                          </th>
                          <th>Product Info</th>
                          <th>Category &amp; Unit</th>
                          <th>Price &amp; Stock</th>
                          <th>Deleted On</th>
                          <th>30-Day Expiry</th>
                          <th>Deleted By</th>
                          <th>Reason</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRecycleProducts.map((p) => {
                          const isSelected = selectedRecycleProductIds.has(p.id);
                          const now = Date.now();
                          const expiryTime = p.expiresAt || (p.deletedAt + 30 * 24 * 60 * 60 * 1000);
                          const daysLeft = Math.max(0, Math.ceil((expiryTime - now) / (24 * 60 * 60 * 1000)));

                          const delDateStr = p.deletedAt
                            ? new Date(p.deletedAt).toLocaleString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Recent';

                          const prodPrice = p.productData?.price || p.price || 0;
                          const prodUnit = p.productData?.unit || p.unit || 'kg';
                          const prodCategory = p.productData?.category || p.category || 'sweets';

                          return (
                            <tr key={p.id} style={{ background: isSelected ? '#fef2f2' : undefined }}>
                              <td style={{ textAlign: 'center' }}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleSelectRecycleProduct(p.id)}
                                  style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#dc2626' }}
                                />
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', overflow: 'hidden' }}>
                                    {p.productData?.image ? (
                                      <img src={p.productData.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
                                    ) : (
                                      '🍬'
                                    )}
                                  </div>
                                  <div>
                                    <strong style={{ fontSize: '13px', color: '#0f172a' }}>
                                      {p.englishName || p.name}
                                    </strong>
                                    {p.tamilName && (
                                      <span style={{ display: 'block', fontSize: '11px', color: '#b45309' }}>
                                        {p.tamilName}
                                      </span>
                                    )}
                                    <span style={{ display: 'inline-block', fontSize: '10px', color: '#64748b', background: '#f1f5f9', padding: '1px 5px', borderRadius: '4px', marginTop: '2px' }}>
                                      ID: {p.id}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155', textTransform: 'capitalize' }}>
                                  {prodCategory}
                                </span>
                                <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>
                                  Per {prodUnit}
                                </span>
                              </td>
                              <td>
                                <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>
                                  ₹{prodPrice}
                                </strong>
                                <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>
                                  Stock: {p.productData?.stockKg ?? '0'} {prodUnit}
                                </span>
                              </td>
                              <td>
                                <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                                  {delDateStr}
                                </span>
                              </td>
                              <td>
                                <span className={`recycle-expiry-pill ${daysLeft <= 3 ? 'warning' : 'safe'}`}>
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                  </svg>
                                  {daysLeft === 0 ? 'Purges Today' : `${daysLeft} days left`}
                                </span>
                              </td>
                              <td>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                                  {p.deletedBy?.name || 'Staff'}
                                </span>
                                {p.deletedBy?.role && (
                                  <span style={{ display: 'block', fontSize: '10px', color: '#64748b' }}>
                                    {p.deletedBy.role?.toUpperCase()}
                                  </span>
                                )}
                              </td>
                              <td>
                                <span className="deletion-reason-badge">
                                  {p.deletionReason || 'Removed from catalog'}
                                </span>
                              </td>
                              <td className="recycle-action-cell">
                                <div className="recycle-action-buttons">
                                  <button
                                    type="button"
                                    className="btn-restore-bill"
                                    onClick={() => setProductToRestore(p)}
                                    title="Restore product back to active catalog"
                                  >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="1 4 1 10 7 10" />
                                      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                                    </svg>
                                    Restore Product
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-purge-bill"
                                    onClick={() => setProductToPurge(p)}
                                    title="Permanently expunge product"
                                  >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <line x1="18" y1="6" x2="6" y2="18" />
                                      <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                    Purge
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </>
                )
              )}
            </div>
          </section>
        )}

        {/* =========================================
            TAB 6: STAFF ACCOUNT MANAGEMENT
           ========================================= */}
        {activeTab === 'staff' && (
          <StaffManagement currentUser={user} />
        )}

        {/* Delete Bill Modal (Triggered from Sales Table) */}
        <DeleteBillModal
          isOpen={Boolean(billToDelete)}
          bill={billToDelete}
          onClose={() => setBillToDelete(null)}
          onConfirmDelete={async (targetBill, reason) => {
            try {
              if (Array.isArray(targetBill)) {
                const ids = targetBill.map((b) => b.id || b.invoiceNumber);
                await deleteBills(ids, reason, user);
                setSelectedSalesIds(new Set());
              } else {
                await deleteBill(
                  targetBill.id || targetBill.invoiceNumber,
                  reason,
                  user
                );
                setSelectedSalesIds((prev) => {
                  const next = new Set(prev);
                  next.delete(targetBill.id || targetBill.invoiceNumber);
                  return next;
                });
              }
              setBillToDelete(null);
            } catch (err) {
              alert(err?.message || 'Delete failed. Please try again.');
            }
          }}
          user={user}
        />

        {/* Inline Product Edit Modal */}
        {editingPriceProduct && (
          <div className="admin-modal-overlay" onClick={() => setEditingPriceProduct(null)}>
            <div className="admin-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
              <div className="admin-modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eef2ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                    </svg>
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>Edit Product</h4>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Update product name, category, unit, and price</span>
                  </div>
                </div>
                <button type="button" className="admin-modal-close" onClick={() => setEditingPriceProduct(null)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const cleanedName = productEditForm.nameEn.trim();
                  const nameTa = productEditForm.nameTa.trim();
                  const finalName = nameTa ? `${cleanedName} — ${nameTa}` : cleanedName;

                  if (!cleanedName) return;

                  await updateProductDetails(editingPriceProduct.id, {
                    name: finalName,
                    englishName: cleanedName,
                    tamilName: nameTa,
                    category: productEditForm.category,
                    unit: productEditForm.unit,
                    price: productEditForm.price,
                  }, user);
                  setEditingPriceProduct(null);
                }}
                style={{ padding: '20px 24px' }}
              >
                <div style={{ display: 'grid', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Product Name (English)
                    </label>
                    <input
                      type="text"
                      value={productEditForm.nameEn}
                      onChange={async (e) => {
                        const val = e.target.value;
                        setProductEditForm((prev) => ({ ...prev, nameEn: val }));
                        if (!productEditForm.nameTa.trim() && val.trim()) {
                          const ta = await translateToTamil(val);
                          if (ta) setProductEditForm((prev) => ({ ...prev, nameTa: ta }));
                        }
                      }}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                        Product Name (Tamil)
                      </label>
                      <button
                        type="button"
                        onClick={async () => {
                          if (productEditForm.nameEn.trim()) {
                            const ta = await translateToTamil(productEditForm.nameEn);
                            if (ta) setProductEditForm((prev) => ({ ...prev, nameTa: ta }));
                          }
                        }}
                        style={{ fontSize: '11px', color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                      >
                        ⚡ Translate from English
                      </button>
                    </div>
                    <input
                      type="text"
                      value={productEditForm.nameTa}
                      onChange={(e) => setProductEditForm((prev) => ({ ...prev, nameTa: e.target.value }))}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        Category
                      </label>
                      <select
                        value={productEditForm.category}
                        onChange={(e) => setProductEditForm((prev) => ({ ...prev, category: e.target.value }))}
                        style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#fff' }}
                      >
                        <option value="sweets">Sweets</option>
                        <option value="beverages">Beverages</option>
                        <option value="spices">Spices</option>
                        <option value="halwa">Halwa</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        Unit
                      </label>
                      <select
                        value={productEditForm.unit}
                        onChange={(e) => setProductEditForm((prev) => ({ ...prev, unit: e.target.value }))}
                        style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#fff' }}
                      >
                        <option value="kg">kg</option>
                        <option value="Litre">Litre</option>
                        <option value="1 Cup">1 Cup</option>
                        <option value="1 Pc">1 Pc</option>
                        <option value="1 Pkt">1 Pkt</option>
                        <option value="Bottle">Bottle</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Selling Price (₹)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="1"
                      required
                      value={productEditForm.price}
                      onChange={(e) => setProductEditForm((prev) => ({ ...prev, price: e.target.value }))}
                      style={{ width: '100%', padding: '10px 12px', fontSize: '16px', fontWeight: 800, color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                  <button
                    type="button"
                    onClick={() => setEditingPriceProduct(null)}
                    style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#0f172a', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Save Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirm Delete Product Modal */}
        {deletingProduct && (
          <div className="admin-modal-overlay" onClick={() => setDeletingProduct(null)}>
            <div className="admin-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
              <div className="admin-modal-header" style={{ background: '#fff5f5', borderBottomColor: '#fecaca' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#991b1b' }}>Delete Product from Catalog</h4>
                    <span style={{ fontSize: '11px', color: '#dc2626' }}>This will remove the product from POS Counter billing</span>
                  </div>
                </div>
                <button type="button" className="admin-modal-close" onClick={() => setDeletingProduct(null)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <div style={{ padding: '20px 24px' }}>
                <p style={{ fontSize: '14px', color: '#334155', margin: '0 0 16px' }}>
                  Are you sure you want to delete <strong>{deletingProduct.name}</strong>?
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setDeletingProduct(null)}
                    style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await deleteProduct(deletingProduct.id, user, 'Product removed by Administrator');
                        setDeletingProduct(null);
                      } catch (err) {
                        alert(err?.message || 'Failed to delete product.');
                      }
                    }}
                    style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#dc2626', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Delete Product
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Restore Bill Modal */}
        {billToRestore && (
          <div className="admin-modal-overlay" onClick={() => !recycleActionLoading.isRunning && setBillToRestore(null)}>
            <div className="admin-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
              <div className="admin-modal-header" style={{ background: '#f0fdf4', borderBottomColor: '#bbf7d0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="1 4 1 10 7 10" />
                      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                    </svg>
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#166534' }}>
                      {Array.isArray(billToRestore) ? `Restore ${billToRestore.length} Invoices` : 'Restore Deleted Invoice'}
                    </h4>
                    <span style={{ fontSize: '11px', color: '#15803d' }}>
                      {Array.isArray(billToRestore) ? `${billToRestore.length} invoices will return to active sales` : `Invoice #${billToRestore.invoiceNumber} will return to active sales`}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="admin-modal-close"
                  disabled={recycleActionLoading.isRunning}
                  onClick={() => !recycleActionLoading.isRunning && setBillToRestore(null)}
                  style={{ opacity: recycleActionLoading.isRunning ? 0.4 : 1, cursor: recycleActionLoading.isRunning ? 'not-allowed' : 'pointer' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <div style={{ padding: '20px 24px' }}>
                <p style={{ fontSize: '13px', color: '#334155', margin: '0 0 12px', lineHeight: 1.5 }}>
                  {Array.isArray(billToRestore) ? (
                    <>
                      This will restore <strong>{billToRestore.length} selected invoices</strong> (Total Amount: <strong>₹{billToRestore.reduce((sum, b) => sum + Number(b.billData?.grandTotal || 0), 0).toLocaleString('en-IN')}</strong>) back to active sales, POS shift bills, and daily revenue reports.
                    </>
                  ) : (
                    <>
                      This will restore invoice <strong>#{billToRestore.invoiceNumber}</strong> (Amount: <strong>₹{billToRestore.billData?.grandTotal}</strong>) back to active sales, POS shift bills, and daily revenue reports.
                    </>
                  )}
                </p>
                {!Array.isArray(billToRestore) && (
                  <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', marginBottom: '18px' }}>
                    <span style={{ color: '#64748b' }}>Original Deletion Reason: </span>
                    <strong style={{ color: '#0f172a' }}>{billToRestore.deletionReason}</strong>
                  </div>
                )}

                {recycleActionLoading.isRunning && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '11px 14px',
                    background: '#f0fdf4',
                    border: '1.5px solid #86efac',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    color: '#15803d',
                    fontSize: '13px',
                    fontWeight: 700,
                  }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2.5px solid #16a34a',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                      flexShrink: 0,
                    }} />
                    <span>{recycleActionLoading.message || 'Restoring invoices... Please wait'}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    disabled={recycleActionLoading.isRunning}
                    onClick={() => setBillToRestore(null)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#fff',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: recycleActionLoading.isRunning ? 'not-allowed' : 'pointer',
                      opacity: recycleActionLoading.isRunning ? 0.5 : 1,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={recycleActionLoading.isRunning}
                    onClick={async () => {
                      try {
                        const totalCount = Array.isArray(billToRestore) ? billToRestore.length : 1;
                        setRecycleActionLoading({
                          isRunning: true,
                          message: Array.isArray(billToRestore) ? `Restoring ${totalCount} invoices...` : 'Restoring invoice...',
                          current: 0,
                          total: totalCount,
                        });
                        if (Array.isArray(billToRestore)) {
                          const ids = billToRestore.map((b) => b.id || b.invoiceNumber);
                          await restoreBills(ids, user, (cur, tot, msg) => {
                            setRecycleActionLoading({ isRunning: true, message: msg, current: cur, total: tot });
                          });
                          setSelectedRecycleBillIds(new Set());
                        } else {
                          await restoreBill(billToRestore.id || billToRestore.invoiceNumber, user);
                          setSelectedRecycleBillIds((prev) => {
                            const next = new Set(prev);
                            next.delete(billToRestore.id || billToRestore.invoiceNumber);
                            return next;
                          });
                        }
                        setBillToRestore(null);
                      } catch (err) {
                        alert(err?.message || 'Restore failed. Please try again.');
                      } finally {
                        setRecycleActionLoading({ isRunning: false, message: '', current: 0, total: 0 });
                      }
                    }}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '8px',
                      border: 'none',
                      background: recycleActionLoading.isRunning ? '#4ade80' : '#16a34a',
                      color: '#fff',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: recycleActionLoading.isRunning ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    {recycleActionLoading.isRunning && (
                      <div style={{
                        width: '14px',
                        height: '14px',
                        border: '2px solid #ffffff',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                      }} />
                    )}
                    {recycleActionLoading.isRunning ? (recycleActionLoading.message || 'Restoring...') : 'Confirm Restore'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Permanent Purge Modal */}
        {billToPurge && (
          <div className="admin-modal-overlay" onClick={() => !recycleActionLoading.isRunning && setBillToPurge(null)}>
            <div className="admin-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
              <div className="admin-modal-header" style={{ background: '#450a0a', borderBottomColor: '#7f1d1d' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#7f1d1d', color: '#fca5a5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#fef2f2' }}>
                      {Array.isArray(billToPurge) ? `Permanently Purge ${billToPurge.length} Invoices` : 'Permanently Purge Invoice'}
                    </h4>
                    <span style={{ fontSize: '11px', color: '#fca5a5' }}>Permanent deletion cannot be undone</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="admin-modal-close"
                  disabled={recycleActionLoading.isRunning}
                  onClick={() => !recycleActionLoading.isRunning && setBillToPurge(null)}
                  style={{ background: '#7f1d1d', color: '#fecaca', opacity: recycleActionLoading.isRunning ? 0.4 : 1, cursor: recycleActionLoading.isRunning ? 'not-allowed' : 'pointer' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <div style={{ padding: '20px 24px' }}>
                <p style={{ fontSize: '13px', color: '#334155', margin: '0 0 16px', lineHeight: 1.5 }}>
                  {Array.isArray(billToPurge) ? (
                    <>
                      Are you sure you want to permanently purge <strong>{billToPurge.length} selected invoices</strong> (Total Amount: <strong>₹{billToPurge.reduce((sum, b) => sum + Number(b.billData?.grandTotal || 0), 0).toLocaleString('en-IN')}</strong>)? They will be permanently removed from the 30-day recycle bin and cannot be restored again.
                    </>
                  ) : (
                    <>
                      Are you sure you want to permanently purge invoice <strong>#{billToPurge.invoiceNumber}</strong>? It will be permanently removed from the 30-day recycle bin and cannot be restored again.
                    </>
                  )}
                </p>

                {recycleActionLoading.isRunning && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 14px',
                    background: '#fff1f2',
                    border: '1.5px solid #fecdd3',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    color: '#9f1239',
                    fontSize: '13px',
                    fontWeight: 700,
                  }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2.5px solid #e11d48',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                      flexShrink: 0,
                    }} />
                    <span>{recycleActionLoading.message || 'Deleting invoices... Please wait'}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    disabled={recycleActionLoading.isRunning}
                    onClick={() => setBillToPurge(null)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#fff',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: recycleActionLoading.isRunning ? 'not-allowed' : 'pointer',
                      opacity: recycleActionLoading.isRunning ? 0.5 : 1,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={recycleActionLoading.isRunning}
                    onClick={async () => {
                      try {
                        const totalCount = Array.isArray(billToPurge) ? billToPurge.length : 1;
                        setRecycleActionLoading({
                          isRunning: true,
                          message: Array.isArray(billToPurge) ? `Deleting ${totalCount} invoices...` : 'Deleting invoice...',
                          current: 0,
                          total: totalCount,
                        });
                        if (Array.isArray(billToPurge)) {
                          const ids = billToPurge.map((b) => b.id || b.invoiceNumber);
                          await permanentDeleteBills(ids, user, (cur, tot, msg) => {
                            setRecycleActionLoading({ isRunning: true, message: msg, current: cur, total: tot });
                          });
                          setSelectedRecycleBillIds(new Set());
                        } else {
                          await permanentDeleteBill(billToPurge.id || billToPurge.invoiceNumber, user);
                          setSelectedRecycleBillIds((prev) => {
                            const next = new Set(prev);
                            next.delete(billToPurge.id || billToPurge.invoiceNumber);
                            return next;
                          });
                        }
                        setBillToPurge(null);
                      } catch (err) {
                        alert(err?.message || 'Purge failed. Please try again.');
                      } finally {
                        setRecycleActionLoading({ isRunning: false, message: '', current: 0, total: 0 });
                      }
                    }}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '8px',
                      border: 'none',
                      background: recycleActionLoading.isRunning ? '#b91c1c' : '#991b1b',
                      color: '#fff',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: recycleActionLoading.isRunning ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    {recycleActionLoading.isRunning && (
                      <div style={{
                        width: '14px',
                        height: '14px',
                        border: '2px solid #ffffff',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                      }} />
                    )}
                    {recycleActionLoading.isRunning ? (recycleActionLoading.message || 'Deleting...') : 'Purge Permanently'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Restore Product Modal */}
        {productToRestore && (
          <div className="admin-modal-overlay" onClick={() => !recycleActionLoading.isRunning && setProductToRestore(null)}>
            <div className="admin-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
              <div className="admin-modal-header" style={{ background: '#f0fdf4', borderBottomColor: '#bbf7d0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="1 4 1 10 7 10" />
                      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                    </svg>
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#166534' }}>
                      {Array.isArray(productToRestore) ? `Restore ${productToRestore.length} Products` : 'Restore Product'}
                    </h4>
                    <span style={{ fontSize: '11px', color: '#15803d' }}>Returns product(s) back to inventory catalog</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="admin-modal-close"
                  disabled={recycleActionLoading.isRunning}
                  onClick={() => !recycleActionLoading.isRunning && setProductToRestore(null)}
                  style={{ opacity: recycleActionLoading.isRunning ? 0.4 : 1, cursor: recycleActionLoading.isRunning ? 'not-allowed' : 'pointer' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <div style={{ padding: '20px 24px' }}>
                <p style={{ fontSize: '13.5px', color: '#334155', margin: '0 0 12px', lineHeight: 1.5 }}>
                  {Array.isArray(productToRestore) ? (
                    <>Are you sure you want to restore <strong>{productToRestore.length} selected products</strong> back to the active catalog and POS billing counter?</>
                  ) : (
                    <>Are you sure you want to restore <strong>{productToRestore.englishName || productToRestore.name}</strong> back to the active catalog and POS billing counter?</>
                  )}
                </p>
                {!Array.isArray(productToRestore) && (
                  <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', marginBottom: '18px' }}>
                    <span style={{ color: '#64748b' }}>Original Deletion Reason: </span>
                    <strong style={{ color: '#0f172a' }}>{productToRestore.deletionReason || 'Removed from catalog'}</strong>
                  </div>
                )}

                {recycleActionLoading.isRunning && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '11px 14px',
                    background: '#f0fdf4',
                    border: '1.5px solid #86efac',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    color: '#15803d',
                    fontSize: '13px',
                    fontWeight: 700,
                  }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2.5px solid #16a34a',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                      flexShrink: 0,
                    }} />
                    <span>{recycleActionLoading.message || 'Restoring products... Please wait'}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    disabled={recycleActionLoading.isRunning}
                    onClick={() => setProductToRestore(null)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#fff',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: recycleActionLoading.isRunning ? 'not-allowed' : 'pointer',
                      opacity: recycleActionLoading.isRunning ? 0.5 : 1,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={recycleActionLoading.isRunning}
                    onClick={async () => {
                      try {
                        const totalCount = Array.isArray(productToRestore) ? productToRestore.length : 1;
                        setRecycleActionLoading({
                          isRunning: true,
                          message: Array.isArray(productToRestore) ? `Restoring ${totalCount} products...` : 'Restoring product...',
                          current: 0,
                          total: totalCount,
                        });
                        if (Array.isArray(productToRestore)) {
                          const ids = productToRestore.map((p) => p.id);
                          await restoreProducts(ids, user, (cur, tot, msg) => {
                            setRecycleActionLoading({ isRunning: true, message: msg, current: cur, total: tot });
                          });
                          setSelectedRecycleProductIds(new Set());
                        } else {
                          await restoreProduct(productToRestore.id, user);
                          setSelectedRecycleProductIds((prev) => {
                            const next = new Set(prev);
                            next.delete(productToRestore.id);
                            return next;
                          });
                        }
                        setProductToRestore(null);
                      } catch (err) {
                        alert(err?.message || 'Restore failed. Please try again.');
                      } finally {
                        setRecycleActionLoading({ isRunning: false, message: '', current: 0, total: 0 });
                      }
                    }}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '8px',
                      border: 'none',
                      background: recycleActionLoading.isRunning ? '#4ade80' : '#16a34a',
                      color: '#fff',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: recycleActionLoading.isRunning ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    {recycleActionLoading.isRunning && (
                      <div style={{
                        width: '14px',
                        height: '14px',
                        border: '2px solid #ffffff',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                      }} />
                    )}
                    {recycleActionLoading.isRunning ? (recycleActionLoading.message || 'Restoring...') : 'Confirm Restore'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Permanent Purge Product Modal */}
        {productToPurge && (
          <div className="admin-modal-overlay" onClick={() => !recycleActionLoading.isRunning && setProductToPurge(null)}>
            <div className="admin-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
              <div className="admin-modal-header" style={{ background: '#450a0a', borderBottomColor: '#7f1d1d' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#7f1d1d', color: '#fca5a5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#fef2f2' }}>
                      {Array.isArray(productToPurge) ? `Permanently Purge ${productToPurge.length} Products` : 'Permanently Purge Product'}
                    </h4>
                    <span style={{ fontSize: '11px', color: '#fca5a5' }}>Permanent deletion cannot be undone</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="admin-modal-close"
                  disabled={recycleActionLoading.isRunning}
                  onClick={() => !recycleActionLoading.isRunning && setProductToPurge(null)}
                  style={{ background: '#7f1d1d', color: '#fecaca', opacity: recycleActionLoading.isRunning ? 0.4 : 1, cursor: recycleActionLoading.isRunning ? 'not-allowed' : 'pointer' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <div style={{ padding: '20px 24px' }}>
                <p style={{ fontSize: '13px', color: '#334155', margin: '0 0 16px', lineHeight: 1.5 }}>
                  {Array.isArray(productToPurge) ? (
                    <>Are you sure you want to permanently purge <strong>{productToPurge.length} selected products</strong>? They will be permanently expunged from the 30-day recycle bin and cannot be restored again.</>
                  ) : (
                    <>Are you sure you want to permanently purge product <strong>{productToPurge.englishName || productToPurge.name}</strong>? It will be permanently expunged from the 30-day recycle bin and cannot be restored again.</>
                  )}
                </p>

                {recycleActionLoading.isRunning && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 14px',
                    background: '#fff1f2',
                    border: '1.5px solid #fecdd3',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    color: '#9f1239',
                    fontSize: '13px',
                    fontWeight: 700,
                  }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2.5px solid #e11d48',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                      flexShrink: 0,
                    }} />
                    <span>{recycleActionLoading.message || 'Deleting products... Please wait'}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    disabled={recycleActionLoading.isRunning}
                    onClick={() => setProductToPurge(null)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#fff',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: recycleActionLoading.isRunning ? 'not-allowed' : 'pointer',
                      opacity: recycleActionLoading.isRunning ? 0.5 : 1,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={recycleActionLoading.isRunning}
                    onClick={async () => {
                      try {
                        const totalCount = Array.isArray(productToPurge) ? productToPurge.length : 1;
                        setRecycleActionLoading({
                          isRunning: true,
                          message: Array.isArray(productToPurge) ? `Deleting ${totalCount} products...` : 'Deleting product...',
                          current: 0,
                          total: totalCount,
                        });
                        if (Array.isArray(productToPurge)) {
                          const ids = productToPurge.map((p) => p.id);
                          await permanentDeleteProducts(ids, user, (cur, tot, msg) => {
                            setRecycleActionLoading({ isRunning: true, message: msg, current: cur, total: tot });
                          });
                          setSelectedRecycleProductIds(new Set());
                        } else {
                          await permanentDeleteProduct(productToPurge.id, user);
                          setSelectedRecycleProductIds((prev) => {
                            const next = new Set(prev);
                            next.delete(productToPurge.id);
                            return next;
                          });
                        }
                        setProductToPurge(null);
                      } catch (err) {
                        alert(err?.message || 'Purge failed. Please try again.');
                      } finally {
                        setRecycleActionLoading({ isRunning: false, message: '', current: 0, total: 0 });
                      }
                    }}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '8px',
                      border: 'none',
                      background: recycleActionLoading.isRunning ? '#b91c1c' : '#991b1b',
                      color: '#fff',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: recycleActionLoading.isRunning ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    {recycleActionLoading.isRunning && (
                      <div style={{
                        width: '14px',
                        height: '14px',
                        border: '2px solid #ffffff',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                      }} />
                    )}
                    {recycleActionLoading.isRunning ? (recycleActionLoading.message || 'Deleting...') : 'Purge Permanently'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Bill Modal */}
        {editBillModalItem && (
          <EditBillModal
            isOpen={!!editBillModalItem}
            bill={editBillModalItem}
            onClose={() => setEditBillModalItem(null)}
            onSuccess={() => {
              setEditBillModalItem(null);
              handleSyncAllSales();
            }}
            currentUser={user}
          />
        )}

        {/* Catalog Settings Modal — custom categories & units */}
        <CatalogSettingsModal
          isOpen={isCatalogSettingsOpen}
          onClose={() => setIsCatalogSettingsOpen(false)}
        />
      </main>
      </div>
    </div>
  );
}
