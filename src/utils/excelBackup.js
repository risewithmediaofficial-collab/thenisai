/**
 * excelBackup.js — Thenisai POS Excel Backup & Offline Billing Engine
 * Uses SheetJS (xlsx) to generate real .xlsx files
 */
import * as XLSX from 'xlsx';
import { THENISAI_SWEETS_62 } from '../data/thenisaiSweets62';

// ─── Style helpers ────────────────────────────────────────────────────────────
const HEADER_FILL = { fgColor: { rgb: 'C8A96E' } };
const HEADER_FONT = { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 };
const TITLE_FONT = { bold: true, sz: 14, color: { rgb: '7B3F00' } };
const ALT_FILL = { fgColor: { rgb: 'FDF6EC' } };
const BORDER = {
  top: { style: 'thin', color: { rgb: 'D4A853' } },
  bottom: { style: 'thin', color: { rgb: 'D4A853' } },
  left: { style: 'thin', color: { rgb: 'D4A853' } },
  right: { style: 'thin', color: { rgb: 'D4A853' } },
};

function applyStyle(ws, cellAddr, style) {
  if (!ws[cellAddr]) ws[cellAddr] = { t: 's', v: '' };
  ws[cellAddr].s = style;
}

function styleRange(ws, startRow, endRow, startCol, endCol, baseStyle, altEven = false) {
  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      if (!ws[addr]) ws[addr] = { t: 's', v: '' };
      ws[addr].s = altEven && r % 2 === 0
        ? { ...baseStyle, fill: ALT_FILL }
        : baseStyle;
    }
  }
}

function setColWidths(ws, widths) {
  ws['!cols'] = widths.map(w => ({ wch: w }));
}

