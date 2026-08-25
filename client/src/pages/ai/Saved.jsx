import { useState } from 'react';
import { useApp } from '../../context/useApp';
import { useAi } from '../../context/useAi';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';

export default function Saved() {
  const { formatMoney } = useApp();
  const { saved, recostItinerary } = useAi();
  const [openId, setOpenId] = useState(null);

  if (!saved.length) {
    return (
      <EmptyState
        title="No saved itineraries"
        body="Build one in the planner, then save it — it re-costs against live prices and seats every time you open it."
        actionLabel="Open planner"
        actionTo="/ai/planner"
      />
    );
  }

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-4">
      <h1 className="font-display text-2xl font-semibold tracking-tight">Saved itineraries</h1>

      {saved.map((it) => {
        const open = openId === it.id;
        const cost = open ? recostItinerary(it) : null;
        return (
          <Card key={it.id} className="flex flex-col gap-2.5 p-4 sm:p-5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[15px] font-bold">{it.origin} · {it.days} days · {it.travellers} traveller{it.travellers === 1 ? '' : 's'}</span>
              <Button size="sm" variant="secondary" onClick={() => setOpenId(open ? null : it.id)}>{open ? 'Close' : 'Open'}</Button>
            </div>
            {open && cost && (
              <div className="flex flex-col gap-2 border-t border-border pt-2.5">
                {cost.lines.map((l, i) => (
                  <div key={i} className="flex items-center justify-between text-[13px]">
                    <span className={l.stillBookable ? 'text-fg' : 'text-fg-subtle line-through'}>{l.tour?.title || 'Unavailable slot'}</span>
                    <span className="font-mono text-fg-muted">{l.stillBookable ? formatMoney(l.tour.price) : 'Gone since we planned it'}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-border pt-2 text-sm font-semibold">
                  <span>Current total</span>
                  <span className="font-mono">{formatMoney(cost.currentTotal)}</span>
                </div>
                {cost.delta !== 0 && (
                  <span className={`text-xs ${cost.delta > 0 ? 'text-danger-text' : 'text-success-text'}`}>
                    {cost.delta > 0 ? '+' : ''}{formatMoney(Math.abs(cost.delta))} {cost.delta > 0 ? 'more' : 'less'} than when you saved it — {cost.lines.some((l) => !l.stillBookable) ? 'a listing sold out since then.' : 'a rate changed.'}
                  </span>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
