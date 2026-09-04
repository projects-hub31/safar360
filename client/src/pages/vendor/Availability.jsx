import { useEffect, useState } from 'react';
import { useVendor } from '../../context/vendor/useVendor';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import TextField from '../../components/ui/TextField';
import SelectField from '../../components/ui/SelectField';
import EmptyState from '../../components/ui/EmptyState';

export default function Availability() {
  const { listings, fetchListings, addDeparture, setDepartureSeats, toggleBlackout } = useVendor();
  const [listingId, setListingId] = useState(listings[0]?.id || null);
  const [date, setDate] = useState('');
  const [seats, setSeats] = useState(10);
  const [floorNote, setFloorNote] = useState(null);

  useEffect(() => {
    fetchListings();
    // Runs once on mount — fetchListings is stable (useCallback, no deps).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!listings.length) {
    return (
      <EmptyState
        title="No listings to set availability for"
        body="Create a listing first — departures and seat caps belong to a specific listing."
        actionLabel="Go to listings"
        actionTo="/vendor/listings"
      />
    );
  }

  const listing = listings.find((l) => l.id === listingId) || listings[0];

  const onAdd = () => {
    if (!date) return;
    addDeparture(listing.id, { date, seats: Number(seats) });
    setDate('');
  };

  const onSetSeats = async (depId, value) => {
    const result = await setDepartureSeats(listing.id, depId, Number(value));
    if (!result.ok) {
      setFloorNote({ depId, floor: result.floor });
      setTimeout(() => setFloorNote(null), 4000);
    }
  };

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-4">
      <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Availability editor</h1>

      <SelectField
        label="Listing"
        value={listing.id}
        onChange={(e) => setListingId(e.target.value)}
        options={listings.map((l) => ({ value: l.id, label: l.title || 'Untitled listing' }))}
      />

      <Card className="flex flex-col gap-3 p-4 sm:p-5">
        <strong className="text-sm">Add a departure</strong>
        <div className="flex flex-wrap items-end gap-2">
          <TextField label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <TextField label="Seat cap" type="number" min={1} value={seats} onChange={(e) => setSeats(e.target.value)} className="w-28" />
          <Button onClick={onAdd} disabled={!date}>Add</Button>
        </div>
      </Card>

      <Card className="flex flex-col gap-2 p-4 sm:p-5">
        <strong className="text-sm">Departures</strong>
        {listing.departures.length === 0 && <span className="text-xs text-fg-muted">None yet — add one above.</span>}
        {listing.departures.map((d) => (
          <div key={d.id} className="flex flex-col gap-1.5 border-t border-border py-2 first:border-0 first:pt-0">
            <div className="flex flex-wrap items-center gap-3">
              <span className="min-w-[90px] text-sm font-semibold">{d.date}</span>
              <TextField
                aria-label={`Seat cap for ${d.date}`}
                type="number"
                min={d.booked}
                value={d.seats}
                onChange={(e) => onSetSeats(d.id, e.target.value)}
                className="w-24"
              />
              <span className="text-xs text-fg-muted">{d.booked} booked</span>
              <Button size="sm" variant={d.blackout ? 'destructive' : 'secondary'} onClick={() => toggleBlackout(listing.id, d.id)}>
                {d.blackout ? 'Blacked out' : 'Blackout'}
              </Button>
            </div>
            {floorNote?.depId === d.id && (
              <span className="text-xs text-danger-text">
                You can't set the cap below {floorNote.floor} — that many travellers have already paid for this date.
              </span>
            )}
          </div>
        ))}
      </Card>
      <p className="text-xs leading-relaxed text-fg-subtle">
        Availability is the one number two systems fight over — the real check runs on the server too; this screen
        is the explanation, not the safeguard. Blackout dates hide from search but never cancel existing bookings.
      </p>
    </div>
  );
}
