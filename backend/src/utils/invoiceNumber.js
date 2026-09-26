import { Bill, PreOrder } from '../models/index.js';

export function formatInvoiceNumber(n) {
  const num = Math.max(1, parseInt(n, 10) || 1);
  const seriesIndex = Math.floor((num - 1) / 999);
  const numInSeries = ((num - 1) % 999) + 1;
  const l1 = String.fromCharCode(65 + Math.min(25, Math.floor(seriesIndex / 26)));
  const l2 = String.fromCharCode(65 + (seriesIndex % 26));
  return `${l1}${l2}${String(numInSeries).padStart(3, '0')}`;
}

export function formatPreOrderInvoiceNumber(n) {
  return `PRE - ORD ${formatInvoiceNumber(n)}`;
}

export function parseInvoiceNumber(str) {
  if (!str) return 0;
  const s = String(str).trim().toUpperCase();
  const vMatch = s.match(/^(?:PRE\s*-\s*ORD\s*[- ]*\s*)?([A-Z]{2})(\d{3})$/);
  if (vMatch) {
    const l1 = vMatch[1].charCodeAt(0) - 65;
    const l2 = vMatch[1].charCodeAt(1) - 65;
    const num = parseInt(vMatch[2], 10);
    return (l1 * 26 + l2) * 999 + num;
  }
  const tMatch = s.match(/^TEST-\d+-(\d+)$/i);
  if (tMatch) return parseInt(tMatch[1], 10);
  const pMatch = s.match(/^POS-(\d+)$/i) || s.match(/^(\d+)$/);
  if (pMatch) return parseInt(pMatch[1], 10);
  return 0;
}

let serverInvoiceMutex = Promise.resolve();

export async function getNextServerInvoiceNumber(isPreOrder = false) {
  return new Promise((resolve) => {
    serverInvoiceMutex = serverInvoiceMutex.then(async () => {
      try {
        const allBills = await Bill.find({}, 'invoiceNumber').lean();
        let allPreOrders = [];
        try {
          allPreOrders = await PreOrder.find({}, 'invoiceNumber').lean();
        } catch {}

        const allRecords = [...allBills, ...allPreOrders];
        let maxSeq = 0;
        const taken = new Set();
        for (const b of allRecords) {
          if (b.invoiceNumber) {
            taken.add(b.invoiceNumber.trim().toUpperCase());
            const seq = parseInvoiceNumber(b.invoiceNumber);
            if (seq > maxSeq) maxSeq = seq;
          }
        }

        let nextSeq = maxSeq + 1;
        let rawCandidate = formatInvoiceNumber(nextSeq);
        let candidate = isPreOrder ? `PRE - ORD ${rawCandidate}` : rawCandidate;

        while (
          taken.has(candidate.toUpperCase()) ||
          taken.has(rawCandidate.toUpperCase()) ||
          taken.has(`PRE - ORD ${rawCandidate}`.toUpperCase()) ||
          taken.has(`PRE-ORD ${rawCandidate}`.toUpperCase())
        ) {
          nextSeq += 1;
          rawCandidate = formatInvoiceNumber(nextSeq);
          candidate = isPreOrder ? `PRE - ORD ${rawCandidate}` : rawCandidate;
        }

        resolve(candidate);
      } catch (err) {
        console.error('[Invoice Gen] Error generating server invoice number:', err);
        const fb = isPreOrder ? 'PRE - ORD AA001' : 'AA001';
        resolve(fb);
      }
    });
  });
}
