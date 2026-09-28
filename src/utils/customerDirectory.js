/**
 * Thenisai POS & Invoice Customer Directory Utility
 * Provides persistent customer storage, syncing with past bills,
 * and high-speed auto-suggest matching for 1st digits or last four numbers.
 */

const STORAGE_KEY = 'thenisai_saved_customers';

/**
 * Normalizes an Indian or standard phone number to 10 clean digits.
 */
export function normalizePhone(rawPhone) {
  if (!rawPhone) return '';
  const digits = String(rawPhone).replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  if (digits.length > 10) {
    return digits.slice(-10);
  }
  return digits;
}

/**
 * Checks if a phone number is a valid 10-digit customer mobile number.
 */
export function isValidCustomerPhone(rawPhone) {
  const clean = normalizePhone(rawPhone);
  if (clean.length !== 10) return false;
  // Reject dummy repeating numbers
  if (/^(\d)\1{9}$/.test(clean)) return false;
  return true;
}

/**
 * Checks if a customer name is valid (not a generic walk-in placeholder).
 */
export function isValidCustomerName(rawName) {
  if (!rawName || typeof rawName !== 'string') return false;
  const trimmed = rawName.trim().toLowerCase();
  if (!trimmed) return false;
  const genericPlaceholders = [
    'walk-in',
    'walk-in customer',
    'walk-in guest',
    'walk in',
    'walk in customer',
    'walk in guest',
    'store counter',
    'counter desk',
    'counter desk 01',
    'guest',
    'cashier',
    'customer',
  ];
  return !genericPlaceholders.includes(trimmed);
}

/**
 * Retrieves all saved customers from localStorage merged with existing bills.
 * @param {Array} bills - Optional array of bills to index historical customers from
 * @returns {Array} List of unique customers sorted by recency
 */
export function getSavedCustomers(bills = []) {
  const customerMap = new Map();

  // 1. Load from localStorage
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        list.forEach((c) => {
          const cleanPhone = normalizePhone(c.phone);
          if (cleanPhone.length >= 10) {
            customerMap.set(cleanPhone, {
              phone: cleanPhone,
              name: (c.name || '').trim(),
              lastVisit: Number(c.lastVisit) || Date.now(),
              orderCount: Number(c.orderCount) || 1,
            });
          }
        });
      }
    }
  } catch (err) {
    console.warn('[CustomerDirectory] Failed to read saved customers:', err);
  }

  // 2. Scan past bills to discover and enrich customer records
  if (Array.isArray(bills) && bills.length > 0) {
    bills.forEach((b) => {
      const custPhone = normalizePhone(b?.customer?.phone);
      if (isValidCustomerPhone(custPhone)) {
        const custName = (b?.customer?.fullName || '').trim();
        const hasValidName = isValidCustomerName(custName);
        const billTime = b?.createdAt ? new Date(b.createdAt).getTime() : 0;

        if (customerMap.has(custPhone)) {
          const existing = customerMap.get(custPhone);
          existing.orderCount = (existing.orderCount || 1) + 1;
          if (billTime > (existing.lastVisit || 0)) {
            existing.lastVisit = billTime;
          }
          if (hasValidName && (!existing.name || !isValidCustomerName(existing.name))) {
            existing.name = custName;
          }
        } else {
          customerMap.set(custPhone, {
            phone: custPhone,
            name: hasValidName ? custName : '',
            lastVisit: billTime || Date.now(),
            orderCount: 1,
          });
        }
      }
    });
  }

  const result = Array.from(customerMap.values()).sort((a, b) => (b.lastVisit || 0) - (a.lastVisit || 0));

  // Persist updated merged index
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
  } catch {}

  return result;
}

/**
 * Saves or updates a customer in the directory and notifies listeners.
 */
export function saveCustomerToDirectory(rawName, rawPhone, meta = {}) {
  const cleanPhone = normalizePhone(rawPhone);
  if (!cleanPhone || cleanPhone.length < 10) return null;

  const validName = isValidCustomerName(rawName) ? rawName.trim() : (rawName?.trim() || '');

  try {
    const list = getSavedCustomers();
    const existingIndex = list.findIndex((c) => c.phone === cleanPhone);

    const updatedCustomer = {
      phone: cleanPhone,
      name: validName || (existingIndex >= 0 ? list[existingIndex].name : ''),
      lastVisit: Date.now(),
      orderCount: (existingIndex >= 0 ? (list[existingIndex].orderCount || 0) + 1 : 1),
      ...meta,
    };

    if (existingIndex >= 0) {
      list[existingIndex] = updatedCustomer;
    } else {
      list.unshift(updatedCustomer);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

    // Dispatch global custom event for instant cross-component sync
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('thenisai_customers_updated', {
          detail: { customer: updatedCustomer },
        })
      );
    }

    return updatedCustomer;
  } catch (err) {
    console.warn('[CustomerDirectory] Failed to save customer:', err);
    return null;
  }
}

/**
 * High-speed search for customers by 1st digits, last 4 digits, or name.
 * @param {string} query - The search query (numbers or name)
 * @param {Array} customerList - The list of customers to search within
 * @param {number} maxResults - Max items to return
 */
export function searchCustomers(query, customerList = [], maxResults = 7) {
  if (!query || typeof query !== 'string') return [];
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const queryDigits = trimmed.replace(/\D/g, '');
  const queryText = trimmed.toLowerCase();
  const hasDigits = queryDigits.length >= 2;

  const scoredMatches = [];

  customerList.forEach((c) => {
    const p = c.phone || '';
    const n = (c.name || '').toLowerCase();
    let score = 0;
    let matchType = null;
    let matchSnippet = '';

    // Check last four numbers (e.g. typing "3547" or ending digits)
    if (hasDigits && p.endsWith(queryDigits)) {
      score += 150 + queryDigits.length * 10;
      matchType = 'lastDigits';
      matchSnippet = `Ends with ...${queryDigits}`;
    }
    // Check 1st numbers (e.g. typing "9344")
    else if (hasDigits && p.startsWith(queryDigits)) {
      score += 130 + queryDigits.length * 5;
      matchType = 'firstDigits';
      matchSnippet = `Starts with ${queryDigits}...`;
    }
    // Check anywhere in phone number
    else if (hasDigits && p.includes(queryDigits)) {
      score += 80;
      matchType = 'containsDigits';
      matchSnippet = `Contains ${queryDigits}`;
    }

    // Check customer name
    if (queryText.length >= 2 && n.includes(queryText)) {
      if (n.startsWith(queryText)) {
        score += 120;
      } else {
        score += 90;
      }
      if (!matchType) {
        matchType = 'name';
        matchSnippet = `Name match`;
      }
    }

    if (score > 0) {
      // Add bonus for order count / repeat visits
      score += Math.min(Number(c.orderCount || 1) * 2, 20);

      scoredMatches.push({
        ...c,
        score,
        matchType,
        matchSnippet,
      });
    }
  });

  scoredMatches.sort((a, b) => b.score - a.score || (b.lastVisit || 0) - (a.lastVisit || 0));

  return scoredMatches.slice(0, maxResults);
}
