import { useEffect, useState } from 'react';
import { useApp } from '../../context/useApp';
import Card from '../../components/ui/Card';
import TextField from '../../components/ui/TextField';
import SelectField from '../../components/ui/SelectField';
import Toggle from '../../components/ui/Toggle';
import Button from '../../components/ui/Button';

const CITIES = ['Islamabad', 'Lahore', 'Karachi', 'Peshawar', 'Gilgit'];
const NOTIF_DEFAULTS = { booking: true, priceDrop: true, messages: true, promo: false };
const PROFILE_KEY = 's360-profile';

function readProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function Profile() {
  const { theme, toggleTheme, currency, setCurrency, language, setLanguage } = useApp();

  const stored = readProfile();
  const [name, setName] = useState(stored?.name || '');
  const [city, setCity] = useState(stored?.city || CITIES[0]);
  const [distanceUnit, setDistanceUnit] = useState(stored?.distanceUnit || 'km');
  const [notifs, setNotifs] = useState({ ...NOTIF_DEFAULTS, ...(stored?.notifs || {}) });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 2400);
    return () => clearTimeout(t);
  }, [saved]);

  const setNotif = (key) => (value) => setNotifs((n) => ({ ...n, [key]: value }));

  const onSave = (e) => {
    e.preventDefault();
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify({ name, city, distanceUnit, notifs }));
    } catch {
      /* storage unavailable */
    }
    setSaved(true);
  };

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Profile &amp; preferences</h1>
        <p className="text-sm leading-relaxed text-fg-muted">
          Locale, currency, units and what we notify you about.
        </p>
      </div>

      <form onSubmit={onSave} className="flex flex-col gap-4">
        <Card className="flex flex-col gap-4 p-4 sm:p-5">
          <strong className="text-sm">Account</strong>
          <TextField
            label="Display name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
          <SelectField
            label="Home city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            options={CITIES.map((c) => ({ value: c, label: c }))}
          />
        </Card>

        <Card className="flex flex-col gap-4 p-4 sm:p-5">
          <strong className="text-sm">Display</strong>

          <div className="flex min-h-11 items-center justify-between gap-3">
            <span className="text-sm font-semibold text-fg">Language</span>
            <div className="flex gap-1.5">
              <Button
                type="button"
                variant={language === 'en' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setLanguage('en')}
              >
                English
              </Button>
              <Button
                type="button"
                variant={language === 'ur' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setLanguage('ur')}
              >
                اردو
              </Button>
            </div>
          </div>
          <p className="-mt-2 text-xs leading-relaxed text-fg-subtle">
            Interface translation is not finished yet — this saves your preference for when it is.
          </p>

          <div className="flex min-h-11 items-center justify-between gap-3 border-t border-border pt-3">
            <span className="text-sm font-semibold text-fg">Theme</span>
            <Button type="button" variant="secondary" size="sm" onClick={toggleTheme}>
              {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </Button>
          </div>

          <div className="border-t border-border pt-3">
            <SelectField
              label="Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              options={[
                { value: 'PKR', label: 'PKR — Pakistani Rupee' },
                { value: 'USD', label: 'USD — US Dollar' },
                { value: 'AED', label: 'AED — UAE Dirham' },
              ]}
              helper="You are always charged in PKR. This only changes what prices display as."
            />
          </div>

          <SelectField
            label="Distance unit"
            value={distanceUnit}
            onChange={(e) => setDistanceUnit(e.target.value)}
            options={[
              { value: 'km', label: 'Kilometres' },
              { value: 'mi', label: 'Miles' },
            ]}
          />
        </Card>

        <Card className="flex flex-col gap-1 p-4 sm:p-5">
          <strong className="mb-1 text-sm">Notifications</strong>
          <Toggle
            id="notif-booking"
            label="Booking updates"
            description="Confirmations, operator responses, payment outcomes"
            checked={notifs.booking}
            onChange={setNotif('booking')}
          />
          <Toggle
            id="notif-price"
            label="Price drops"
            description="On trips you've saved to your wishlist"
            checked={notifs.priceDrop}
            onChange={setNotif('priceDrop')}
          />
          <Toggle
            id="notif-messages"
            label="Messages"
            description="From operators and support"
            checked={notifs.messages}
            onChange={setNotif('messages')}
          />
          <Toggle
            id="notif-promo"
            label="Offers & promotions"
            description="Off by default"
            checked={notifs.promo}
            onChange={setNotif('promo')}
          />
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit">Save changes</Button>
          {saved && <span className="text-sm font-semibold text-success-text">Saved.</span>}
        </div>
      </form>
    </div>
  );
}
