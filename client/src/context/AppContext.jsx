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
  // Preference only for now — screen copy stays English either way until a
  // translation pass happens (see CLAUDE.md open questions).
  const [language, setLanguage] = useState(() => readStored('s360-language', 'en'));
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('s360-theme', theme); } catch { /* storage unavailable */ }
  }, [theme]);

  useEffect(() => {
    try { localStorage.setItem('s360-currency', currency); } catch { /* storage unavailable */ }
  }, [currency]);

  useEffect(() => {
    // Intentionally NOT flipping `dir` here — no screen has RTL-aware layout
    // yet (logical inset/margin properties, mirrored icons). Doing that now
    // would silently break every existing screen rather than translate it.
    // See CLAUDE.md open questions: RTL is a real, separate build task.
    document.documentElement.setAttribute('lang', language);
    try { localStorage.setItem('s360-language', language); } catch { /* storage unavailable */ }
  }, [language]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  const toggleWishlist = (tourId) =>
    setWishlist((w) => (w.includes(tourId) ? w.filter((id) => id !== tourId) : w.concat(tourId)));

  // Charges always run in PKR; this only changes what is displayed.
  const formatMoney = (pkrAmount) => {
    const rate = RATES[currency] || 1;
    const value = currency === 'PKR' ? pkrAmount : Math.round(pkrAmount / rate);
    return SYMBOLS[currency] + value.toLocaleString('en-US');
  };

  const value = { theme, toggleTheme, currency, setCurrency, language, setLanguage, formatMoney, wishlist, toggleWishlist };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
