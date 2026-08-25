import { useAdmin } from '../../context/admin/useAdmin';
import { useAi } from '../../context/ai/useAi';
import { useBooking } from '../../context/booking/useBooking';
import { useApp } from '../../context/app/useApp';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusPill from '../../components/ui/StatusPill';
import Countdown from '../../components/ui/Countdown';
import EmptyState from '../../components/ui/EmptyState';

const STATUS_TONE = { pending: 'warning', proceeded: 'success', postponed: 'info', cancelled: 'danger', 'auto-postponed': 'held' };
const STATUS_LABEL = {
  pending: 'Awaiting your decision', proceeded: 'Proceeding as planned', postponed: 'Postponed',
  cancelled: 'Cancelled', 'auto-postponed': 'Auto-postponed — no decision in time',
};

// §3 weather override flow: `alert issued → operator notified → operator
// decides within policy.weatherDecisionHours (proceed | postpone | cancel) →
// no decision = auto-postpone`. Operator-facing despite living under the
// `ai/` route prefix (the alert itself is location/weather-module content,
// §5's route table files it there) — reached via a landmark/itinerary link,
// not a top-level nav item, same as `ai/landmark`/`ai/geofence`.
export default function Weather() {
  const { policy } = useAdmin();
  const { weatherAlerts, decideWeatherAlert, autoPostponeAlert } = useAi();
  const { bookings } = useBooking();
  const { formatMoney } = useApp();

  if (!weatherAlerts.length) {
    return <EmptyState title="No weather alerts" body="Nothing has been issued against a live departure right now." actionLabel="Back to map" actionTo="/ai/map" />;
  }

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Weather alerts</h1>
        <p className="text-sm leading-relaxed text-fg-muted">
          Issued via {policy.weatherAuthority}, at sustained winds above {policy.weatherWindKmh} km/h. You have{' '}
          {policy.weatherDecisionHours}h to decide — no decision auto-postpones the departure.
        </p>
      </div>

      {weatherAlerts.map((alert) => {
        const linkedBooking = alert.linkedBookingRef ? bookings.find((b) => b.ref === alert.linkedBookingRef) : null;
        const cancelAmount = linkedBooking ? Math.round(linkedBooking.total * (policy.weatherRefundPct / 100)) : null;

        return (
          <Card key={alert.id} className="flex flex-col gap-3 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[15px] font-bold text-fg">{alert.tourTitle}</span>
              <StatusPill tone={STATUS_TONE[alert.status]}>{STATUS_LABEL[alert.status]}</StatusPill>
            </div>
            <p className="text-sm leading-relaxed text-fg-muted">{alert.condition}</p>
            <Button size="sm" variant="tertiary" to={`/ai/landmark/${alert.landmarkId}`} className="w-fit">View landmark →</Button>

            {alert.status === 'pending' && (
              <>
                <div className="flex items-center gap-2 rounded-xl border border-warning bg-warning-soft px-4 py-3">
                  <span className="text-sm text-warning-text">Decide within</span>
                  <Countdown
                    key={alert.id}
                    seconds={policy.weatherDecisionHours * 3600}
                    urgentAt={3600}
                    onExpire={() => autoPostponeAlert(alert.id)}
                  />
                </div>

                {linkedBooking ? (
                  <span className="text-xs text-fg-subtle">
                    Linked booking {linkedBooking.ref} · {formatMoney(linkedBooking.total)} paid — a Cancel decision
                    refunds at the live weather-refund rate ({policy.weatherRefundPct}%) and claws back the
                    commission on the matching ledger row.
                  </span>
                ) : (
                  <span className="text-xs text-fg-subtle">
                    No linked booking on this alert in this demo — choosing Cancel updates its status only, no
                    refund is issued.
                  </span>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => decideWeatherAlert(alert.id, 'proceed')}>Proceed as planned</Button>
                  <Button variant="secondary" onClick={() => decideWeatherAlert(alert.id, 'postpone')}>Postpone</Button>
                  <Button
                    variant="destructive"
                    onClick={() => decideWeatherAlert(alert.id, 'cancel', { refundPct: policy.weatherRefundPct })}
                  >
                    {linkedBooking ? `Cancel and refund ${formatMoney(cancelAmount)} (${policy.weatherRefundPct}%)` : 'Cancel — no refund to issue'}
                  </Button>
                </div>
              </>
            )}

            {alert.status !== 'pending' && alert.refundResult && (
              <p className="text-sm leading-relaxed text-fg-muted">
                {alert.refundResult.pct}% refunded — {formatMoney(alert.refundResult.amount)} reversed, and the
                commission on the linked ledger row was clawed back.
              </p>
            )}
          </Card>
        );
      })}
    </div>
  );
}
