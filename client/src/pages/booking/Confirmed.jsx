import { useLocation } from 'react-router-dom';
import { useApp } from '../../context/useApp';
import { useBooking } from '../../context/useBooking';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';

export default function Confirmed() {
  const location = useLocation();
  const { formatMoney } = useApp();
  const { bookings } = useBooking();

  const refFromNav = location.state?.ref;
  const booking = refFromNav
    ? bookings.find((b) => b.ref === refFromNav)
    : bookings[bookings.length - 1];

  if (!booking) {
    return (
      <EmptyState
        title="No confirmed booking to show"
        body="Once a payment clears, its e-ticket lands here."
        actionLabel="Browse trips"
        actionTo="/discover/search"
      />
    );
  }

  const mutations = [
    `Availability: ${booking.title} · ${booking.seats} seat${booking.seats === 1 ? '' : 's'} deducted`,
    'Booking count +1 · operator inbox notified',
    'Notification sent: e-ticket by SMS',
  ];

  return (
    <div className="mx-auto flex max-w-[520px] flex-col gap-4">
      <Card className="flex flex-col items-center gap-4 p-8 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-success-soft text-2xl text-success-text">✓</span>
        <span className="font-display text-2xl font-semibold tracking-tight">Booking confirmed</span>
        <p className="text-sm leading-relaxed text-fg-muted">{booking.title}</p>

        <div className="flex w-full flex-col gap-2 rounded-xl border border-dashed border-border-loud p-4">
          <span className="font-mono text-[11px] uppercase tracking-wider text-fg-subtle">E-ticket</span>
          <span dir="ltr" className="font-mono text-lg font-bold tracking-wide">{booking.ref}</span>
          <div className="grid grid-cols-2 gap-y-1 pt-2 text-start text-sm">
            <span className="text-fg-muted">Seats</span>
            <span className="text-end font-mono">{booking.seats}</span>
            <span className="text-fg-muted">Paid</span>
            <span className="text-end font-mono">{formatMoney(booking.total)}</span>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-fg-muted">
          Your e-ticket was also sent by SMS. You are not charged again — retrying this page is safe.
        </p>
      </Card>

      <Card className="flex flex-col gap-1.5 p-4 text-xs sm:p-5">
        <strong className="mb-1 text-[13px] text-fg">What changed in the system</strong>
        <div dir="ltr" className="flex flex-col gap-1 font-mono text-fg-muted">
          {mutations.map((m) => <span key={m}>· {m}</span>)}
        </div>
      </Card>

      <div className="flex gap-2">
        <Button to="/booking/history" variant="secondary" fullWidth>View bookings</Button>
        <Button to="/discover/home" fullWidth>Continue</Button>
      </div>
    </div>
  );
}
