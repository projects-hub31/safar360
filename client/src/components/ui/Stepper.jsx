// Numeric +/- stepper — was duplicated inline on Home and TourDetail for the
// guest counter; also used for cart/product quantity.
export default function Stepper({ value, onChange, min = 1, max = 99, srLabel = 'item' }) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));

  return (
    <div className="flex min-h-[46px] items-center gap-1.5 rounded-lg border border-border-strong bg-raised px-1.5">
      <button
        type="button"
        onClick={dec}
        disabled={value <= min}
        aria-label={`One fewer ${srLabel}`}
        className="h-9 w-9 flex-none rounded-md border border-border bg-surface text-lg text-fg disabled:cursor-not-allowed disabled:opacity-50"
      >
        −
      </button>
      <span aria-live="polite" className="flex-1 text-center font-mono text-[15px] font-semibold tabular-nums">
        {value}
      </span>
      <button
        type="button"
        onClick={inc}
        disabled={value >= max}
        aria-label={`One more ${srLabel}`}
        className="h-9 w-9 flex-none rounded-md border border-border bg-surface text-lg text-fg disabled:cursor-not-allowed disabled:opacity-50"
      >
        +
      </button>
    </div>
  );
}
