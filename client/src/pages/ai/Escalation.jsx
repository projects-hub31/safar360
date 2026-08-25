import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAi } from '../../context/ai/useAi';
import { useSocial } from '../../context/social/useSocial';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const REASON_LABEL = {
  money: 'a money question', safety: 'a safety question', repeated: 'two unclear answers in a row', user: 'you asking for a person',
};

function formatWait(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

// §6 08-ai `isEscalation` — a real dedicated hand-off screen, not just the
// chatbot's own inline "Escalated" pill (that inline transparency block
// stays exactly as it was; this is an additional destination on top of it,
// reachable via the chatbot's persistent "Talk to a person" control — the
// wireframe's own two-way `#/ai/escalation` ↔ `#/ai/chatbot` link pair).
export default function Escalation() {
  const navigate = useNavigate();
  const { messages, escalateNow } = useAi();
  const { startThread } = useSocial();

  const [waitSeconds, setWaitSeconds] = useState(0);
  const lastEscalated = [...messages].reverse().find((m) => m.escalate);

  useEffect(() => {
    if (!lastEscalated) return undefined;
    const t = setTimeout(() => setWaitSeconds((s) => s + 1), 1000);
    return () => clearTimeout(t);
  }, [waitSeconds, lastEscalated]);

  if (!lastEscalated) {
    return (
      <div className="mx-auto flex max-w-[480px] flex-col items-start gap-3 rounded-2xl border border-border bg-surface p-6">
        <div className="font-display text-xl font-semibold tracking-tight">Not connected yet</div>
        <p className="text-sm leading-relaxed text-fg-muted">
          You haven&rsquo;t asked to talk to a person in this conversation. Connecting starts a real hand-off,
          with the assistant transcript and your booking context shared with the agent.
        </p>
        <Button onClick={escalateNow}>Connect to a person now</Button>
      </div>
    );
  }

  const call = lastEscalated.toolCalls.find((c) => c.name === 'escalateToHuman');
  const { scopedContext, excluded } = call.result;

  const onOpenConversation = () => {
    const summary = scopedContext.bookingRef
      ? `Hi, I'm Nida from safar360 support — I can see booking ${scopedContext.bookingRef} and the full assistant transcript. Picking this up now, what can I help with?`
      : "Hi, I'm Nida from safar360 support — I can see the full assistant transcript. Picking this up now, what can I help with?";
    const threadId = startThread('support', summary);
    navigate(`/social/thread/${threadId}`);
  };

  return (
    <div className="mx-auto grid max-w-[860px] items-start gap-4 sm:grid-cols-[1fr_260px]">
      <Card className="flex flex-col overflow-hidden">
        <div className="flex items-center gap-2 border-b border-info bg-info-soft px-4 py-3">
          <span aria-hidden="true" className="text-info-text">i</span>
          <span className="text-sm font-bold text-info-text">Handed to a person</span>
        </div>
        <div className="flex flex-col gap-3.5 p-4 sm:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <span aria-hidden="true" className="grid h-11 w-11 flex-none place-items-center rounded-full border border-border bg-sunken text-base font-bold text-fg-muted">N</span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold">Nida from safar360 support</div>
              <div className="text-xs text-fg-muted">Usually replies in under 10 minutes · 09:00–21:00 PKT</div>
            </div>
            <span dir="ltr" className="ml-auto font-mono text-sm font-semibold text-fg">{formatWait(waitSeconds)}</span>
          </div>

          <div dir="ltr" className="flex flex-col gap-1.5 rounded-lg bg-sunken p-3.5 font-mono text-[11.5px] leading-relaxed text-fg-muted">
            <span className="font-bold text-fg">What Nida can already see</span>
            <span>booking {scopedContext.bookingRef || 'none'} · {scopedContext.bookingState || 'n/a'}</span>
            <span>operator {scopedContext.operatorName || 'n/a'}</span>
            <span>full assistant transcript ({scopedContext.transcriptTurns} turn{scopedContext.transcriptTurns === 1 ? '' : 's'})</span>
            <span>payment {scopedContext.paymentMethodStatus}</span>
            <br />
            <span>NOT shared: {excluded.join(', ')}</span>
          </div>

          <p className="text-sm leading-relaxed text-fg-muted">
            You don&rsquo;t have to explain it twice. The whole conversation goes with you, including what the
            assistant looked up and what it got wrong — escalated for {REASON_LABEL[scopedContext.reason] || 'a person'}.
          </p>

          <div className="flex flex-wrap gap-2">
            <Button onClick={onOpenConversation}>Open the conversation</Button>
            <Button variant="secondary" to="/ai/chatbot">Back to the assistant</Button>
          </div>
        </div>
      </Card>

      <Card className="flex flex-col gap-2.5 p-4">
        <strong className="text-sm">When it escalates on its own</strong>
        <div className="flex flex-col gap-2 text-[13px] leading-relaxed text-fg-muted">
          <div><strong className="text-fg">Money.</strong> Anything about a refund, a charge, or a payout goes to a person immediately.</div>
          <div><strong className="text-fg">Safety.</strong> Weather, road closures, medical — never answered from a model.</div>
          <div><strong className="text-fg">Two failed answers.</strong> If it can&rsquo;t help twice in a row it stops trying.</div>
          <div><strong className="text-fg">You ask.</strong> The button is on every screen, not buried.</div>
        </div>
      </Card>
    </div>
  );
}
