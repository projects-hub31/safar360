// Plain surface card shell — radius/border/bg only, so per-screen padding and
// layout stay with the caller instead of fighting a fixed internal layout.
export default function Card({ as: Tag = 'div', className = '', children, ...props }) {
  return (
    <Tag className={`rounded-2xl border border-border bg-surface ${className}`} {...props}>
      {children}
    </Tag>
  );
}
