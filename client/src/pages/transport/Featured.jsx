import { useState } from 'react';
import { useApp } from '../../context/useApp';
import { useTransport } from '../../context/useTransport';
import {
  FEATURED_REGIONS, FEATURED_MIN_DAYS, FEATURED_MAX_DAYS, FEATURED_STEP_DAYS,
  SPONSORED_CAP_PER_10, SEED_SPONSORED_SOLD,
} from '../../context/transport-context';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ChoiceCard from '../../components/ui/ChoiceCard';
import StatusPill from '../../components/ui/StatusPill';

export default function Featured() {
  const { formatMoney } = useApp();
  const { featured, buyFeatured } = useTransport();
  const [region, setRegion] = useState(FEATURED_REGIONS[0].region);
  const [days, setDays] = useState(FEATURED_MIN_DAYS);

  const picked = FEATURED_REGIONS.find((r) => r.region === region);
  const cost = picked.perDay * days;
  const wouldQueue = SEED_SPONSORED_SOLD + 1 > SPONSORED_CAP_PER_10;

  return (
    <div className="mx-auto flex max-w-[600px] flex-col gap-4">
      <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Featured placement</h1>
      <p className="text-xs leading-relaxed text-fg-subtle">
        Sponsored slots are capped at {SPONSORED_CAP_PER_10} per 10 organic results, always disclosed with a
        "Sponsored" pill. A purchase beyond the cap queues — it never displaces an organic result.
      </p>

      {featured ? (
        <Card className="flex flex-col gap-2 border-success p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <strong className="text-sm">Active campaign</strong>
            <StatusPill tone="success">Active</StatusPill>
          </div>
          <div className="flex justify-between text-sm"><span className="text-fg-muted">Region</span><span>{featured.region}</span></div>
          <div className="flex justify-between text-sm"><span className="text-fg-muted">Duration</span><span>{featured.days} days</span></div>
          <div className="flex justify-between text-sm font-semibold"><span>Total paid</span><span className="font-mono">{formatMoney(featured.cost)}</span></div>
        </Card>
      ) : (
        <Card className="flex flex-col gap-4 p-4 sm:p-5">
          <div className="flex flex-col gap-2">
            <span className="text-[12.5px] font-bold text-fg">Region</span>
            <div className="grid grid-cols-2 gap-2">
              {FEATURED_REGIONS.map((r) => (
                <ChoiceCard key={r.region} active={region === r.region} onClick={() => setRegion(r.region)} title={r.region} meta={`${formatMoney(r.perDay)}/day`} />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] font-bold text-fg">Duration</span>
              <span className="font-mono text-sm font-semibold">{days} days</span>
            </div>
            <input
              type="range"
              min={FEATURED_MIN_DAYS}
              max={FEATURED_MAX_DAYS}
              step={FEATURED_STEP_DAYS}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              aria-label="Featured placement duration in days"
              className="w-full accent-primary"
            />
          </div>

          <div className="flex justify-between border-t border-border pt-3 text-sm font-bold">
            <span>Total</span>
            <span className="font-mono">{formatMoney(cost)}</span>
          </div>

          {wouldQueue && (
            <div className="rounded-lg border border-warning bg-warning-soft px-3 py-2 text-xs leading-relaxed text-warning-text">
              {SEED_SPONSORED_SOLD} of {SPONSORED_CAP_PER_10} sponsored slots in {region} are already sold this
              cycle — your purchase queues and activates as soon as one frees up.
            </div>
          )}

          <Button onClick={() => buyFeatured({ region, days, perDay: picked.perDay })}>Buy featured placement</Button>
        </Card>
      )}
    </div>
  );
}
