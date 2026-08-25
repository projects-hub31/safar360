import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/app/useApp';
import { useAi } from '../../context/ai/useAi';
import {
  ORIGINS, INTERESTS, PACE_OPTIONS, PLANNER_DEFAULTS,
  DAYS_MIN, DAYS_MAX, BUDGET_MIN, BUDGET_MAX, BUDGET_STEP,
} from '../../context/ai/ai-context';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import SelectField from '../../components/ui/SelectField';
import Stepper from '../../components/ui/Stepper';

export default function Planner() {
  const navigate = useNavigate();
  const { formatMoney } = useApp();
  const { planTrip } = useAi();

  const [origin, setOrigin] = useState(PLANNER_DEFAULTS.origin);
  const [days, setDays] = useState(PLANNER_DEFAULTS.days);
  const [budget, setBudget] = useState(PLANNER_DEFAULTS.budget);
  const [travellers, setTravellers] = useState(PLANNER_DEFAULTS.travellers);
  const [interests, setInterests] = useState([]);
  const [pace, setPace] = useState(PLANNER_DEFAULTS.pace);

  const toggleInterest = (i) => setInterests((list) => (list.includes(i) ? list.filter((x) => x !== i) : list.concat(i)));

  const payload = { origin, days, budget, travellers, interests };

  const onPlan = () => {
    planTrip({ origin, days, budget, travellers, interests, pace });
    navigate('/ai/itinerary');
  };

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Plan a trip</h1>
          <p className="text-sm text-fg-muted">Tell it your dates, budget and interests — it builds a day-by-day plan from real, bookable listings.</p>
        </div>
        <Button to="/ai/chatbot" variant="tertiary" size="sm">Or just ask a question →</Button>
      </div>

      <Card className="flex flex-col gap-3.5 p-4 sm:p-5">
        <SelectField label="Starting from" value={origin} onChange={(e) => setOrigin(e.target.value)} options={ORIGINS.map((o) => ({ value: o, label: o }))} />

        <div className="flex flex-col gap-2">
          <label htmlFor="p-days" className="text-[12.5px] font-bold">Days</label>
          <input id="p-days" type="range" min={DAYS_MIN} max={DAYS_MAX} step={1} value={days} onChange={(e) => setDays(+e.target.value)} className="w-full accent-jade-600" />
          <div className="flex justify-between font-mono text-[11.5px] text-fg-muted">
            <span>{DAYS_MIN} days</span>
            <strong className="text-fg">{days} days</strong>
            <span>{DAYS_MAX} days</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="p-budget" className="text-[12.5px] font-bold">Budget (total, all travellers)</label>
          <input id="p-budget" type="range" min={BUDGET_MIN} max={BUDGET_MAX} step={BUDGET_STEP} value={budget} onChange={(e) => setBudget(+e.target.value)} className="w-full accent-jade-600" />
          <div className="flex justify-between font-mono text-[11.5px] text-fg-muted">
            <span>{formatMoney(BUDGET_MIN)}</span>
            <strong className="text-fg">{formatMoney(budget)}</strong>
            <span>{formatMoney(BUDGET_MAX)}</span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-bold">Travellers</span>
          <Stepper value={travellers} onChange={setTravellers} min={1} max={12} srLabel="traveller" />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-bold">Interests</span>
          <div className="flex flex-wrap gap-1.5">
            {INTERESTS.map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleInterest(i)}
                aria-pressed={interests.includes(i)}
                className={`min-h-[38px] rounded-lg border px-3 text-[12.5px] font-semibold ${
                  interests.includes(i) ? 'border-primary bg-primary-soft text-primary-soft-text' : 'border-border-strong bg-surface text-fg'
                }`}
              >
                {i}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-bold">Pace</span>
          <div className="flex gap-1.5">
            {PACE_OPTIONS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPace(p.id)}
                aria-pressed={pace === p.id}
                className={`min-h-[38px] flex-1 rounded-lg border px-3 text-[12.5px] font-semibold ${
                  pace === p.id ? 'border-primary bg-primary-soft text-primary-soft-text' : 'border-border-strong bg-surface text-fg'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="flex flex-col gap-1.5 p-4 text-xs sm:p-5">
        <strong className="mb-1 text-[13px] text-fg">The request this sends</strong>
        <pre dir="ltr" className="overflow-x-auto whitespace-pre-wrap break-all font-mono text-fg-muted">
{`POST /ai/plan-trip\n${JSON.stringify(payload, null, 2)}`}
        </pre>
      </Card>

      <Button onClick={onPlan} size="lg" fullWidth>Build my itinerary</Button>
    </div>
  );
}
