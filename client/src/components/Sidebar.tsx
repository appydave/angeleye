import { useNav } from '../contexts/NavContext.js';
import { navConfig } from '../config/nav.js';
import SidebarGroup from './SidebarGroup.js';

export default function Sidebar() {
  const { collapsed, contextNav, toggleCollapsed } = useNav();
  const nav = contextNav ?? navConfig;

  return (
    <aside
      className={[
        'flex flex-col border-r border-border bg-surface shrink-0 transition-all duration-200',
        collapsed ? 'w-12' : 'w-56',
      ].join(' ')}
    >
      <nav className="flex-1 overflow-y-auto p-2 pt-4">
        {nav.map((group) => (
          <SidebarGroup key={group.label} group={group} collapsed={collapsed} />
        ))}
      </nav>
      <button
        onClick={toggleCollapsed}
        className="flex items-center justify-center h-10 border-t border-border text-muted-foreground hover:text-foreground text-xs transition-colors"
        title={collapsed ? 'Expand' : 'Collapse'}
      >
        {collapsed ? '▶' : '◀ collapse'}
      </button>
    </aside>
  );
}
