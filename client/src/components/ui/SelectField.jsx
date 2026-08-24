import { useId } from 'react';

// C-02 Form field, select variant (see CLAUDE.md design system §2).
export default function SelectField({ label, id, helper, options, className = '', selectClassName = '', ...props }) {
  const autoId = useId();
  const fieldId = id || autoId;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label htmlFor={fieldId} className="text-[12.5px] font-bold text-fg">
          {label}
        </label>
      )}
      <select
        id={fieldId}
        aria-describedby={helper ? `${fieldId}-note` : undefined}
        className={`min-h-[44px] w-full cursor-pointer rounded-lg border border-border-strong bg-raised px-3 text-[15px] text-fg ${selectClassName}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {helper && (
        <span id={`${fieldId}-note`} className="text-xs leading-relaxed text-fg-muted">
          {helper}
        </span>
      )}
    </div>
  );
}
