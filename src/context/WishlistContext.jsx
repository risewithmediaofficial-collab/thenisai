import { createContext, useContext, useState, useEffect } from 'react';
import { SWEETS_CATALOG, SPECIAL_BOX } from '../data/sweetsData';
import { useScrollLock } from '../hooks/useScrollLock';

const WishlistContext = createContext(null);

const VALID_SWEET_IDS = new Set([...SWEETS_CATALOG.map((s) => s.id), SPECIAL_BOX.id]);

export function WishlistProvider({ children }) {
  // Saved wishlist product IDs (only authentic sweets allowed)
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('thenisai_wishlist');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.filter((id) => VALID_SWEET_IDS.has(id)) : [];
    } catch {
      return [];
    }
  });

  // Logged-in customer profile
  const [customer, setCustomer] = useState(() => {
    try {
      const saved = localStorage.getItem('thenisai_customer');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Drawers and Modals
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingProductId, setPendingProductId] = useState(null);

  // SCREEN SCROLL LOCK WHEN WISHLIST DRAWER OR AUTH POPUP IS ACTIVE
  useScrollLock(isWishlistOpen || isAuthModalOpen);

  // Sync state to local storage and prune any legacy non-sweet items
  useEffect(() => {
    try {
      const cleanWishlist = wishlist.filter((id) => VALID_SWEET_IDS.has(id));
      localStorage.setItem('thenisai_wishlist', JSON.stringify(cleanWishlist));
    } catch (e) {
      console.error('Failed to save wishlist locally', e);
    }
  }, [wishlist]);

  // Cleanse any non-sweet IDs on mount
  useEffect(() => {
    setWishlist((prev) => {
      const filtered = prev.filter((id) => VALID_SWEET_IDS.has(id));
      return filtered.length !== prev.length ? filtered : prev;
    });
  }, []);

  useEffect(() => {
    try {
      if (customer) {
        localStorage.setItem('thenisai_customer', JSON.stringify(customer));
      } else {
        localStorage.removeItem('thenisai_customer');
      }
    } catch (e) {
      console.error('Failed to save customer locally', e);
    }
  }, [customer]);

  // Sync wishlist from backend on initial mount if customer is logged in
  useEffect(() => {
    if (customer?.phone) {
      fetch(`/api/customer/me?phone=${customer.phone}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.customer?.wishlist) {
            const valid = data.customer.wishlist.filter((id) => VALID_SWEET_IDS.has(id));
            setWishlist(valid);
          }
        })
        .catch(() => {});
    }
  }, [customer?.phone]);

  const isInWishlist = (productId) => {
    return wishlist.includes(productId);
  };

  const toggleWishlist = async (productId) => {
    if (!productId || !VALID_SWEET_IDS.has(productId)) return;

    // If customer is NOT logged in via mobile number + OTP, ask for phone & OTP first
    if (!customer?.phone) {
      setPendingProductId(productId);
      setIsAuthModalOpen(true);
      return;
    }

    // Customer is logged in: toggle immediately
    const exists = wishlist.includes(productId);
    const updated = exists
      ? wishlist.filter((id) => id !== productId)
      : [...wishlist, productId];

    setWishlist(updated);

    try {
      await fetch('/api/customer/wishlist/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: customer.phone, productId }),
      });
    } catch (err) {
      console.error('Error syncing wishlist with server', err);
    }
  };

  const removeFromWishlist = async (productId) => {
    const updated = wishlist.filter((id) => id !== productId);
    setWishlist(updated);

    if (customer?.phone) {
      try {
        await fetch('/api/customer/wishlist/toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: customer.phone, productId }),
        });
      } catch (err) {
        console.error('Error removing item from wishlist', err);
      }
    }
  };

  // Send OTP to 10-digit mobile number
  const sendOtp = async (phone) => {
    const res = await fetch('/api/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    return res.json();
  };

  // Verify OTP and create customer account
  const verifyOtpAndLogin = async (phone, otp, name) => {
    const res = await fetch('/api/customer/auth-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp, name }),
    });

    const data = await res.json();
    if (data.success && data.customer) {
      setCustomer(data.customer);

      // Merge any pending product into wishlist
      let nextList = data.customer.wishlist || [];
      if (pendingProductId && !nextList.includes(pendingProductId)) {
        nextList = [...nextList, pendingProductId];
        try {
          await fetch('/api/customer/wishlist/toggle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: data.customer.phone, productId: pendingProductId }),
          });
        } catch {}
      }

      setWishlist(nextList);
      setPendingProductId(null);
      setIsAuthModalOpen(false);
      setIsWishlistOpen(true);
    }

    return data;
  };

  const logoutCustomer = () => {
    setCustomer(null);
    setWishlist([]);
    localStorage.removeItem('thenisai_customer');
    localStorage.removeItem('thenisai_wishlist');
    setIsWishlistOpen(false);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        customer,
        isWishlistOpen,
        setIsWishlistOpen,
        isAuthModalOpen,
        setIsAuthModalOpen,
        pendingProductId,
        setPendingProductId,
        isInWishlist,
        toggleWishlist,
        removeFromWishlist,
        sendOtp,
        verifyOtpAndLogin,
        logoutCustomer,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return ctx;
}
