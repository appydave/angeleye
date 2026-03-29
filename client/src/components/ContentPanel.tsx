import { useNav } from '../contexts/NavContext.js';
import ObserverView from '../views/ObserverView.js';
import OrganiserView from '../views/OrganiserView.js';
import SettingsView from '../views/SettingsView.js';
import MockupsView from '../views/MockupsView.js';
import WorkflowsView from '../views/WorkflowsView.js';

const viewMap: Record<string, React.ComponentType> = {
  observer: ObserverView,
  organiser: OrganiserView,
  workflows: WorkflowsView,
  settings: SettingsView,
  mockups: MockupsView,
};

export default function ContentPanel() {
  const { activeView } = useNav();
  const View = viewMap[activeView] ?? viewMap['observer'];
  return (
    <main className="flex-1 overflow-hidden bg-background flex flex-col">
      <View />
    </main>
  );
}
