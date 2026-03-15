import { NavProvider } from '../contexts/NavContext.js';
import Header from './Header.js';
import Sidebar from './Sidebar.js';
import ContentPanel from './ContentPanel.js';

export default function AppShell() {
  return (
    <NavProvider>
      <div className="flex flex-col h-screen overflow-hidden">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <ContentPanel />
        </div>
      </div>
    </NavProvider>
  );
}
