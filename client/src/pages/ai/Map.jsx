import { useNavigate } from 'react-router-dom';
import { LANDMARKS } from '../../data/ai/landmarks';
import Card from '../../components/ui/Card';

// A stylized, schematic pin layout — not a real geographic projection (no
// mapping-library dependency here, see `data/ai/landmarks.js`'s own note).
// `coords` are 0–100 percentages placed on a fixed-aspect canvas.
export default function Map() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Landmarks</h1>
        <p className="text-sm text-fg-muted">
          A hand-curated set of places along Safar360's routes — the assistant can tell you about these, but never
          adds to the list itself.
        </p>
      </div>

      <Card className="relative aspect-[4/5] w-full overflow-hidden bg-sunken sm:aspect-[16/11]">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
          <rect x="0" y="0" width="100" height="100" className="fill-sunken" />
          <path d="M10 5 L70 5 L85 40 L60 60 L75 95 L15 95 L5 55 Z" className="fill-raised stroke-border" strokeWidth="0.4" />
        </svg>

        {LANDMARKS.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => navigate(`/ai/landmark/${l.id}`)}
            style={{ left: `${l.coords.x}%`, top: `${l.coords.y}%` }}
            className="group absolute -translate-x-1/2 -translate-y-full focus-visible:outline-none"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="mx-auto drop-shadow-sh1">
              <path
                d="M12 22s7-7.58 7-13a7 7 0 1 0-14 0c0 5.42 7 13 7 13Z"
                className="fill-primary stroke-primary-hover transition-transform group-hover:scale-110 group-focus-visible:scale-110"
                strokeWidth="1"
              />
              <circle cx="12" cy="9" r="2.5" className="fill-primary-on" />
            </svg>
            <span className="pointer-events-none mt-1 block whitespace-nowrap rounded-md border border-border bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-fg opacity-0 shadow-sh1 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              {l.name}
            </span>
          </button>
        ))}
      </Card>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {LANDMARKS.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => navigate(`/ai/landmark/${l.id}`)}
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-start hover:bg-sunken"
          >
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-[13.5px] font-semibold text-fg">{l.name}</span>
              <span className="text-xs text-fg-muted">{l.region} · {l.elevation}</span>
            </span>
            <span aria-hidden="true" className="flex-none text-fg-subtle">→</span>
          </button>
        ))}
      </div>
    </div>
  );
}
