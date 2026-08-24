import { Link } from 'react-router-dom';
import { useApp } from '../../context/useApp';
import { useBooking } from '../../context/useBooking';
import { seatPill } from '../../data/traveler/tours';
import StatusPill from '../ui/StatusPill';
import WishlistButton from './WishlistButton';

/**
 * Shared tour tile. `layout="vertical"` is the featured-grid card (image on top);
 * `layout="horizontal"` is the search-results row (image on the side).
 */
export default function TourCard({ tour, layout = 'vertical' }) {
  const { formatMoney } = useApp();
  const { avail } = useBooking();
  const seats = avail[tour.id] ?? 0;
  const pill = seatPill(seats);
  const href = `/discover/tour/${tour.id}`;

  if (layout === 'horizontal') {
    return (
      <Link
        to={href}
        className={`flex overflow-hidden rounded-card border bg-surface text-fg no-underline shadow-sh1 ${
          tour.sponsored ? 'border-border-strong' : 'border-border'
        }`}
      >
        <img
          src={tour.img}
          alt={tour.alt}
          loading="lazy"
          className="min-h-[130px] w-[110px] flex-none object-cover sm:w-[190px]"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-3">
          {tour.sponsored && (
            <StatusPill tone="neutral" icon="◈" className="w-fit border-border-loud">
              Sponsored · this operator paid for placement
            </StatusPill>
          )}
          <div className="flex items-baseline gap-2">
            <span className="flex-1 text-[15.5px] font-bold leading-tight">{tour.title}</span>
            <span className="flex-none font-mono text-xs font-semibold">
              ★ {tour.rating.toFixed(1)} <span className="font-normal text-fg-subtle">({tour.reviews})</span>
            </span>
          </div>
          <span className="text-xs leading-relaxed text-fg-muted">{tour.meta}</span>
          <StatusPill tone="success" icon="✓" className="w-fit">
            {tour.operator}
          </StatusPill>
          <span className="mt-auto flex flex-wrap items-baseline justify-between gap-2 pt-1.5">
            <span className="font-mono text-base font-semibold sm:text-[17px]">
              {formatMoney(tour.price)} <span className="text-[11.5px] font-normal text-fg-muted">per person</span>
            </span>
            <StatusPill tone={pill.tone}>{pill.label}</StatusPill>
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={href}
      className="flex flex-col overflow-hidden rounded-card border border-border bg-surface text-fg no-underline shadow-sh1"
    >
      <div className="relative aspect-[4/3] bg-sunken">
        <img src={tour.img} alt={tour.alt} loading="lazy" className="h-full w-full object-cover" />
        <WishlistButton tourId={tour.id} className="absolute right-2 top-2" />
        {tour.badge && (
          <span className="absolute left-2.5 top-2.5 rounded-md bg-accent px-2 py-1 text-[11px] font-bold text-ink-900">
            {tour.badge}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1.5 p-3">
        <div className="flex items-baseline gap-2">
          <span className="flex-1 text-[15px] font-bold leading-tight">{tour.title}</span>
          <span className="flex-none font-mono text-xs font-semibold">★ {tour.rating.toFixed(1)}</span>
        </div>
        <div className="text-xs leading-relaxed text-fg-muted">{tour.meta}</div>
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusPill tone="success" icon="✓">
            {tour.operator}
          </StatusPill>
        </div>
        <div className="mt-0.5 flex items-baseline justify-between gap-2 border-t border-border pt-2">
          <span className="font-mono text-base font-semibold">{formatMoney(tour.price)}</span>
          <StatusPill tone={pill.tone}>{pill.label}</StatusPill>
        </div>
      </div>
    </Link>
  );
}
