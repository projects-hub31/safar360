import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../../context/app/useApp';
import { useBooking } from '../../context/booking/useBooking';
import { TOURS } from '../../data/traveler/tours';
import TourCard from '../../components/traveler/TourCard';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';

const REGIONS = ['Gilgit-Baltistan', 'Khyber Pakhtunkhwa', 'Balochistan'];
const DURATIONS = [
  { id: '1-3', label: '1–3 days' },
  { id: '4-5', label: '4–5 days' },
  { id: '6+', label: '6 days or more' },
];

function chipClasses(on) {
  return [
    'min-h-[38px] rounded-lg border px-3 text-[12.5px] font-semibold',
    on ? 'border-primary bg-primary-soft text-primary-soft-text' : 'border-border-strong bg-surface text-fg',
  ].join(' ');
}

// Sponsored results are capped at 2 per 10 and only surface on relevance sort —
// mirrors the ranking rule from the design (§7.2).
function interleaveSponsored(list) {
  const sponsored = list.filter((t) => t.sponsored);
  const organic = list.filter((t) => !t.sponsored);
  const merged = [];
  let si = 0;
  let oi = 0;
  while (si < sponsored.length || oi < organic.length) {
    const block = organic.slice(oi, oi + 8);
    oi += 8;
    const take = sponsored.slice(si, si + 2);
    si += 2;
    merged.push(...take, ...block);
  }
  return merged;
}