function todayStr() {
  return new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function formatDateTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function formatDate(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function safeNum(v) {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

// ─── Export Bills / Sales Ledger ──────────────────────────────────────────────

/**
 * Export an array of bills/orders to a styled .xlsx file.
 * @param {Array} bills - Array of bill objects
 * @param {string} [filename] - Custom filename (without extension)
 * @param {string} [sheetTitle] - Title shown at top of the sheet
 */
export function exportBillsToExcel(bills = [], filename = null, sheetTitle = null) {
  const wb = XLSX.utils.book_new();
  const date = todayStr();
  const finalFilename = filename || `Thenisai_Sales_${date.replace(/ /g, '_')}.xlsx`;
  const finalTitle = sheetTitle || `Thenisai Palkova & Sweets — Sales Ledger`;

  // ── Sheet 1: Sales Ledger ──────────────────────────────────────────────────
  const ledgerHeaders = [
    'S.No', 'Date & Time', 'Invoice No', 'Cashier', 'Customer',
    'Phone', 'Items Summary', 'Subtotal (₹)', 'GST 5% (₹)',
    'Grand Total (₹)', 'Payment', 'Source', 'Status',
  ];

  const ledgerRows = bills.map((bill, i) => {
    const itemsSummary = (bill.items || [])
      .map(it => `${it.name} × ${it.quantity}`)
      .join(', ');
    const subtotal = safeNum(bill.subtotal || bill.grandTotal || 0);
    const gst = safeNum(bill.taxBreakdown?.totalTax || (subtotal * 0.05));
    const grand = safeNum(bill.grandTotal || subtotal + gst);
    return [
      i + 1,
      formatDateTime(bill.createdAt),
      bill.invoiceNumber || bill.id || '—',
      bill.cashierName || bill.cashier?.name || 'Staff',
      bill.customer?.fullName || bill.customerName || 'Walk-in Guest',
      bill.customer?.phone || bill.customerPhone || '',
      itemsSummary,
      subtotal,
      gst,
      grand,
      (bill.paymentMethod || bill.paymentMode || 'cash').toUpperCase(),
      bill.source === 'online' ? 'Online' : 'Counter',
      bill.status || 'Completed',
    ];
  });

  // Compute totals
  const totalGross = ledgerRows.reduce((s, r) => s + safeNum(r[9]), 0);
  const totalGst = ledgerRows.reduce((s, r) => s + safeNum(r[8]), 0);
  const totalCash = bills.filter(b => (b.paymentMethod || b.paymentMode || '').toLowerCase() === 'cash')
    .reduce((s, b) => s + safeNum(b.grandTotal), 0);
  const totalUpi = bills.filter(b => (b.paymentMethod || b.paymentMode || '').toLowerCase() === 'upi')
    .reduce((s, b) => s + safeNum(b.grandTotal), 0);
  const totalCard = bills.filter(b => (b.paymentMethod || b.paymentMode || '').toLowerCase() === 'card')
    .reduce((s, b) => s + safeNum(b.grandTotal), 0);

  const aoa = [
    [finalTitle],
    [`Generated: ${date}   |   Total Bills: ${bills.length}   |   Gross Revenue: ₹${totalGross.toLocaleString('en-IN')}`],
    [],
    ledgerHeaders,
    ...ledgerRows,
    [],
    ['', '', '', '', '', '', 'TOTALS →', '', `₹${totalGst.toLocaleString('en-IN')}`, `₹${totalGross.toLocaleString('en-IN')}`, '', '', ''],
    ['', '', '', '', '', '', '', 'Cash:', `₹${totalCash.toLocaleString('en-IN')}`, 'UPI:', `₹${totalUpi.toLocaleString('en-IN')}`, 'Card:', `₹${totalCard.toLocaleString('en-IN')}`],
  ];

  const ws1 = XLSX.utils.aoa_to_sheet(aoa);
  setColWidths(ws1, [6, 20, 18, 14, 20, 14, 40, 14, 12, 14, 10, 10, 12]);

  // Merge title row
  ws1['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 12 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 12 } },
  ];

  XLSX.utils.book_append_sheet(wb, ws1, 'Sales Ledger');

  // ── Sheet 2: Itemized Lines ────────────────────────────────────────────────
  const itemHeaders = [
    'Invoice No', 'Date', 'Sweet Name', 'Tamil Name', 'Unit/Weight',
    'Unit Rate (₹)', 'Qty', 'Total (₹)',
  ];

  const itemRows = [];
  bills.forEach(bill => {
    (bill.items || []).forEach(item => {
      itemRows.push([
        bill.invoiceNumber || bill.id || '—',
        formatDate(bill.createdAt),
        item.name || item.englishName || '',
        item.tamilName || '',
        item.weight || item.unit || '',
        safeNum(item.price),
        safeNum(item.quantity),
        safeNum(item.price) * safeNum(item.quantity),
      ]);
    });
  });

  const aoa2 = [
    ['Thenisai — Itemized Sales Lines', '', '', '', '', '', '', ''],
    itemHeaders,
    ...itemRows,
  ];

  const ws2 = XLSX.utils.aoa_to_sheet(aoa2);
  ws2['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }];
  setColWidths(ws2, [18, 14, 28, 28, 12, 14, 8, 14]);
  XLSX.utils.book_append_sheet(wb, ws2, 'Item Lines');

  // ── Sheet 3: Shift Totals ─────────────────────────────────────────────────
  const aoa3 = [
    ['Thenisai — Shift / Day Totals'],
    [`As of: ${date}`],
    [],
    ['Metric', 'Value'],
    ['Total Bills', bills.length],
    ['Gross Revenue', `₹${totalGross.toLocaleString('en-IN')}`],
    ['GST Collected (5%)', `₹${totalGst.toLocaleString('en-IN')}`],
    ['Cash Total', `₹${totalCash.toLocaleString('en-IN')}`],
    ['UPI Total', `₹${totalUpi.toLocaleString('en-IN')}`],
    ['Card Total', `₹${totalCard.toLocaleString('en-IN')}`],
    ['Net (excl. GST)', `₹${(totalGross - totalGst).toLocaleString('en-IN')}`],
  ];

  const ws3 = XLSX.utils.aoa_to_sheet(aoa3);
  ws3['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
  setColWidths(ws3, [28, 20]);
  XLSX.utils.book_append_sheet(wb, ws3, 'Shift Totals');

  XLSX.writeFile(wb, finalFilename);
}

// ─── Export Daily Revenue Report ──────────────────────────────────────────────

/**
 * Export daily revenue grouped by date to Excel.
 * @param {Array} bills
 * @param {string} [filename]
 */
export function exportDailyRevenueToExcel(bills = [], filename = null) {
  const wb = XLSX.utils.book_new();
  const date = todayStr();
  const finalFilename = filename || `Thenisai_DailyRevenue_${date.replace(/ /g, '_')}.xlsx`;

  // Group by date
  const byDate = {};
  bills.forEach(bill => {
    const d = formatDate(bill.createdAt);
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(bill);
  });

  const rows = Object.entries(byDate).sort((a, b) => new Date(b[0]) - new Date(a[0])).map(([d, bs]) => {
    const gross = bs.reduce((s, b) => s + safeNum(b.grandTotal), 0);
    const gst = bs.reduce((s, b) => s + safeNum(b.taxBreakdown?.totalTax || (safeNum(b.grandTotal) * 0.05 / 1.05)), 0);
    const cash = bs.filter(b => (b.paymentMethod || b.paymentMode || '').toLowerCase() === 'cash')
      .reduce((s, b) => s + safeNum(b.grandTotal), 0);
    const upi = bs.filter(b => (b.paymentMethod || b.paymentMode || '').toLowerCase() === 'upi')
      .reduce((s, b) => s + safeNum(b.grandTotal), 0);
    const card = bs.filter(b => (b.paymentMethod || b.paymentMode || '').toLowerCase() === 'card')
      .reduce((s, b) => s + safeNum(b.grandTotal), 0);
    return [d, bs.length, gross, gst, cash, upi, card];
  });

  const aoa = [
    ['Thenisai Palkova & Sweets — Daily Revenue Report'],
    [`Generated: ${date}`],
    [],
    ['Date', 'Bills', 'Gross Revenue (₹)', 'GST (₹)', 'Cash (₹)', 'UPI (₹)', 'Card (₹)'],
    ...rows,
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }];
  setColWidths(ws, [16, 10, 18, 14, 14, 14, 14]);
  XLSX.utils.book_append_sheet(wb, ws, 'Daily Revenue');
  XLSX.writeFile(wb, finalFilename);
}

// ─── Offline Billing Template ─────────────────────────────────────────────────

/**
 * Download a ready-to-use Excel billing template pre-filled with the
 * Thenisai rate card and Excel formulas for offline billing during outages.
 */
export function downloadOfflineBillingTemplate() {
  const wb = XLSX.utils.book_new();
  const date = todayStr();

  // ── Rate Card Sheet ───────────────────────────────────────────────────────
  const rcHeaders = ['#', 'Item Name', 'Tamil Name', 'Category', 'Unit', 'Price (₹/unit)', 'HSN'];
  const beverages = [
    { itemNumber: 63, name: 'Tea', tamilName: 'டீ', category: 'Beverages', unit: 'Cup', price: 20, hsn: '2101' },
    { itemNumber: 64, name: 'Coffee', tamilName: 'காபி', category: 'Beverages', unit: 'Cup', price: 20, hsn: '2101' },
    { itemNumber: 65, name: 'Filter Coffee', tamilName: 'ஃபில்டர் காபி', category: 'Beverages', unit: 'Cup', price: 20, hsn: '2101' },
    { itemNumber: 66, name: 'Milk', tamilName: 'பால்', category: 'Beverages', unit: 'Cup', price: 20, hsn: '0401' },
  ];

  const allItems = [
    ...THENISAI_SWEETS_62.map(s => ({
      itemNumber: s.itemNumber,
      name: s.englishName || s.name.split('—')[0].trim(),
      tamilName: s.tamilName,
      category: s.subcategory || s.category,
      unit: s.unit,
      price: s.price,
      hsn: s.hsn,
    })),
    ...beverages,
  ];

  const rcRows = allItems.map(s => [s.itemNumber, s.name, s.tamilName, s.category, s.unit, s.price, s.hsn]);

  const rcAoa = [
    ['THENISAI PALKOVA & SWEETS — RATE CARD'],
    ['Nattamai Kottai, Krishnagiri, Tamil Nadu 635001 | Near H.P. Petrol Bunk, NH 44'],
    [`Rate Card Date: ${date}`],
    [],
    rcHeaders,
    ...rcRows,
  ];

  const wsRc = XLSX.utils.aoa_to_sheet(rcAoa);
  wsRc['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } },
  ];
  setColWidths(wsRc, [6, 28, 28, 22, 8, 14, 8]);
  XLSX.utils.book_append_sheet(wb, wsRc, 'Rate Card');

  // ── Billing Template Sheet ────────────────────────────────────────────────
  // Row layout: rows 1-5 = header info, rows 6-7 = column headers, rows 8-37 = item entry (30 rows)
  // Row 38 = Subtotal, 39 = GST 5%, 40 = Grand Total

  const billingAoa = [
    // Row 1
    ['THENISAI PALKOVA & SWEETS', '', '', '', '', '', ''],
    // Row 2
    ['Nattamai Kottai, Krishnagiri, TN 635001 | NH 44', '', '', '', '', '', ''],
    // Row 3 — Invoice meta
    ['Invoice No:', 'THN-____-______', '', 'Date:', date, '', ''],
    // Row 4
    ['Customer:', '', '', 'Phone:', '', '', ''],
    // Row 5
    ['Cashier:', '', '', 'Payment:', 'CASH / UPI / CARD', '', ''],
    // Row 6 — empty spacer
    [],
    // Row 7 — Column headers
    ['#', 'Item Name', 'Tamil Name', 'Unit', 'Rate (₹)', 'Qty', 'Amount (₹)'],
  ];

  // 30 blank item rows (rows 8–37 = AOA index 7–36)
  for (let i = 1; i <= 30; i++) {
    billingAoa.push([i, '', '', '', '', '', { f: `IF(E${7+i}="","",E${7+i}*F${7+i})` }]);
  }

  // Totals section
  billingAoa.push([]); // spacer
  billingAoa.push(['', '', '', '', '', 'Subtotal', { f: `SUM(G8:G37)` }]);
  billingAoa.push(['', '', '', '', '', 'GST 5%', { f: `ROUND(G39*0.05,2)` }]);
  billingAoa.push(['', '', '', '', '', 'GRAND TOTAL', { f: `G39+G40` }]);

  const wsBill = XLSX.utils.aoa_to_sheet(billingAoa);
  wsBill['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
    { s: { r: 2, c: 1 }, e: { r: 2, c: 2 } },
    { s: { r: 3, c: 1 }, e: { r: 3, c: 2 } },
    { s: { r: 4, c: 1 }, e: { r: 4, c: 2 } },
  ];
  setColWidths(wsBill, [6, 28, 24, 10, 12, 8, 14]);
  XLSX.utils.book_append_sheet(wb, wsBill, 'Billing Template');

  // ── Instructions Sheet ─────────────────────────────────────────────────────
  const instrAoa = [
    ['HOW TO USE THIS OFFLINE BILLING TEMPLATE'],
    [],
    ['Step 1:', 'Go to the "Billing Template" sheet.'],
    ['Step 2:', 'Fill in Invoice No, Date, Customer name & phone, Cashier name, and Payment mode at the top.'],
    ['Step 3:', 'For each item sold, enter the Item Name (or paste from Rate Card) in Column B,'],
    ['', 'enter the Rate (₹) in Column E, and Qty in Column F.'],
    ['Step 4:', 'Column G (Amount) calculates automatically using the formula: Rate × Qty.'],
    ['Step 5:', 'Subtotal, GST (5%), and Grand Total are auto-calculated at the bottom.'],
    ['Step 6:', 'Print the sheet or save it and collect payment.'],
    [],
    ['IMPORTANT:', 'Once the server is back online, import this file through the POS Admin panel'],
    ['', '→ POS Counter → Excel Backup → Import Excel Bills.'],
    [],
    ['Rate Card:', 'All 62+ sweets and beverage prices are in the "Rate Card" sheet.'],
    [],
    ['Address:', 'Nattamai Kottai, Krishnagiri, Tamil Nadu 635001'],
    ['Near:', 'H.P. Petrol Bunk on NH 44'],
    ['Phone:', '+91 [Your number here]'],
  ];

  const wsInstr = XLSX.utils.aoa_to_sheet(instrAoa);
  setColWidths(wsInstr, [14, 60]);
  XLSX.utils.book_append_sheet(wb, wsInstr, 'Instructions');

  XLSX.writeFile(wb, `Thenisai_Offline_Billing_Template_${date.replace(/ /g, '_')}.xlsx`);
}

// ─── Import Bills from Excel ──────────────────────────────────────────────────

/**
 * Read an Excel file and return an array of bill objects ready for sync.
 * Accepts both the offline billing template format and previously exported sales ledger.
 * @param {File} file - Browser File object from <input type="file">
 * @returns {Promise<Array>} Array of parsed bill objects
 */
export function importBillsFromExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const wb = XLSX.read(data, { type: 'array' });

        // Try to find a "Sales Ledger" or first sheet
        const sheetName = wb.SheetNames.find(n =>
          n.toLowerCase().includes('sales') || n.toLowerCase().includes('ledger')
        ) || wb.SheetNames[0];

        const ws = wb.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        // Skip header rows (look for row with 'Invoice No' or '#')
        let dataStart = rows.findIndex(row =>
          row.some(cell => typeof cell === 'string' && cell.toLowerCase().includes('invoice'))
        );

        if (dataStart === -1) dataStart = 3; // fallback

        const bills = [];
        for (let i = dataStart + 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || !row[2] || String(row[2]).trim() === '') continue; // skip empty rows

          const grand = safeNum(row[9] || row[6] || 0);
          if (grand === 0) continue;

          bills.push({
            id: `imported-${Date.now()}-${i}`,
            invoiceNumber: String(row[2] || '').trim() || `IMPORT-${i}`,
            createdAt: Date.now(),
            cashierName: String(row[3] || 'Imported').trim(),
            customer: {
              fullName: String(row[4] || 'Walk-in Guest').trim(),
              phone: String(row[5] || '').trim(),
            },
            items: [{ name: String(row[6] || 'Imported Item'), quantity: 1, price: grand }],
            subtotal: safeNum(row[7] || grand),
            taxBreakdown: { totalTax: safeNum(row[8] || 0) },
            grandTotal: grand,
            paymentMethod: String(row[10] || 'cash').toLowerCase().trim(),
            source: 'counter',
            status: 'Completed',
            isImported: true,
          });
        }

        resolve(bills);
      } catch (err) {
        reject(new Error(`Failed to parse Excel file: ${err.message}`));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}
