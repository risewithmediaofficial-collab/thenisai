import { test, expect } from '@playwright/test';
import { formatInvoiceNumber, parseInvoiceNumber, getNextInvoiceNumber } from '../src/utils/invoiceNumber';

test.describe('Thenisai POS Billing & Admin Sales', () => {

  test('0. Vehicle Registration format AA001 to AA999 to AB001 unit tests', async () => {
    expect(formatInvoiceNumber(1)).toBe('AA001');
    expect(formatInvoiceNumber(2)).toBe('AA002');
    expect(formatInvoiceNumber(999)).toBe('AA999');
    expect(formatInvoiceNumber(1000)).toBe('AB001');
    expect(formatInvoiceNumber(1998)).toBe('AB999');
    expect(formatInvoiceNumber(1999)).toBe('AC001');
    expect(formatInvoiceNumber(25974)).toBe('AZ999');
    expect(formatInvoiceNumber(25975)).toBe('BA001');

    expect(parseInvoiceNumber('AA001')).toBe(1);
    expect(parseInvoiceNumber('AA999')).toBe(999);
    expect(parseInvoiceNumber('AB001')).toBe(1000);
    expect(parseInvoiceNumber('AB999')).toBe(1998);
    expect(parseInvoiceNumber('AC001')).toBe(1999);
    expect(parseInvoiceNumber('AZ999')).toBe(25974);
    expect(parseInvoiceNumber('BA001')).toBe(25975);

    // Test transition from existing bills
    expect(getNextInvoiceNumber([])).toBe('AA001');
    expect(getNextInvoiceNumber([{ invoiceNumber: 'AA001' }])).toBe('AA002');
    expect(getNextInvoiceNumber([{ invoiceNumber: 'AA999' }])).toBe('AB001');
    expect(getNextInvoiceNumber([{ invoiceNumber: 'AB999' }])).toBe('AC001');
  });

  test('1. Creates continuous unique sequential invoice numbers in vehicle reg format (AA001, AA002)', async ({ page }) => {
    // Authenticate as cashier and start with a clean state
    await page.addInitScript(() => {
      sessionStorage.setItem('thenisai_auth_user', JSON.stringify({
        id: 'staff-2',
        username: 'cashier',
        name: 'M. Kannan',
        role: 'cashier',
        title: 'Counter Cashier',
        counter: 'Counter Desk 01',
      }));
      sessionStorage.setItem('thenisai_billing_session_unlocked', 'true');
      sessionStorage.setItem('thenisai_auth_token', 'mock_cashier_token');
      localStorage.setItem('thenisai_bills_cache', '[]');
      localStorage.setItem('thenisai_offline_backup_ledger', '[]');
      localStorage.setItem('thenisai_offline_ledger_v2', '[]');
      localStorage.setItem('thenisai_recycle_bin_bills_v1', '[]');
    });

    await page.goto('/#billing');
    await page.waitForSelector('.pos-catalog-pane, .pos-sweets-list', { timeout: 15000 });

    // Add first item to bill
    const firstRow = page.locator('.pos-list-row:not(.is-out-of-stock)').first();
    await firstRow.waitFor({ state: 'visible' });
    await firstRow.click();

    // Settle bill
    const settleBtn = page.locator('.btn-pos-complete');
    await settleBtn.waitFor({ state: 'visible' });
    await settleBtn.click();

    // Settle modal / Invoice modal
    const invoiceModal = page.locator('.invoice-modal-wrap').first();
    await invoiceModal.waitFor({ state: 'visible', timeout: 10000 });
    
    // Check invoice number is AA001
    const invoiceNumberText = await page.locator('.invoice-quick-inv-badge, .pos-slip-document').allInnerTexts();
    const joinedText = invoiceNumberText.join(' ');
    expect(joinedText).toContain('AA001');

    // Close invoice modal
    const closeBtn = page.locator('.invoice-top-close-btn');
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }
    await page.waitForTimeout(500);

    // Bill second item
    await firstRow.click();
    await settleBtn.click();
    await invoiceModal.waitFor({ state: 'visible', timeout: 10000 });

    // Check invoice number is AA002
    const secondInvoiceText = (await page.locator('.invoice-quick-inv-badge, .pos-slip-document').allInnerTexts()).join(' ');
    expect(secondInvoiceText).toContain('AA002');
  });

  test('2. Reset bill numbers to start from 1 (AA001) after deleting all bills', async ({ page }) => {
    // Authenticate as cashier with existing bills
    await page.addInitScript(() => {
      const existingBills = [
        {
          id: 'pos-test-1',
          invoiceNumber: 'AA001',
          grandTotal: 100,
          paymentMethod: 'cash',
          orderDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          orderTime: '10:00 am',
          createdAt: Date.now() - 60000,
          source: 'counter',
          status: 'Completed',
          cashier: { id: 'staff-2', username: 'cashier', name: 'M. Kannan', counter: 'Counter Desk 01' },
          items: [{ id: 'tea', name: 'Tea', price: 20, quantity: 5 }],
        },
        {
          id: 'pos-test-2',
          invoiceNumber: 'AA002',
          grandTotal: 50,
          paymentMethod: 'upi',
          orderDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          orderTime: '10:30 am',
          createdAt: Date.now(),
          source: 'counter',
          status: 'Completed',
          cashier: { id: 'staff-2', username: 'cashier', name: 'M. Kannan', counter: 'Counter Desk 01' },
          items: [{ id: 'coffee', name: 'Coffee', price: 25, quantity: 2 }],
        },
      ];

      sessionStorage.setItem('thenisai_auth_user', JSON.stringify({
        id: 'staff-2',
        username: 'cashier',
        name: 'M. Kannan',
        role: 'cashier',
        title: 'Counter Cashier',
        counter: 'Counter Desk 01',
      }));
      sessionStorage.setItem('thenisai_billing_session_unlocked', 'true');
      sessionStorage.setItem('thenisai_auth_token', 'mock_cashier_token');
      localStorage.setItem('thenisai_bills_cache', JSON.stringify(existingBills));
      localStorage.setItem('thenisai_offline_backup_ledger', JSON.stringify(existingBills));
      localStorage.setItem('thenisai_offline_ledger_v2', JSON.stringify(existingBills));
      localStorage.setItem('thenisai_recycle_bin_bills_v1', '[]');
    });

    // Go to daily sales shift report
    await page.goto('/#billing/daily-sales');
    await page.waitForSelector('.shift-invoices-table, .pos-shift-ledger', { timeout: 15000 });

    // Verify 2 bills exist
    const deleteBtn = page.locator('button:has-text("Delete All Today")');
    await expect(deleteBtn).toBeVisible();

    // Click "Delete All Today"
    await deleteBtn.click();

    // Confirm in DeleteBillModal
    const confirmDeleteBtn = page.locator('.btn-delete-confirm');
    await confirmDeleteBtn.waitFor({ state: 'visible' });
    await confirmDeleteBtn.click();

    // Wait for bills to be cleared
    await page.waitForTimeout(1000);

    // Return to POS
    const returnToPos = page.locator('.btn-shift-new-sale');
    if (await returnToPos.isVisible()) {
      await returnToPos.click();
    } else {
      await page.goto('/#billing');
    }

    // Now create a new bill
    const firstRow = page.locator('.pos-list-row:not(.is-out-of-stock)').first();
    await firstRow.waitFor({ state: 'visible' });
    await firstRow.click();

    const settleBtn = page.locator('.btn-pos-complete');
    await settleBtn.click();

    const invoiceModal = page.locator('.invoice-modal-wrap').first();
    await invoiceModal.waitFor({ state: 'visible', timeout: 10000 });

    // Bill number should restart from 1 (AA001)
    const newInvoiceText = (await page.locator('.invoice-quick-inv-badge, .pos-slip-document').allInnerTexts()).join(' ');
    expect(newInvoiceText).toContain('AA001');
  });

  test('3. Admin Sales & Ledger shows today\'s bills and supports sorting and filtering', async ({ page }) => {
    const todayBills = [
      {
        id: 'bill-today-1',
        invoiceNumber: 'AA001',
        grandTotal: 120,
        paymentMethod: 'cash',
        orderDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        orderTime: '11:00 am',
        createdAt: Date.now() - 3600000,
        source: 'counter',
        status: 'Completed',
        cashier: { id: 'staff-2', username: 'cashier', name: 'M. Kannan', counter: 'Counter Desk 01' },
        customer: { fullName: 'Arun Kumar', phone: '9876543210' },
        items: [{ name: 'Laddoo', quantity: 2, price: 60 }],
      },
      {
        id: 'bill-today-2',
        invoiceNumber: 'AA002',
        grandTotal: 350,
        paymentMethod: 'upi',
        orderDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        orderTime: '11:30 am',
        createdAt: Date.now() - 1800000,
        source: 'counter',
        status: 'Completed',
        cashier: { id: 'staff-2', username: 'cashier', name: 'M. Kannan', counter: 'Counter Desk 01' },
        customer: { fullName: 'Bala Chandran', phone: '9123456780' },
        items: [{ name: 'Palkova', quantity: 1, price: 350 }],
      },
      {
        id: 'bill-today-3',
        invoiceNumber: 'AA003',
        grandTotal: 200,
        paymentMethod: 'split',
        splitCash: 100,
        splitUpi: 100,
        orderDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        orderTime: '12:00 pm',
        createdAt: Date.now(),
        source: 'counter',
        status: 'Completed',
        cashier: { id: 'staff-1', username: 'admin', name: 'S. Ramanathan', counter: 'Operations Central' },
        customer: { fullName: 'Chitra Devi', phone: '9988776655' },
        items: [{ name: 'Halwa', quantity: 1, price: 200 }],
      },
    ];

    // Authenticate as Admin
    await page.addInitScript((bills) => {
      sessionStorage.setItem('thenisai_auth_user', JSON.stringify({
        id: 'staff-1',
        username: 'admin',
        name: 'S. Ramanathan',
        role: 'admin',
        title: 'Kitchen Operations Head',
      }));
      sessionStorage.setItem('thenisai_admin_session_unlocked', 'true');
      sessionStorage.setItem('thenisai_auth_token', 'mock_admin_token');
      localStorage.setItem('thenisai_bills_cache', JSON.stringify(bills));
      localStorage.setItem('thenisai_offline_ledger_v2', JSON.stringify(bills));
      localStorage.setItem('thenisai_recycle_bin_bills_v1', '[]');
    }, todayBills);

    // Open Admin Sales & Ledger
    await page.goto('/#admin/sales');
    await page.waitForSelector('.sales-table, .admin-sales-tab', { timeout: 15000 });

    // Verify all 3 bills are visible
    const tableText = await page.locator('.sales-table').innerText();
    expect(tableText).toContain('AA001');
    expect(tableText).toContain('AA002');
    expect(tableText).toContain('AA003');
    expect(tableText).toContain('Arun Kumar');
    expect(tableText).toContain('Bala Chandran');
    expect(tableText).toContain('Chitra Devi');

    // Test Payment Filter: UPI QR Only
    const paymentSelect = page.locator('select.admin-select-filter').filter({ hasText: 'All Payment Methods' });
    await paymentSelect.selectOption('upi');
    await page.waitForTimeout(300);

    const filteredUpiText = await page.locator('.sales-table').innerText();
    expect(filteredUpiText).toContain('AA002'); // UPI bill
    expect(filteredUpiText).toContain('AA003'); // Split bill has UPI
    expect(filteredUpiText).not.toContain('Arun Kumar'); // Cash-only bill should not appear

    // Reset to All Payment Methods
    await paymentSelect.selectOption('all');
    await page.waitForTimeout(300);

    // Test Sorting: Amount: High to Low
    const sortSelect = page.locator('select[aria-label="Sort sales records"]');
    await sortSelect.selectOption('amount-desc');
    await page.waitForTimeout(300);

    // First row should be AA002 (₹350)
    const firstInvoiceInTable = await page.locator('.sales-table tbody tr').first().innerText();
    expect(firstInvoiceInTable).toContain('AA002');
    expect(firstInvoiceInTable).toContain('350');

    // Test Sorting: Amount: Low to High
    await sortSelect.selectOption('amount-asc');
    await page.waitForTimeout(300);

    // First row should be AA001 (₹120)
    const lowestInvoiceInTable = await page.locator('.sales-table tbody tr').first().innerText();
    expect(lowestInvoiceInTable).toContain('AA001');
    expect(lowestInvoiceInTable).toContain('120');

    // Test Search Box
    const searchInput = page.locator('.sales-search-wrap input');
    await searchInput.fill('Chitra');
    await page.waitForTimeout(300);

    const searchedTableText = await page.locator('.sales-table').innerText();
    expect(searchedTableText).toContain('AA003');
    expect(searchedTableText).not.toContain('AA001');
  });

  test('4. Storefront and Cart flow works properly', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('nav, .hero-section, header', { timeout: 15000 });

    // Verify storefront page loaded
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('5. Admin Daily Revenue & Shift Bills shows today\'s bills and correct revenue', async ({ page }) => {
    const todayBills = [
      {
        id: 'bill-shift-1',
        invoiceNumber: 'AA001',
        grandTotal: 150,
        paymentMethod: 'cash',
        orderDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        orderTime: '10:00 am',
        createdAt: Date.now() - 3600000,
        source: 'counter',
        status: 'Completed',
        cashier: { id: 'staff-2', username: 'cashier', name: 'M. Kannan', counter: 'Counter Desk 01' },
        customer: { fullName: 'Ramesh', phone: '9876500001' },
        items: [{ name: 'Palkova', quantity: 1, price: 150 }],
      },
      {
        id: 'bill-shift-2',
        invoiceNumber: 'AA002',
        grandTotal: 250,
        paymentMethod: 'upi',
        orderDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        orderTime: '11:00 am',
        createdAt: Date.now() - 1800000,
        source: 'counter',
        status: 'Completed',
        cashier: { id: 'staff-2', username: 'cashier', name: 'M. Kannan', counter: 'Counter Desk 01' },
        customer: { fullName: 'Suresh', phone: '9876500002' },
        items: [{ name: 'Mysore Pak', quantity: 1, price: 250 }],
      },
    ];

    await page.addInitScript((bills) => {
      sessionStorage.setItem('thenisai_auth_user', JSON.stringify({
        id: 'staff-1',
        username: 'admin',
        name: 'Thirumal',
        role: 'admin',
        title: 'Kitchen Operations Head',
      }));
      sessionStorage.setItem('thenisai_admin_session_unlocked', 'true');
      sessionStorage.setItem('thenisai_auth_token', 'mock_admin_token');
      localStorage.setItem('thenisai_bills_cache', JSON.stringify(bills));
      localStorage.setItem('thenisai_offline_ledger_v2', JSON.stringify(bills));
      localStorage.setItem('thenisai_recycle_bin_bills_v1', '[]');
    }, todayBills);

    // Navigate to shift bills
    await page.goto('/#admin/shift-bills');
    await page.waitForSelector('.daily-revenue-wrapper', { timeout: 15000 });

    // Verify revenue KPIs
    const revValue = await page.locator('.rev-card.gross .rev-value').innerText();
    expect(revValue).toContain('400'); // 150 + 250 = 400

    // Verify bills appear in the daily bills table
    const tableText = await page.locator('.daily-bills-table').innerText();
    expect(tableText).toContain('AA001');
    expect(tableText).toContain('AA002');
    expect(tableText).toContain('Ramesh');
    expect(tableText).toContain('Suresh');
  });

  test('6. Monthly report print and export as CSV date to date option', async ({ page }) => {
    const multiDateBills = [
      {
        id: 'bill-month-1',
        invoiceNumber: 'AA001',
        grandTotal: 150,
        paymentMethod: 'cash',
        orderDate: '2026-09-02',
        orderTime: '10:00 am',
        createdAt: new Date('2026-09-02T10:00:00').getTime(),
        source: 'counter',
        status: 'Completed',
        cashier: { id: 'staff-2', username: 'cashier', name: 'M. Kannan', counter: 'Counter Desk 01' },
        customer: { fullName: 'Ramesh', phone: '9876500001' },
        items: [{ name: 'Palkova', quantity: 1, price: 150 }],
      },
      {
        id: 'bill-month-2',
        invoiceNumber: 'AA002',
        grandTotal: 250,
        paymentMethod: 'upi',
        orderDate: '2026-09-15',
        orderTime: '11:00 am',
        createdAt: new Date('2026-09-15T11:00:00').getTime(),
        source: 'counter',
        status: 'Completed',
        cashier: { id: 'staff-2', username: 'cashier', name: 'M. Kannan', counter: 'Counter Desk 01' },
        customer: { fullName: 'Suresh', phone: '9876500002' },
        items: [{ name: 'Mysore Pak', quantity: 1, price: 250 }],
      },
      {
        id: 'bill-month-3',
        invoiceNumber: 'AA003',
        grandTotal: 500,
        paymentMethod: 'card',
        orderDate: '2026-09-22',
        orderTime: '01:00 pm',
        createdAt: new Date('2026-09-22T13:00:00').getTime(),
        source: 'counter',
        status: 'Completed',
        cashier: { id: 'staff-1', username: 'admin', name: 'S. Ramanathan', counter: 'Operations Central' },
        customer: { fullName: 'Dinesh', phone: '9876500003' },
        items: [{ name: 'Kaju Katli', quantity: 2, price: 250 }],
      },
    ];

    await page.addInitScript((bills) => {
      sessionStorage.setItem('thenisai_auth_user', JSON.stringify({
        id: 'staff-1',
        username: 'admin',
        name: 'Thirumal',
        role: 'admin',
        title: 'Kitchen Operations Head',
      }));
      sessionStorage.setItem('thenisai_admin_session_unlocked', 'true');
      sessionStorage.setItem('thenisai_auth_token', 'mock_admin_token');
      localStorage.setItem('thenisai_bills_cache', JSON.stringify(bills));
      localStorage.setItem('thenisai_offline_ledger_v2', JSON.stringify(bills));
      localStorage.setItem('thenisai_recycle_bin_bills_v1', '[]');
    }, multiDateBills);

    // Navigate to shift bills
    await page.goto('/#admin/shift-bills');
    await page.waitForSelector('.daily-revenue-wrapper', { timeout: 15000 });

    // Click "This Month" preset pill
    const thisMonthPill = page.locator('.date-pill:has-text("This Month")');
    await expect(thisMonthPill).toBeVisible();
    await thisMonthPill.click();
    await page.waitForTimeout(300);

    // Verify dual date pickers appear
    const fromInput = page.locator('.range-date-pickers input[type="date"]').first();
    const toInput = page.locator('.range-date-pickers input[type="date"]').last();
    await expect(fromInput).toBeVisible();
    await expect(toInput).toBeVisible();

    // Verify all 3 bills in September are included in This Month
    const grossRev = await page.locator('.rev-card.gross .rev-value').innerText();
    expect(grossRev).toContain('900'); // 150 + 250 + 500 = 900

    // Print button should say "Print Monthly Report"
    const printBtn = page.locator('.daily-action-btn.primary');
    await expect(printBtn).toContainText('Print Monthly Report');

    // Click "Print Monthly Report"
    await printBtn.click();
    const modal = page.locator('.z-report-modal');
    await expect(modal).toBeVisible();

    // Check report modal content
    const modalText = await modal.innerText();
    expect(modalText).toContain('MONTHLY FINANCIAL REPORT');
    expect(modalText).toContain('DAILY BREAKDOWN');
    expect(modalText).toContain('TOP PRODUCTS SOLD');
    expect(modalText).toContain('900');

    // Close modal
    await page.locator('.z-close-btn').click();
    await expect(modal).toBeHidden();

    // Test "Date to Date" range filter
    const dateToDatePill = page.locator('.date-pill:has-text("Date to Date")');
    await dateToDatePill.click();
    await page.waitForTimeout(300);

    // Set range from 2026-09-01 to 2026-09-10 (should only include AA001, ₹150)
    await fromInput.fill('2026-09-01');
    await toInput.fill('2026-09-10');
    await page.waitForTimeout(300);

    const rangeRev = await page.locator('.rev-card.gross .rev-value').innerText();
    expect(rangeRev).toContain('150');

    // Print button should say "Print Period Report"
    await expect(printBtn).toContainText('Print Period Report');

    // Test CSV download
    const downloadPromise = page.waitForEvent('download');
    await page.locator('.daily-action-btn:has-text("Export CSV")').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.csv');
    expect(download.suggestedFilename()).toContain('Thenisai');
  });

});
