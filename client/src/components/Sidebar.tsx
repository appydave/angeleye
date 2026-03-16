import { useNav } from '../contexts/NavContext.js';
import { navConfig } from '../config/nav.js';
import SidebarGroup from './SidebarGroup.js';

export default function Sidebar() {
  const { contextNav } = useNav();
  const nav = contextNav ?? navConfig;

  return (
    <aside className="flex flex-col border-r border-border bg-surface shrink-0 w-56">
      <nav className="flex-1 overflow-y-auto p-2 pt-4">
        {nav.map((group) => (
          <SidebarGroup key={group.label} group={group} />
        ))}
      </nav>
    </aside>
  );
}
