import { useRef, useState } from 'react';
import StatusPill from '../ui/StatusPill';

const STATUS_PILL = {
  uploading: { tone: 'info', label: 'Uploading…' },
  done: { tone: 'success', label: 'In review' },
  rejected: { tone: 'danger', label: 'Rejected' },
};

/**
 * C-04 Document uploader (see CLAUDE.md design system §2). No real backend to
 * upload to yet, so "uploading" is simulated with a timeout — the state
 * machine (empty → selected/uploading → done → rejected) is what matters here,
 * not the transport. "Uploaded" copy always says "in review," never
 * "verified" — only an admin decision earns that word.
 */
export default function DocumentUpload({ label, constraint, value, onChange }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const status = value?.status || 'empty';
  const pill = STATUS_PILL[status];

  const simulateUpload = (filename) => {
    onChange({ status: 'uploading', filename, reason: null });
    setTimeout(() => onChange({ status: 'done', filename, reason: null }), 900);
  };

  const onPick = (e) => {
    const file = e.target.files?.[0];
    if (file) simulateUpload(file.name);
    e.target.value = '';
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) simulateUpload(file.name);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      className={`flex flex-col gap-2 rounded-xl border p-3.5 ${
        dragOver ? 'border-primary bg-primary-soft' : 'border-border-strong bg-surface'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-[13.5px] font-bold text-fg">{label}</span>
          <span className="text-xs text-fg-muted">{constraint}</span>
        </div>
        {status !== 'empty' && <StatusPill tone={pill.tone}>{pill.label}</StatusPill>}
      </div>

      {status === 'empty' && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="min-h-[38px] w-fit rounded-lg border border-border-loud bg-surface px-3 text-[13px] font-semibold text-fg"
        >
          Choose file
        </button>
      )}

      {status === 'uploading' && (
        <div className="flex items-center gap-2 text-xs text-fg-muted">
          <span
            aria-hidden="true"
            className="h-3.5 w-3.5 flex-none animate-spin rounded-full border-2 border-current border-t-transparent opacity-60"
          />
          <span dir="auto">{value.filename}</span>
        </div>
      )}

      {status === 'done' && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-fg-muted">
          <span dir="auto">{value.filename}</span>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="font-semibold text-primary-soft-text"
          >
            Replace
          </button>
        </div>
      )}

      {status === 'rejected' && (
        <div className="flex flex-col gap-2">
          <span className="text-xs leading-relaxed text-danger-text">
            <span aria-hidden="true">✕</span> {value.reason}
          </span>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="min-h-[38px] w-fit rounded-lg border border-border-loud bg-surface px-3 text-[13px] font-semibold text-fg"
          >
            Re-upload
          </button>
        </div>
      )}

      <input ref={inputRef} type="file" accept="image/*,.pdf" onChange={onPick} className="hidden" />
    </div>
  );
}
