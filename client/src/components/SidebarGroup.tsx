import { useNav } from '../contexts/NavContext.js';
import type { NavGroup } from '../config/nav.js';

export default function SidebarGroup({ group }: { group: NavGroup }) {
  const { activeView, navigate } = useNav();

  return (
    <div className="mb-4">
      <p className="px-3 mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {group.label}
      </p>
      {group.items.map((item) => (
        <button
          key={item.key}
          onClick={() => navigate(item.key)}
          className={[
            'w-full text-left px-3 py-2 rounded transition-colors text-sm',
            activeView === item.key
              ? 'border-l-2 border-l-primary text-foreground font-semibold bg-surface-mid'
              : 'border-l-2 border-l-transparent text-foreground hover:bg-surface-mid',
          ].join(' ')}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
