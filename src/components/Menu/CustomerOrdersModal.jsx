import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';

export default function CustomerOrdersModal() {
  const {
    customerUser,
    setCustomerUser,
    isMyOrdersOpen,
    isCustomerLoginOpen,
    closeMyOrders,
    closeCustomerLogin,
    customerPreOrders,
    fetchCustomerOrders,
    isLoadingCustomerOrders,
    handleCustomerLogout,
    navigateTo,
  } = useCart();

  // Login form state
  const [loginPhone, setLoginPhone] = useState('');
  const [loginName, setLoginName] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-refresh orders when My Orders modal is open
  useEffect(() => {
    if (!isMyOrdersOpen || !customerUser?.phone) return;
    fetchCustomerOrders(customerUser.phone);
    const interval = setInterval(() => {
      fetchCustomerOrders(customerUser.phone);
    }, 4000);
    return () => clearInterval(interval);
  }, [isMyOrdersOpen, customerUser, fetchCustomerOrders]);

  // Handle customer login
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setLoginError('');
    const cleanPhone = loginPhone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length < 10) {
      setLoginError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setIsSubmitting(true);
    try {
      const user = {
        name: loginName.trim() || 'Highway Commuter',
        phone: cleanPhone,
        loggedInAt: new Date().toISOString(),
      };
      localStorage.setItem('thenisai_customer_user', JSON.stringify(user));
      setCustomerUser(user);
      fetchCustomerOrders(cleanPhone);
      closeCustomerLogin();
      // Open orders immediately
      setTimeout(() => {
        closeCustomerLogin();
        // Open my orders via context
        window.dispatchEvent(new CustomEvent('thenisai_open_my_orders'));
      }, 100);
    } catch {
      setLoginError('Failed to save session. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* ── 1. CUSTOMER LOGIN MODAL ────────────────────────────────────────── */}
      <AnimatePresence>
        {isCustomerLoginOpen && (
          <div
            className="fixed inset-0 z-[1000000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 font-sans"
            onClick={closeCustomerLogin}
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-[#EAE2D5] rounded-2xl w-full max-w-[400px] p-5 sm:p-6 shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F0EBE1]">
                <div>
                  <h3 className="font-display text-lg sm:text-xl font-bold text-[#1C130D]">
                    Customer Pre-Orders
                  </h3>
                  <p className="text-xs text-gray-500 m-0">
                    Enter mobile number to view and track your sweets pickup
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeCustomerLogin}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center text-sm cursor-pointer border-0"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              {loginError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-xl mb-3">
                  {loginError}
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Mobile Number (10 Digits)
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 93448 93547"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-[#C59334] focus:ring-1 focus:ring-[#C59334] outline-none"
                    maxLength={10}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Anand Kumar"
                    value={loginName}
                    onChange={(e) => setLoginName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-[#C59334] focus:ring-1 focus:ring-[#C59334] outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-full bg-[#C59334] hover:bg-[#A97922] text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer border-0 mt-2"
                >
                  {isSubmitting ? 'Verifying...' : 'View My Orders ↗'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── 2. MY PRE-ORDERS LIVE TRACKING MODAL ─────────────────────────── */}
      <AnimatePresence>
        {isMyOrdersOpen && (
          <div
            className="fixed inset-0 z-[1000000] bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 font-sans"
            onClick={closeMyOrders}
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-[#EAE2D5] rounded-2xl w-full max-w-[540px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-[#F0EBE1] bg-[#FAF7F2] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-lg sm:text-xl font-bold text-[#1C130D]">
                      My Pre-Orders
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-[#7B1812] text-[11px] font-bold">
                      {customerPreOrders.length} {customerPreOrders.length === 1 ? 'order' : 'orders'}
                    </span>
                  </div>
                  {customerUser && (
                    <p className="text-xs text-gray-600 m-0 mt-0.5">
                      Phone: <strong className="text-gray-900">+91 {customerUser.phone}</strong> &middot; {customerUser.name}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCustomerLogout}
                    className="px-2.5 py-1 text-xs text-red-700 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors font-semibold cursor-pointer"
                    title="Sign Out"
                  >
                    Logout
                  </button>
                  <button
                    type="button"
                    onClick={closeMyOrders}
                    className="w-8 h-8 rounded-full bg-white border border-[#EAE2D5] text-gray-700 flex items-center justify-center text-sm cursor-pointer"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Orders List / Scrollable Area */}
              <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1">
                {isLoadingCustomerOrders && customerPreOrders.length === 0 ? (
                  <div className="py-12 text-center text-xs text-gray-500">
                    Loading your pre-orders...
                  </div>
                ) : customerPreOrders.length === 0 ? (
                  <div className="py-10 text-center">
                    <span className="text-4xl block mb-2">🛍️</span>
                    <h4 className="font-bold text-base text-gray-900 mb-1">No Orders Found</h4>
                    <p className="text-xs text-gray-500 max-w-xs mx-auto mb-4">
                      You haven&apos;t placed any pre-orders for +91 {customerUser?.phone} yet. Pre-order fresh sweets now for instant counter pickup on NH 44!
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        closeMyOrders();
                        window.location.hash = '#menu';
                        navigateTo('menu');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="px-5 py-2.5 rounded-full bg-[#C59334] hover:bg-[#A97922] text-white font-bold text-xs shadow-sm cursor-pointer border-0"
                    >
                      Browse Sweets Menu ↗
                    </button>
                  </div>
                ) : (
                  customerPreOrders.map((order) => {
                    const status = order.status || 'pending';
                    const isAccepted = status === 'accepted' || status === 'confirmed';
                    const isCompleted = status === 'completed' || status === 'billed';

                    return (
                      <div
                        key={order.id || order.invoiceNumber}
                        className="bg-white border border-[#EAE2D5] rounded-xl p-3.5 sm:p-4 shadow-2xs space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2">
                          <div>
                            <span className="font-bold text-xs text-gray-900 block">
                              #{order.invoiceNumber || order.id}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently placed'}
                            </span>
                          </div>

                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              isCompleted
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : isAccepted
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {isCompleted ? '✓ Completed' : isAccepted ? '🔥 Kitchen Ready' : '⏳ Order Received'}
                          </span>
                        </div>

                        {/* Order Items */}
                        <div className="space-y-1 text-xs">
                          {(order.items || []).map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-gray-700">
                              <span>
                                {item.name || item.tamilName} ({item.portion || item.unit || 'Standard'}) &times; {item.quantity}
                              </span>
                              <span className="font-semibold text-gray-900">₹{item.subtotal || (item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Order Total & Pickup Note */}
                        <div className="flex items-center justify-between pt-2 border-t border-dashed border-gray-200 text-xs">
                          <span className="text-gray-500">
                            Counter Pickup · Pay ₹{order.grandTotal || order.total}
                          </span>
                          <strong className="text-sm font-bold text-[#7B1812]">
                            ₹{order.grandTotal || order.total}
                          </strong>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-3 bg-[#FAF7F2] border-t border-[#F0EBE1] flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  NH 44 Highway Store &middot; 6:00 AM &ndash; 10:30 PM
                </span>
                <a
                  href="tel:+919344893547"
                  className="text-[#7B1812] font-bold no-underline hover:underline"
                >
                  📞 Help: +91 93448 93547
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
