import { useNav } from '../contexts/NavContext.js';
import type { NavGroup } from '../config/nav.js';

export default function SidebarGroup({
  group,
  collapsed,
}: {
  group: NavGroup;
  collapsed: boolean;
}) {
  const { activeView, navigate } = useNav();

  return (
    <div className="mb-4">
      {!collapsed && (
        <p className="px-3 mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {group.label}
        </p>
      )}
      {group.items.map((item) => (
        <button
          key={item.key}
          onClick={() => navigate(item.key)}
          className={[
            'w-full text-left px-3 py-2 rounded transition-colors text-sm',
            item.tier === 'secondary' ? 'text-muted-foreground' : 'text-foreground',
            activeView === item.key
              ? 'bg-primary/15 text-primary font-medium'
              : 'hover:bg-surface-hover',
          ].join(' ')}
        >
          {collapsed ? item.label.charAt(0) : item.label}
        </button>
      ))}
    </div>
  );
}
