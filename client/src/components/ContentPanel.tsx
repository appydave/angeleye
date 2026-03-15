import { useNav } from '../contexts/NavContext.js';
import ObserverView from '../views/ObserverView.js';
import OrganiserView from '../views/OrganiserView.js';
import SettingsView from '../views/SettingsView.js';

const viewMap: Record<string, React.ComponentType> = {
  observer: ObserverView,
  organiser: OrganiserView,
  settings: SettingsView,
};

export default function ContentPanel() {
  const { activeView } = useNav();
  const View = viewMap[activeView] ?? viewMap['observer'];
  return (
    <main className="flex-1 overflow-y-auto p-6 bg-background">
      <View />
    </main>
  );
}
