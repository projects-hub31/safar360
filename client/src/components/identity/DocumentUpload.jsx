import { useRef, useState } from 'react';
import StatusPill from '../ui/StatusPill';

const STATUS_PILL = {
  uploading: { tone: 'info', label: 'Uploading…' },
  done: { tone: 'success', label: 'In review' },
  approved: { tone: 'success', label: 'Approved' },
  rejected: { tone: 'danger', label: 'Rejected' },
};

/**
 * C-04 Document uploader (see CLAUDE.md design system §2). Two modes:
 * pass `onUpload` for a real submission (async, returns { ok, slot? ,
 * message? } — `slot` is the real post-submit state, from
 * utils/kycDocs.js's mapOneDocToSlot); omit it and this falls back to the
 * original simulated timeout, for the roles the real KYC backend doesn't
 * support yet (Kyc.jsx branches on this). "Uploaded" copy always says "in
 * review," never "verified" — only an admin decision earns that word, and
 * `value.approved` only changes the pill, never unlocks anything extra.
 */
export default function DocumentUpload({ label, constraint, value, onChange, onUpload }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const status = value?.status || 'empty';
  const pill = status === 'done' && value?.approved ? STATUS_PILL.approved : STATUS_PILL[status];

  const handleFile = async (file) => {
    if (!file) return;
    onChange({ status: 'uploading', filename: file.name, reason: null });

    if (!onUpload) {
      setTimeout(() => onChange({ status: 'done', filename: file.name, reason: null }), 900);
      return;
    }

    const result = await onUpload(file);
    if (!result.ok) {
      onChange({ status: 'rejected', filename: file.name, reason: result.message || 'Upload failed — try again.' });
      return;
    }
    onChange(result.slot);
  };

  const onPick = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    handleFile(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
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
          {!value.approved && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="font-semibold text-primary-soft-text"
            >
              Replace
            </button>
          )}
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