export default function Search() {
  const location = useLocation();
  const { formatMoney } = useApp();
  const { avail } = useBooking();

  const initialWhere = location.state?.where || '';
  const [where] = useState(initialWhere);
  const [maxPrice, setMaxPrice] = useState(150000);
  const [regions, setRegions] = useState([]);
  const [durations, setDurations] = useState([]);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [availOnly, setAvailOnly] = useState(false);
  const [sort, setSort] = useState('relevance');

  const regionCounts = useMemo(() => {
    const counts = {};
    TOURS.forEach((t) => { counts[t.region] = (counts[t.region] || 0) + 1; });
    return counts;
  }, []);

  const toggleRegion = (r) =>
    setRegions((rs) => (rs.includes(r) ? rs.filter((x) => x !== r) : rs.concat(r)));
  const toggleDuration = (id) =>
    setDurations((ds) => (ds.includes(id) ? ds.filter((x) => x !== id) : ds.concat(id)));
  const clearFilters = () => {
    setMaxPrice(150000); setRegions([]); setDurations([]); setVerifiedOnly(false); setAvailOnly(false);
  };

  const results = useMemo(() => {
    let out = TOURS.filter((t) => t.price <= maxPrice)
      .filter((t) => !regions.length || regions.includes(t.region))
      .filter((t) => !durations.length || durations.some((d) => (d === '1-3' ? t.days <= 3 : d === '4-5' ? t.days >= 4 && t.days <= 5 : t.days >= 6)))
      .filter((t) => !availOnly || (avail[t.id] ?? 0) > 0)
      .filter((t) => !where.trim() || `${t.title} ${t.meta} ${t.region}`.toLowerCase().includes(where.trim().toLowerCase()));

    if (sort === 'price-asc') out = [...out].sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') out = [...out].sort((a, b) => b.price - a.price);
    if (sort === 'rating') out = [...out].sort((a, b) => b.rating - a.rating);
    if (sort === 'soonest') out = [...out].sort((a, b) => a.days - b.days);

    if (sort !== 'relevance') return out.map((t) => ({ ...t, sponsored: false }));
    return interleaveSponsored(out);
  }, [maxPrice, regions, durations, availOnly, where, sort, avail]);

  const filterSummary = [
    regions.length ? `${regions.length} regions` : null,
    durations.length ? `${durations.length} durations` : null,
    maxPrice < 150000 ? `under ${formatMoney(maxPrice)}` : null,
    availOnly ? 'with seats' : null,
  ].filter(Boolean).join(' · ') || 'No filters applied';

  const rankingCopy = sort === 'relevance'
    ? 'Relevance blends your dates, your region and completed-booking rate.'
    : 'Ordered strictly by your chosen sort — nothing is boosted.';

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside aria-label="Filters" className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-baseline justify-between gap-2.5">
          <strong className="text-sm">Filters</strong>
          <Button variant="tertiary" size="sm" onClick={clearFilters} className="min-h-8 px-1">
            Clear all
          </Button>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="f-price" className="text-[12.5px] font-bold">Max price per person</label>
          <input
            id="f-price" type="range" min={20000} max={150000} step={5000} value={maxPrice}
            onChange={(e) => setMaxPrice(+e.target.value)}
            className="w-full accent-jade-600"
          />
          <div className="flex justify-between font-mono text-[11.5px] text-fg-muted">
            <span>Rs 20,000</span>
            <strong className="text-fg">{formatMoney(maxPrice)}</strong>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-border pt-3.5">
          <span className="text-[12.5px] font-bold">Region</span>
          {REGIONS.map((r) => (
            <label key={r} className="flex min-h-9 cursor-pointer items-center gap-2.5 text-sm">
              <input
                type="checkbox" checked={regions.includes(r)} onChange={() => toggleRegion(r)}
                className="h-[17px] w-[17px] accent-jade-600"
              />
              <span className="flex-1">{r}</span>
              <span className="font-mono text-[11.5px] text-fg-subtle">{regionCounts[r] || 0}</span>
            </label>
          ))}
        </div>

        <div className="flex flex-col gap-2 border-t border-border pt-3.5">
          <span className="text-[12.5px] font-bold">Duration</span>
          <div className="flex flex-wrap gap-1.5">
            {DURATIONS.map((d) => (
              <button key={d.id} type="button" onClick={() => toggleDuration(d.id)} aria-pressed={durations.includes(d.id)} className={chipClasses(durations.includes(d.id))}>
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-border pt-3.5">
          <label className="flex min-h-9 cursor-pointer items-center gap-2.5 text-sm">
            <input type="checkbox" checked={verifiedOnly} onChange={() => setVerifiedOnly((v) => !v)} className="h-[17px] w-[17px] accent-jade-600" />
            <span>Verified operators only</span>
          </label>
          <label className="flex min-h-9 cursor-pointer items-center gap-2.5 text-sm">
            <input type="checkbox" checked={availOnly} onChange={() => setAvailOnly((v) => !v)} className="h-[17px] w-[17px] accent-jade-600" />
            <span>Has seats on my dates</span>
          </label>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col gap-3.5">
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-surface p-3.5">
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-bold">
              {results.length} trips{where.trim() ? ` matching "${where.trim()}"` : ''}
            </div>
            <div className="text-[12.5px] leading-relaxed text-fg-muted">{filterSummary}</div>
          </div>
          <label className="flex items-center gap-1.5 text-[12.5px] text-fg-muted">
            Sort
            <select
              value={sort} onChange={(e) => setSort(e.target.value)}
              className="min-h-[42px] cursor-pointer rounded-lg border border-border-strong bg-raised px-2.5 text-sm font-semibold text-fg"
            >
              <option value="relevance">Most relevant</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="rating">Highest rated</option>
              <option value="soonest">Departing soonest</option>
            </select>
          </label>
        </div>

        <div className="flex gap-2.5 rounded-xl border border-info bg-info-soft p-3 text-[12.5px] leading-relaxed text-info-text">
          <span aria-hidden="true">i</span>
          <span>
            <strong>How this is ordered.</strong> {rankingCopy} Sponsored results are labelled and capped at 2 in
            every 10.
          </span>
        </div>

        {results.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {results.map((t) => (
              <TourCard key={t.id} tour={t} layout="horizontal" />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No trips match those filters"
            body={`Every journey starts somewhere else. Widen the price range or clear the region filter — there are ${TOURS.length} trips waiting.`}
            actionLabel="Clear filters"
            onAction={clearFilters}
          />
        )}
      </div>
    </div>
  );
}
