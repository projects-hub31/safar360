export default function Logo({ size = 32 }) {
  return (
    <span className="flex items-center gap-2.5">
      <svg viewBox="0 0 40 40" width={size} height={size} role="img" aria-label="safar360 home" className="flex-none overflow-visible">
        <ellipse cx="20" cy="25" rx="17" ry="6.4" fill="none" stroke="var(--accent)" strokeWidth="3.4" transform="rotate(-18 20 25)" />
        <path
          d="M20 3.5c5.6 0 10.2 4.5 10.2 10.1 0 7.1-10.2 17.6-10.2 17.6S9.8 20.7 9.8 13.6C9.8 8 14.4 3.5 20 3.5z"
          fill="var(--primary)"
        />
        <circle cx="20" cy="13.4" r="3.7" fill="var(--surface)" />
      </svg>
      <span className="font-display text-[22px] leading-none tracking-tight">
        <span className="font-bold">safar</span>
        <span className="font-medium text-primary">360</span>
      </span>
    </span>
  );
}
