// A real switch (role="switch"), not a styled checkbox — used for on/off
// preferences (notification classes, menu-item availability), distinct from
// the plain checkboxes used in filter panels.
export default function Toggle({ id, checked, onChange, label, description }) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-3 py-1">
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-semibold text-fg">{label}</span>
        {description && <span className="text-xs leading-relaxed text-fg-muted">{description}</span>}
      </span>
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        aria-label={description ? undefined : label}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-10 flex-none rounded-full border transition-colors duration-150 ${
          checked ? 'border-primary bg-primary' : 'border-border-strong bg-sunken'
        }`}
      >
        <span
          aria-hidden="true"
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sh1 transition-transform duration-150 ${
            checked ? 'translate-x-[19px]' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}
