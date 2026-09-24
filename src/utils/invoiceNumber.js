/**
 * Vehicle Registration Style Invoice Number Generator & Parser
 * Format: Two alphabets + 3 digits (e.g. AA001 to AA999, then AB001 to AB999, ..., AZ999, BA001...)
 */

/**
 * Format a 1-based sequence integer into AA001 vehicle registration format
 * @param {number} n - 1-based sequence number (1 -> AA001, 999 -> AA999, 1000 -> AB001...)
 * @returns {string} - Formatted invoice number
 */
export function formatInvoiceNumber(n) {
  const num = Math.max(1, parseInt(n, 10) || 1);
  const seriesIndex = Math.floor((num - 1) / 999);
  const numInSeries = ((num - 1) % 999) + 1;

  const firstLetterIdx = Math.min(25, Math.floor(seriesIndex / 26));
  const secondLetterIdx = seriesIndex % 26;

  const l1 = String.fromCharCode(65 + firstLetterIdx);
  const l2 = String.fromCharCode(65 + secondLetterIdx);

  return `${l1}${l2}${String(numInSeries).padStart(3, '0')}`;
}

/**
 * Parse an invoice number string back into its integer sequence number
 * @param {string} str - Invoice number string (e.g. "AA001", "AB999", "POS-1", "TEST-2026-1")
 * @returns {number} - 1-based integer sequence number, or 0 if unparseable
 */
export function parseInvoiceNumber(str) {
  if (!str) return 0;
  const s = String(str).trim().toUpperCase();

  // 1. Vehicle reg style: AA001 to ZZ999, optionally with PRE - ORD prefix
  const vMatch = s.match(/^(?:PRE\s*-\s*ORD\s*[- ]*\s*)?([A-Z]{2})(\d{3})$/);
  if (vMatch) {
    const l1 = vMatch[1].charCodeAt(0) - 65;
    const l2 = vMatch[1].charCodeAt(1) - 65;
    const num = parseInt(vMatch[2], 10);
    return (l1 * 26 + l2) * 999 + num;
  }

  // 2. Sandbox format: TEST-2026-1
  const tMatch = s.match(/^TEST-\d+-(\d+)$/i);
  if (tMatch) {
    return parseInt(tMatch[1], 10);
  }

  // 3. Legacy POS-1 or raw numeric format
  const pMatch = s.match(/^POS-(\d+)$/i) || s.match(/^(\d+)$/);
  if (pMatch) {
    return parseInt(pMatch[1], 10);
  }

  return 0;
}

/**
 * Format a 1-based sequence integer into PRE - ORD AA001 pre-order format
 * @param {number} n - 1-based sequence number
 * @returns {string} - Formatted pre-order invoice number (e.g. "PRE - ORD AA001")
 */
export function formatPreOrderInvoiceNumber(n) {
  return `PRE - ORD ${formatInvoiceNumber(n)}`;
}

/**
 * Calculate the next continuous unique sequential invoice number.
 * Starts at AA001 (or 1) if all bills are deleted.
 * Never repeats or reuses an existing active invoice number across POS and Pre-Orders.
 *
 * @param {Array} activeBills - List of existing active bill/preorder objects
 * @param {boolean} isSandbox - Whether sandbox/test mode is active
 * @param {boolean} isPreOrder - Whether to format with "PRE - ORD " prefix
 * @returns {string} - Next unique invoice number
 */
export function getNextInvoiceNumber(activeBills = [], isSandbox = false, isPreOrder = false) {
  const year = new Date().getFullYear();

  const existingNums = (activeBills || [])
    .map((b) => parseInvoiceNumber(b?.invoiceNumber || b?.invoiceNo || b?.id))
    .filter((n) => n > 0);

  let nextSeq = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;

  const existingInvoices = new Set(
    (activeBills || [])
      .map((b) => String(b?.invoiceNumber || b?.invoiceNo || '').trim().toUpperCase())
      .filter(Boolean)
  );

  const makeCandidate = (seq) => {
    if (isSandbox) return `TEST-${year}-${seq}`;
    return isPreOrder ? formatPreOrderInvoiceNumber(seq) : formatInvoiceNumber(seq);
  };

  let candidate = makeCandidate(nextSeq);
  while (
    existingInvoices.has(candidate.toUpperCase()) ||
    existingInvoices.has(formatInvoiceNumber(nextSeq).toUpperCase()) ||
    existingInvoices.has(formatPreOrderInvoiceNumber(nextSeq).toUpperCase())
  ) {
    nextSeq += 1;
    candidate = makeCandidate(nextSeq);
  }

  return candidate;
}

/**
 * Calculate the next sequential pre-order invoice number (e.g. "PRE - ORD AA001")
 * @param {Array} activeBills - List of existing bills and pre-orders
 * @param {boolean} isSandbox - Whether sandbox mode is active
 * @returns {string}
 */
export function getNextPreOrderInvoiceNumber(activeBills = [], isSandbox = false) {
  return getNextInvoiceNumber(activeBills, isSandbox, true);
}
