import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSocial } from '../../context/useSocial';
import Button from '../../components/ui/Button';
import TextField from '../../components/ui/TextField';
import EmptyState from '../../components/ui/EmptyState';

const STATE_LABEL = { sending: 'Sending…', sent: 'Sent', delivered: 'Delivered', failed: 'Failed' };

export default function Thread() {
  const { id } = useParams();
  const { threads, authorOf, sendMessage, retryMessage, blockAccount, unblockAccount } = useSocial();
  const [text, setText] = useState('');

  const thread = threads.find((t) => t.id === id);
  if (!thread) {
    return <EmptyState title="Conversation not found" body="It may have been removed." actionLabel="Back to chats" actionTo="/social/chats" />;
  }

  const author = authorOf(thread.withId);

  const onSend = () => {
    if (!text.trim() || thread.blocked) return;
    sendMessage(thread.id, text.trim());
    setText('');
  };

  return (
    <div className="mx-auto flex max-w-[560px] flex-col gap-4">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-3.5">
        <span className="font-display text-base font-semibold">{author.name}</span>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => (thread.blocked ? unblockAccount(thread.withId) : blockAccount(thread.withId))}
        >
          {thread.blocked ? 'Unblock' : 'Block'}
        </Button>
      </div>

      {thread.blocked && (
        <div className="rounded-lg border border-border bg-sunken px-3 py-2 text-xs text-fg-muted">
          This account is blocked. The transcript below is preserved — unblock to send new messages.
        </div>
      )}

      <div className="flex flex-col gap-2">
        {thread.messages.map((m) => (
          <div key={m.id} className={`flex flex-col gap-0.5 ${m.from === 'me' ? 'items-end' : 'items-start'}`}>
            <div
              dir="auto"
              className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                m.from === 'me' ? 'bg-primary text-primary-on' : 'border border-border bg-surface text-fg'
              }`}
            >
              {m.text}
            </div>
            {m.from === 'me' && (
              <div className="flex items-center gap-1.5 px-1 text-[11px] text-fg-subtle">
                <span className={m.state === 'failed' ? 'font-semibold text-danger-text' : ''}>{STATE_LABEL[m.state]}</span>
                {m.state === 'failed' && (
                  <button type="button" onClick={() => retryMessage(thread.id, m.id)} className="font-semibold text-primary-soft-text underline">
                    Retry
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        {!thread.messages.length && <span className="text-sm text-fg-muted">No messages yet.</span>}
      </div>

      <div className="flex gap-2">
        <TextField className="flex-1" dir="auto" value={text} onChange={(e) => setText(e.target.value)} placeholder={thread.blocked ? 'Unblock to send a message' : 'Message…'} disabled={thread.blocked} />
        <Button onClick={onSend} disabled={!text.trim() || thread.blocked}>Send</Button>
      </div>
    </div>
  );
}
