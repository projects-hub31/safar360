import { useId } from 'react';

// C-02 Form field (see CLAUDE.md design system §2). Validate on blur, never on
// keystroke — pass onBlur, not onChange, to any validation you wire up here.
// `prefix` renders the with-prefix variant (e.g. a "+92" country code) inline,
// as its own isolate so it never reverses under RTL.
export default function TextField({ label, id, error, helper, prefix, className = '', inputClassName = '', ...props }) {
  const autoId = useId();
  const fieldId = id || autoId;
  const noteId = error || helper ? `${fieldId}-note` : undefined;
  const borderTone = error ? 'border-danger' : 'border-border-strong';

  const input = (
    <input
      id={fieldId}
      aria-invalid={!!error || undefined}
      aria-describedby={noteId}
      className={`min-h-[44px] w-full text-[15px] text-fg placeholder:text-fg-subtle ${
        prefix ? 'bg-transparent px-2' : `rounded-lg border bg-raised px-3 ${borderTone}`
      } ${inputClassName}`}
      {...props}
    />
  );

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label htmlFor={fieldId} className="text-[12.5px] font-bold text-fg">
          {label}
        </label>
      )}
      {prefix ? (
        <div className={`flex min-h-[44px] items-center rounded-lg border bg-raised pl-3 ${borderTone}`}>
          <span dir="ltr" className="flex-none font-mono text-[15px] text-fg-muted">
            {prefix}
          </span>
          {input}
        </div>
      ) : (
        input
      )}
      {(error || helper) && (
        <span
          id={noteId}
          className={`flex items-start gap-1.5 text-xs leading-relaxed ${error ? 'text-danger-text' : 'text-fg-muted'}`}
        >
          {error && <span aria-hidden="true">✕</span>}
          <span>{error || helper}</span>
        </span>
      )}
    </div>
  );
}
