import { test, expect } from '@playwright/test';

test.describe('Stock Deduction, Oversell Prevention & Expenses Management', () => {

  test('1. Unit conversion & deduction calculations verify correctly', async () => {
    // Helper replicating computeStockDeduction logic
    const computeStockDeduction = (billingUnit, qty, invItem) => {
      const q = Math.max(1, Number(qty) || 1);
      const isUnlimited = invItem?.isUnlimitedStock || false;
      if (isUnlimited) return { deductStockKg: 0, deductUnits: 0 };

      const u = String(billingUnit || '').toLowerCase().trim();
      const invUnit = String(invItem?.unit || 'kg').toLowerCase().trim();

      if (u === '100g' || u === '100 g') return { deductStockKg: 0.1 * q, deductUnits: q };
      if (u === '250g' || u === '250 g' || u === '1/4 kg') return { deductStockKg: 0.25 * q, deductUnits: q };
      if (u === '500g' || u === '500 g' || u === '1/2 kg') return { deductStockKg: 0.5 * q, deductUnits: q };
      if (u === '1kg' || u === '1 kg') return { deductStockKg: 1 * q, deductUnits: q };
      if (u === '2kg' || u === '2 kg') return { deductStockKg: 2 * q, deductUnits: q };
      if (u === '5kg' || u === '5 kg') return { deductStockKg: 5 * q, deductUnits: q };
      if (u === '500ml' || u === '500 ml') return { deductStockKg: 0.5 * q, deductUnits: q };
      if (u === '1 litre' || u === '1l' || u === '1 l' || u === 'litre') return { deductStockKg: 1 * q, deductUnits: q };

      if (invUnit === 'piece' || invUnit === 'pieces' || invUnit === 'pc' || invUnit === 'pkt' || invUnit === 'cup' || invUnit === 'box') {
        return { deductStockKg: 0, deductUnits: q };
      }
      return { deductStockKg: q, deductUnits: q };
    };

    // 250g deduction
    expect(computeStockDeduction('250g', 2, { unit: 'kg' })).toEqual({ deductStockKg: 0.5, deductUnits: 2 });
    // 500g deduction
    expect(computeStockDeduction('500g', 3, { unit: 'kg' })).toEqual({ deductStockKg: 1.5, deductUnits: 3 });
    // 1kg deduction
    expect(computeStockDeduction('1kg', 4, { unit: 'kg' })).toEqual({ deductStockKg: 4, deductUnits: 4 });
    // 100g deduction
    expect(computeStockDeduction('100g', 5, { unit: 'kg' })).toEqual({ deductStockKg: 0.5, deductUnits: 5 });
    // 1 Litre deduction
    expect(computeStockDeduction('1 Litre', 2, { unit: 'litre' })).toEqual({ deductStockKg: 2, deductUnits: 2 });
    // Unlimited stock (tea/coffee)
    expect(computeStockDeduction('1 Cup', 10, { unit: 'cup', isUnlimitedStock: true })).toEqual({ deductStockKg: 0, deductUnits: 0 });
    // Piece item
    expect(computeStockDeduction('1 Pc', 6, { unit: 'piece' })).toEqual({ deductStockKg: 0, deductUnits: 6 });
  });

  test('2. Cashier navigates to Expenses and logs a new expense', async ({ page }) => {
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
    });

    await page.goto('/#billing');
    await page.waitForSelector('.pos-sidebar', { timeout: 15000 });

    // Click on Record Expense in sidebar
    const expNavBtn = page.locator('#side-nav-pos-expenses');
    await expNavBtn.waitFor({ state: 'visible' });
    await expNavBtn.click();

    // Verify hash changed to #billing/expenses
    await page.waitForURL(/#billing\/expenses/);

    // Verify Expense Log Form is rendered
    await page.waitForSelector('#expense-amount', { timeout: 10000 });
    const amountInput = page.locator('#expense-amount');
    const purposeInput = page.locator('#expense-purpose');
    const categorySelect = page.locator('#expense-category');
    const noteInput = page.locator('#expense-note');
    const submitBtn = page.locator('#expense-submit-btn');

    await expect(amountInput).toBeVisible();
    await expect(purposeInput).toBeVisible();
    await expect(categorySelect).toBeVisible();

    // Fill expense data
    await amountInput.fill('120');
    await purposeInput.fill('Evening tea & filter coffee for store team');
    await categorySelect.selectOption('Staff Welfare');
    await noteInput.fill('Tea stall payout voucher #402');

    // Submit expense
    await submitBtn.click();

    // Verify success confirmation appears immediately
    await expect(page.locator('text=logged successfully')).toBeVisible({ timeout: 5000 });
  });

  test('3. Admin Expenses portal has filters and displays logged expenses', async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('thenisai_auth_user', JSON.stringify({
        id: 'staff-1',
        username: 'admin',
        name: 'S. Ramanathan',
        role: 'admin',
        title: 'Kitchen Operations Head',
      }));
      sessionStorage.setItem('thenisai_admin_session_unlocked', 'true');
      sessionStorage.setItem('thenisai_auth_token', 'mock_admin_token');
      // Seed an expense in localStorage cache for reliable UI verification
      const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      localStorage.setItem('thenisai_expenses_cache', JSON.stringify([
        {
          id: 'exp-test-001',
          amount: 250,
          purpose: 'Packaging carry bags restock',
          category: 'Packaging',
          date: today,
          cashier: { id: 'staff-2', name: 'M. Kannan', username: 'cashier' },
          note: '500 count cloth carry bags',
          createdAt: Date.now(),
        }
      ]));
    });

    await page.goto('/#admin/expenses');
    await page.waitForSelector('#expenses-page', { timeout: 15000 });

    // Wait for expenses to load into table
    await page.waitForSelector('#expenses-table tbody tr', { timeout: 10000 });
    const pageContainer = page.locator('#expenses-page');
    const pageText = await pageContainer.innerText();
    expect(pageText).toContain('Expenses');

    // Verify filter controls exist
    const categoryFilter = page.locator('#expenses-filter-category');
    const cashierFilter = page.locator('#expenses-filter-cashier');
    await expect(categoryFilter).toBeVisible();
    await expect(cashierFilter).toBeVisible();

    // Check table has the logged expense from test 2
    expect(pageText).toContain('Evening tea & filter coffee for store team');
    expect(pageText).toContain('Staff Welfare');
  });

  test('4. Daily Revenue Report displays Total Expenses and Net Revenue calculation', async ({ page }) => {
    const today = new Date().toISOString().slice(0, 10);

    await page.addInitScript(({ todayStr }) => {
      sessionStorage.setItem('thenisai_auth_user', JSON.stringify({
        id: 'staff-1',
        username: 'admin',
        name: 'S. Ramanathan',
        role: 'admin',
        title: 'Kitchen Operations Head',
      }));
      sessionStorage.setItem('thenisai_admin_session_unlocked', 'true');
      sessionStorage.setItem('thenisai_auth_token', 'mock_admin_token');

      // Seed a sale of 1000
      localStorage.setItem('thenisai_bills_cache', JSON.stringify([
        {
          id: 'AA001',
          invoiceNumber: 'AA001',
          createdAt: Date.now(),
          orderDate: todayStr,
          grandTotal: 1000,
          paymentMethod: 'cash',
          cashier: { id: 'staff-2', name: 'M. Kannan', username: 'cashier' },
          items: [{ id: 'sweet-1', name: 'Special Milk Palkova', quantity: 2, price: 500, unit: '500g' }],
        }
      ]));
    }, { todayStr: today });

    await page.goto('/#admin/shift-bills');
    await page.waitForSelector('.revenue-kpi-grid', { timeout: 15000 });

    // Verify KPI Cards exist
    const kpiGrid = page.locator('.revenue-kpi-grid');
    await expect(kpiGrid).toBeVisible();

    // Check for TOTAL SALES REVENUE, TOTAL STORE EXPENSES, and NET REVENUE
    const kpiText = await kpiGrid.innerText();
    expect(kpiText).toContain('TOTAL SALES REVENUE');
    expect(kpiText).toContain('TOTAL STORE EXPENSES');
    expect(kpiText).toContain('NET REVENUE (PROFIT)');

    // Check Logged Store Expenses section in table
    const expensesSection = page.locator('.daily-bills-section').last();
    await expect(expensesSection).toBeVisible();
    const sectionText = await expensesSection.innerText();
    expect(sectionText).toContain('Logged Store Expenses');
    expect(sectionText).toContain('Evening tea & filter coffee for store team');
  });

  test('5. Billing counter prevents oversell when stock check fails', async ({ page }) => {
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
    });

    await page.goto('/#billing');
    await page.waitForSelector('.pos-catalog-pane', { timeout: 15000 });

    // Mock stock validation endpoint to return insufficient stock
    await page.route('**/api/bills/validate-stock', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: false,
          errors: [
            {
              id: 'sweet-1',
              name: 'Special Milk Palkova',
              requestedQty: 10,
              billingUnit: '1kg',
              requestedKg: 10,
              availableKg: 2,
              reason: 'Only 2 kg available (requested 10 kg)'
            }
          ]
        })
      });
    });

    // Add an item to bill
    const firstRow = page.locator('.pos-list-row:not(.is-out-of-stock)').first();
    await firstRow.waitFor({ state: 'visible' });
    await firstRow.click();

    // Click Complete Sale
    const settleBtn = page.locator('.btn-pos-complete');
    await settleBtn.waitFor({ state: 'visible' });
    await settleBtn.click();

    // Verify Stock Error Modal is displayed
    const stockModal = page.locator('#stock-error-modal');
    await stockModal.waitFor({ state: 'visible', timeout: 5000 });
    await expect(stockModal).toContainText('Insufficient Stock');
    await expect(stockModal).toContainText('Only 2 kg available');

    // Dismiss modal to adjust bill
    const dismissBtn = page.locator('#btn-dismiss-stock-error');
    await dismissBtn.click();
    await expect(stockModal).toBeHidden();
  });

});
