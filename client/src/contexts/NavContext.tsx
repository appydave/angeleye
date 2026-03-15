import { createContext, useContext, useState } from 'react';
import type { NavConfig } from '../config/nav.js';

interface NavContextValue {
  activeView: string;
  collapsed: boolean;
  contextNav: NavConfig | null;
  navigate: (viewKey: string) => void;
  toggleCollapsed: () => void;
  setContextNav: (nav: NavConfig | null) => void;
}

const NavContext = createContext<NavContextValue | null>(null);

export function NavProvider({ children }: { children: React.ReactNode }) {
  const [activeView, setActiveView] = useState('observer');
  const [collapsed, setCollapsed] = useState(false);
  const [contextNav, setContextNav] = useState<NavConfig | null>(null);

  return (
    <NavContext.Provider
      value={{
        activeView,
        collapsed,
        contextNav,
        navigate: setActiveView,
        toggleCollapsed: () => setCollapsed((c) => !c),
        setContextNav,
      }}
    >
      {children}
    </NavContext.Provider>
  );
}

export function useNav() {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error('useNav must be used within NavProvider');
  return ctx;
}
