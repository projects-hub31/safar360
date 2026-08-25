import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSocial } from '../../context/useSocial';
import Card from '../../components/ui/Card';
import StatusPill from '../../components/ui/StatusPill';
import EmptyState from '../../components/ui/EmptyState';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'blocked', label: 'Blocked' },
];

export default function Chats() {
  const { threads, authorOf } = useSocial();
  const [tab, setTab] = useState('all');

  const rows = threads
    .filter((t) => tab === 'all' || (tab === 'blocked' ? t.blocked : !t.blocked))
    .filter((t) => tab !== 'unread' || t.messages.some((m) => m.from === 'them'))
    .slice()
    .sort((a, b) => (b.messages.at(-1)?.at || 0) - (a.messages.at(-1)?.at || 0));

  return (
    <div className="mx-auto flex max-w-[560px] flex-col gap-4">
      <h1 className="font-display text-2xl font-semibold tracking-tight">Chats</h1>
      <div className="flex gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            aria-pressed={tab === t.id}
            className={`min-h-9 rounded-lg border px-3 text-[13px] font-semibold ${
              tab === t.id ? 'border-primary bg-primary-soft text-primary-soft-text' : 'border-border-strong bg-surface text-fg'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {rows.length ? (
        <div className="flex flex-col gap-2">
          {rows.map((t) => {
            const author = authorOf(t.withId);
            const last = t.messages.at(-1);
            return (
              <Link key={t.id} to={`/social/thread/${t.id}`} className={`no-underline ${t.blocked ? 'opacity-60' : ''}`}>
                <Card className="flex items-center gap-3 p-3.5">
                  <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-primary-soft font-display text-sm font-bold text-primary-soft-text">
                    {author.name.charAt(0)}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-sm font-bold text-fg">{author.name}</span>
                    <span className="truncate text-xs text-fg-muted">{last ? last.text : 'No messages yet'}</span>
                  </div>
                  {t.blocked && <StatusPill tone="neutral">Blocked</StatusPill>}
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No chats here" body="Message an operator from a listing or profile and it will show up here." />
      )}
    </div>
  );
}
