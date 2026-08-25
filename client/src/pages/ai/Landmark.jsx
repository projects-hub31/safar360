import { useParams } from 'react-router-dom';
import { landmarkById } from '../../data/ai/landmarks';
import { TOURS } from '../../data/traveler/tours';
import { useApp } from '../../context/app/useApp';
import { useAi } from '../../context/ai/useAi';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusPill from '../../components/ui/StatusPill';
import EmptyState from '../../components/ui/EmptyState';

export default function Landmark() {
  const { id } = useParams();
  const { formatMoney } = useApp();
  const { checkIns } = useAi();
  const landmark = landmarkById(id);

  if (!landmark) {
    return <EmptyState title="Landmark not found" body="This may have been removed from the curated collection." actionLabel="Back to map" actionTo="/ai/map" />;
  }

  const relatedTours = landmark.relatedTourIds.map((tid) => TOURS.find((t) => t.id === tid)).filter(Boolean);
  const checkedIn = checkIns[landmark.id];

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{landmark.name}</h1>
          {checkedIn && <StatusPill tone="success" icon="✓">Checked in</StatusPill>}
        </div>
        <p className="text-sm text-fg-muted">{landmark.region} · {landmark.elevation}</p>
      </div>

      <p className="text-sm leading-relaxed text-fg">{landmark.blurb}</p>

      <Card className="flex flex-col gap-2 p-4 sm:p-5">
        <span className="text-[12.5px] font-bold text-fg">Facts</span>
        <ul className="flex flex-col gap-1.5">
          {landmark.facts.map((f, i) => (
            <li key={i} className="flex gap-2 text-sm leading-relaxed text-fg-muted">
              <span aria-hidden="true" className="text-primary">·</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="flex flex-col gap-1.5 p-4 sm:p-5">
        <span className="text-[12.5px] font-bold text-fg">Getting there</span>
        <p className="text-sm leading-relaxed text-fg-muted">{landmark.accessNotes}</p>
      </Card>

      {relatedTours.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-[12.5px] font-bold text-fg">Related tours</span>
          {relatedTours.map((t) => (
            <Card key={t.id} className="flex items-center justify-between gap-3 p-3.5">
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-[13.5px] font-semibold text-fg">{t.title}</span>
                <span className="text-xs text-fg-muted">★ {t.rating.toFixed(1)} · {formatMoney(t.price)}</span>
              </span>
              <Button size="sm" to={`/discover/tour/${t.id}`}>View</Button>
            </Card>
          ))}
        </div>
      )}

      <Button variant="secondary" fullWidth to={`/ai/geofence/${landmark.id}`}>
        {checkedIn ? 'Check in again' : 'Check in here'}
      </Button>
    </div>
  );
}
