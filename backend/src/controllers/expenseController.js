import { Expense, Bill } from '../models/index.js';
import { sanitizeCashier } from '../utils/sanitize.js';

export const EXPENSE_CATEGORIES = [
  'General',
  'Fuel & Transport',
  'Packaging',
  'Utilities',
  'Cleaning',
  'Staff Welfare',
  'Maintenance',
  'Purchases',
  'Miscellaneous',
];

export async function createExpense(req, res) {
  try {
    const { amount, purpose, category, date, cashier, note } = req.body;

    const numAmount = Math.round(Number(amount) * 100) / 100;
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'A valid positive amount is required.' });
    }
    const cleanPurpose = String(purpose || '').trim();
    if (!cleanPurpose) {
      return res.status(400).json({ success: false, message: 'Purpose / reason is required.' });
    }

    const now = new Date();
    const todayStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    const expense = await Expense.create({
      id: `exp-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      amount: numAmount,
      purpose: cleanPurpose,
      category: String(category || 'General').trim(),
      date: String(date || todayStr).trim(),
      cashier: sanitizeCashier(cashier),
      note: String(note || '').trim(),
      createdAt: Date.now(),
    });

    console.log(`[Expenses] ₹${expense.amount} — "${expense.purpose}" logged by ${expense.cashier?.name}`);
    return res.status(201).json({ success: true, expense });
  } catch (err) {
    console.error('[Expenses] Error creating expense:', err);
    return res.status(500).json({ success: false, message: 'Failed to log expense: ' + err.message });
  }
}

export async function getExpenses(req, res) {
  try {
    const { cashierId, category, date, dateFrom, dateTo, limit = 500 } = req.query;
    const filter = {};

    if (cashierId && cashierId !== 'all') {
      filter.$or = [
        { 'cashier.id': cashierId },
        { 'cashier.username': cashierId },
      ];
    }
    if (category && category !== 'all') {
      filter.category = category;
    }
    if (date) {
      filter.date = date;
    }
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = Number(dateFrom);
      if (dateTo) filter.createdAt.$lte = Number(dateTo);
    }

    const expenses = await Expense.find(filter).sort({ createdAt: -1 }).limit(Number(limit));
    const total = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    return res.json({ success: true, expenses, total: Math.round(total * 100) / 100, categories: EXPENSE_CATEGORIES });
  } catch (err) {
    console.error('[Expenses] Error fetching expenses:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch expenses' });
  }
}

export async function updateExpense(req, res) {
  try {
    const { id } = req.params;
    const { amount, purpose, category, date, note } = req.body;
    const expense = await Expense.findOne({ id });
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found.' });

    if (amount !== undefined && !isNaN(Number(amount)) && Number(amount) > 0) {
      expense.amount = Math.round(Number(amount) * 100) / 100;
    }
    if (purpose) expense.purpose = String(purpose).trim();
    if (category) expense.category = String(category).trim();
    if (date) expense.date = String(date).trim();
    if (note !== undefined) expense.note = String(note).trim();

    await expense.save();
    return res.json({ success: true, expense });
  } catch (err) {
    console.error('[Expenses] Error updating expense:', err);
    return res.status(500).json({ success: false, message: 'Failed to update expense: ' + err.message });
  }
}

export async function deleteExpense(req, res) {
  try {
    const { id } = req.params;
    const expense = await Expense.findOne({ id });
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found.' });

    await Expense.deleteOne({ id });
    console.log(`[Expenses] Deleted expense ${id} — ₹${expense.amount} "${expense.purpose}"`);
    return res.json({ success: true, message: 'Expense deleted.' });
  } catch (err) {
    console.error('[Expenses] Error deleting expense:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete expense: ' + err.message });
  }
}

export async function getDailyReport(req, res) {
  try {
    const { date, cashierId } = req.query;
    if (!date) {
      return res.status(400).json({ success: false, message: 'date query parameter is required (DD Mon YYYY).' });
    }

    const billFilter = { orderDate: date };
    const expenseFilter = { date };

    if (cashierId && cashierId !== 'all') {
      billFilter.$or = [{ 'cashier.id': cashierId }, { 'cashier.username': cashierId }];
      expenseFilter.$or = [{ 'cashier.id': cashierId }, { 'cashier.username': cashierId }];
    }

    const [bills, expenses] = await Promise.all([
      Bill.find(billFilter).sort({ createdAt: -1 }).lean(),
      Expense.find(expenseFilter).sort({ createdAt: -1 }).lean(),
    ]);

    const totalRevenue = bills.reduce((sum, b) => sum + (b.grandTotal || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const cashRevenue = bills.filter(b => b.paymentMethod === 'cash').reduce((sum, b) => sum + (b.grandTotal || 0), 0);
    const upiRevenue = bills.filter(b => b.paymentMethod === 'upi').reduce((sum, b) => sum + (b.grandTotal || 0), 0);
    const splitRevenue = bills.filter(b => b.paymentMethod === 'split').reduce((sum, b) => {
      return sum + (b.splitCash || 0) + (b.splitUpi || 0);
    }, 0);

    return res.json({
      success: true,
      date,
      bills,
      expenses,
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        netRevenue: Math.round((totalRevenue - totalExpenses) * 100) / 100,
        billCount: bills.length,
        expenseCount: expenses.length,
        cashRevenue: Math.round(cashRevenue * 100) / 100,
        upiRevenue: Math.round(upiRevenue * 100) / 100,
        splitRevenue: Math.round(splitRevenue * 100) / 100,
      },
    });
  } catch (err) {
    console.error('[Daily Report] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate daily report: ' + err.message });
  }
}
