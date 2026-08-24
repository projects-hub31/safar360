import { useEffect, useState } from 'react';
import { AppContext } from './app-context';

const RATES = { PKR: 1, USD: 278, AED: 76 };
const SYMBOLS = { PKR: 'Rs ', USD: '$ ', AED: 'AED ' };

function readStored(key, fallback) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

export function AppProvider({ children }) {
  const [theme, setTheme] = useState(() => readStored('s360-theme', 'light'));
  const [currency, setCurrency] = useState(() => readStored('s360-currency', 'PKR'));
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('s360-theme', theme); } catch { /* storage unavailable */ }
  }, [theme]);

  useEffect(() => {
    try { localStorage.setItem('s360-currency', currency); } catch { /* storage unavailable */ }
  }, [currency]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  const toggleWishlist = (tourId) =>
    setWishlist((w) => (w.includes(tourId) ? w.filter((id) => id !== tourId) : w.concat(tourId)));

  // Charges always run in PKR; this only changes what is displayed.
  const formatMoney = (pkrAmount) => {
    const rate = RATES[currency] || 1;
    const value = currency === 'PKR' ? pkrAmount : Math.round(pkrAmount / rate);
    return SYMBOLS[currency] + value.toLocaleString('en-US');
  };

  const value = { theme, toggleTheme, currency, setCurrency, formatMoney, wishlist, toggleWishlist };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
