import { useState } from 'react';
import { useAi } from '../../context/ai/useAi';
import Button from '../../components/ui/Button';
import TextField from '../../components/ui/TextField';
import StatusPill from '../../components/ui/StatusPill';

const ESCALATE_LABEL = { money: 'Escalated — money question', safety: 'Escalated — safety question', repeated: 'Escalated — two unclear answers', user: 'Escalated — you asked for a person' };

// Every tool call renders in its own block — name, arguments, raw result —
// separate from the prose reply (§3 chatbot function-call transparency).
function ToolCallBlock({ call }) {
  return (
    <div dir="ltr" className="flex flex-col gap-1 rounded-lg border border-border-strong bg-sunken p-2.5 font-mono text-[11px]">
      <span className="font-bold text-fg">🛠 {call.name}({JSON.stringify(call.args)})</span>
      <pre className="overflow-x-auto whitespace-pre-wrap break-all text-fg-muted">{JSON.stringify(call.result, null, 2)}</pre>
    </div>
  );
}

export default function Chatbot() {
  const { messages, sendChatMessage, escalateNow } = useAi();
  const [text, setText] = useState('');

  const onSend = () => {
    if (!text.trim()) return;
    sendChatMessage(text.trim());
    setText('');
  };

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Ask Safar</h1>
        <Button variant="secondary" size="sm" onClick={escalateNow}>Talk to a person</Button>
      </div>

      <div className="flex flex-col gap-3">
        {messages.map((m) => (
          <div key={m.id} className={`flex flex-col gap-1.5 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div
              dir="auto"
              className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                m.role === 'user' ? 'bg-primary text-primary-on' : 'border border-border bg-surface text-fg'
              }`}
            >
              {m.text}
            </div>
            {m.toolCalls?.length > 0 && (
              <div className="flex w-full max-w-[85%] flex-col gap-1.5">
                {m.toolCalls.map((c, i) => <ToolCallBlock key={i} call={c} />)}
              </div>
            )}
            {m.escalate && <StatusPill tone="warning">{ESCALATE_LABEL[m.escalate] || 'Escalated'}</StatusPill>}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <TextField className="flex-1" dir="auto" value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask about a booking, weather, roads, or trip ideas…" onKeyDown={(e) => e.key === 'Enter' && onSend()} />
        <Button onClick={onSend} disabled={!text.trim()}>Send</Button>
      </div>
      <p className="text-center text-xs leading-relaxed text-fg-muted">
        Money and safety questions always go to a person — this assistant never answers those on its own.
      </p>
    </div>
  );
}
