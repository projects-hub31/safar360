import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/app/useApp';
import { useAi } from '../../context/ai/useAi';
import { useBooking } from '../../context/booking/useBooking';
import { TOURS, seatPill } from '../../data/traveler/tours';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusPill from '../../components/ui/StatusPill';
import EmptyState from '../../components/ui/EmptyState';

export default function Itinerary() {
  const navigate = useNavigate();
  const { formatMoney } = useApp();
  const { avail } = useBooking();
  const { currentItinerary, saveItinerary } = useAi();

  if (!currentItinerary) {
    return (
      <EmptyState
        title="No itinerary yet"
        body="Build one from the planner — it reads real listings and live availability, not a canned template."
        actionLabel="Open planner"
        actionTo="/ai/planner"
      />
    );
  }

  const { items, days, gapDays, travellers, budget } = currentItinerary;
  let dayCursor = 1;
  const dayBlocks = [];
  items.forEach((it) => {
    const tour = TOURS.find((t) => t.id === it.tourId);
    const soldOutSince = (avail[it.tourId] ?? 0) <= 0;
    dayBlocks.push({ startDay: dayCursor, span: it.span, tour, soldOutSince, priceAtPlan: it.priceAtPlan });
    dayCursor += it.span;
  });

  const total = dayBlocks.reduce((n, b) => n + (b.soldOutSince ? 0 : (b.tour?.price || 0) * travellers), 0);
  const overBudget = total > budget;

  const onSave = () => {
    saveItinerary(currentItinerary);
    navigate('/ai/saved');
  };

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Your itinerary</h1>
        <p className="text-sm text-fg-muted">{days} days · {travellers} traveller{travellers === 1 ? '' : 's'} · budget {formatMoney(budget)}</p>
      </div>

      <div className="flex flex-col gap-3">
        {dayBlocks.map((b, i) => (
          <Card key={i} className="flex flex-col gap-2 p-4 sm:p-5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wide text-fg-subtle">
                Day{b.span > 1 ? `s ${b.startDay}–${b.startDay + b.span - 1}` : ` ${b.startDay}`}
              </span>
              {b.soldOutSince && <StatusPill tone="danger">Gone since we planned it</StatusPill>}
            </div>
            {b.tour ? (
              <>
                <span className="text-[15px] font-bold">{b.tour.title}</span>
                <span className="text-xs text-fg-muted">{b.tour.meta}</span>
                <div className="flex items-center justify-between border-t border-border pt-2">
                  <span className="font-mono text-sm font-semibold">{formatMoney(b.tour.price)} <span className="font-normal text-fg-muted">per person</span></span>
                  {!b.soldOutSince ? (
                    <Button size="sm" to={`/discover/tour/${b.tour.id}`}>View & book</Button>
                  ) : (
                    <StatusPill tone={seatPill(avail[b.tour.id] ?? 0).tone}>{seatPill(avail[b.tour.id] ?? 0).label}</StatusPill>
                  )}
                </div>
              </>
            ) : (
              <span className="text-sm text-fg-muted">No listing available for this slot.</span>
            )}
          </Card>
        ))}

        {gapDays > 0 && (
          <div className="flex items-start gap-2.5 rounded-xl border border-warning bg-warning-soft p-3.5 text-[12.5px] leading-relaxed text-warning-text">
            <span aria-hidden="true">!</span>
            <span>{gapDays} day{gapDays === 1 ? '' : 's'} left open — nothing in the catalog matched your budget or interests well enough to fill {gapDays === 1 ? 'it' : 'them'}. We'd rather leave a gap than invent a stop.</span>
          </div>
        )}
      </div>

      <Card className="flex flex-col gap-1.5 p-4 sm:p-5">
        <div className="flex justify-between text-[15px] font-bold">
          <span>Estimated total</span>
          <span className="font-mono">{formatMoney(total)}</span>
        </div>
        {overBudget && <span className="text-xs text-danger-text">This is over your {formatMoney(budget)} budget — swap a day or lower your traveller count.</span>}
      </Card>

      <div className="flex gap-2">
        <Button variant="secondary" fullWidth to="/ai/planner">Replan</Button>
        <Button fullWidth onClick={onSave}>Save itinerary</Button>
      </div>
    </div>
  );
}
