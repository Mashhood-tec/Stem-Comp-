import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export function EmptyState({ icon: Icon, title, children, actions }: { icon: LucideIcon; title: string; children?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="empty-state">
      <span className="empty-icon" aria-hidden="true">
        <Icon size={28} strokeWidth={1.6} />
      </span>
      <h2 className="empty-title">{title}</h2>
      {children && <div className="empty-text">{children}</div>}
      {actions && <div className="btn-row center">{actions}</div>}
    </div>
  );
}
