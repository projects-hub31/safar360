import { useApp } from '../../context/useApp';
import { TOURS } from '../../data/traveler/tours';
import TourCard from '../../components/traveler/TourCard';
import EmptyState from '../../components/ui/EmptyState';

export default function Wishlist() {
  const { wishlist } = useApp();
  const saved = TOURS.filter((t) => wishlist.includes(t.id));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Wishlist</h1>
        <p className="text-sm leading-relaxed text-fg-muted">
          {saved.length ? `${saved.length} saved trip${saved.length === 1 ? '' : 's'}.` : 'Nothing saved yet.'}
        </p>
      </div>

      {saved.length ? (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {saved.map((t) => (
            <TourCard key={t.id} tour={t} layout="vertical" />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Every safar starts with one saved place."
          body="Tap the star on any trip to keep it here — nothing is held or booked until you say so."
          actionLabel="Browse trips"
          actionTo="/discover/search"
        />
      )}
    </div>
  );
}
