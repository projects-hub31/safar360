import { useAuth } from '../../context/auth/useAuth';
import { useTransport } from '../../context/transport/useTransport';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusPill from '../../components/ui/StatusPill';

export default function Property() {
  const { user } = useAuth();
  const { rooms, menu, leads } = useTransport();

  const kycApproved = user?.kycStatus === 'approved';
  const openTables = leads.filter((l) => l.kind === 'table' || l.kind === 'group').filter((l) => l.status === 'request').length;
  const roomsBooked = rooms.reduce((n, r) => n + r.booked, 0);
  const roomsTotal = rooms.reduce((n, r) => n + r.total, 0);
  const menuOn = menu.filter((m) => m.on).length;

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Property</h1>
        <p className="text-sm text-fg-muted">{user?.kyc?.businessName || 'Your property'}</p>
      </div>

      <Card className={`flex items-center justify-between gap-3 p-4 ${kycApproved ? 'border-success' : 'border-warning'}`}>
        <span className="text-sm">
          {kycApproved ? 'Identity verified — rooms can take real reservations.' : `Identity verification is ${user?.kycStatus || 'not started'} — complete it to accept paid reservations.`}
        </span>
        <StatusPill tone={kycApproved ? 'success' : 'warning'}>{kycApproved ? 'Verified' : 'Pending'}</StatusPill>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card className="flex flex-col gap-1 p-4">
          <span className="font-mono text-2xl font-semibold">{roomsBooked}/{roomsTotal}</span>
          <span className="text-xs text-fg-muted">Rooms booked</span>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <span className="font-mono text-2xl font-semibold">{menuOn}/{menu.length}</span>
          <span className="text-xs text-fg-muted">Dishes on the menu</span>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <span className="font-mono text-2xl font-semibold">{openTables}</span>
          <span className="text-xs text-fg-muted">Table/group enquiries waiting</span>
        </Card>
      </div>

      <Card className="flex flex-col gap-2 p-4 sm:p-5">
        <strong className="text-sm">Rooms are booked, enquiries are not</strong>
        <p className="text-[13px] leading-relaxed text-fg-muted">
          Room reservations take payment and reduce availability the moment a traveller pays — the same instant-
          booking machine a tour uses. Restaurant tables and group requests are leads: no table is held, no payment
          is taken, until you send a quote and the traveller accepts it.
        </p>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button to="/transport/rooms">Rooms</Button>
        <Button to="/transport/menu" variant="secondary">Menu</Button>
        <Button to="/transport/enquiries" variant="secondary">Enquiries {openTables > 0 ? `(${openTables})` : ''}</Button>
        <Button to="/transport/featured" variant="secondary">Featured placement</Button>
      </div>
    </div>
  );
}
