const mockups = [
  {
    category: 'Analysis',
    items: [
      {
        label: 'Campaign Dashboard',
        path: '/mockups/docs/planning/angeleye-analysis-1/campaign-dashboard.html',
      },
      {
        label: 'Campaign Infographic',
        path: '/mockups/docs/planning/angeleye-analysis-1/campaign-infographic.html',
      },
    ],
  },
  {
    category: 'UI Mockups',
    items: [
      {
        label: 'Chat Panel (refined)',
        path: '/mockups/.mochaccino/designs/chat-panel-refined/index.html',
      },
      { label: 'Chat Panel B', path: '/mockups/.mochaccino/designs/chat-panel-b/index.html' },
      { label: 'Chat Panel', path: '/mockups/.mochaccino/designs/chat-panel/index.html' },
      { label: 'Observer (v2 linen)', path: '/mockups/.mochaccino/designs/v2-linen/observer.html' },
    ],
  },
  {
    category: 'Named Session Rows',
    items: [
      {
        label: 'v5: Aligned Columns (recommended)',
        path: '/mockups/.mochaccino/designs/named-rows-v5-aligned/index.html',
      },
      {
        label: 'A/B/C/D Options (current Observer base)',
        path: '/mockups/.mochaccino/designs/named-rows-options/index.html',
      },
      {
        label: 'Earlier: v1 Original',
        path: '/mockups/.mochaccino/designs/named-session-rows/index.html',
      },
      {
        label: 'Earlier: v2 Tight',
        path: '/mockups/.mochaccino/designs/named-rows-v2-tight/index.html',
      },
      {
        label: 'Earlier: v3 Columns',
        path: '/mockups/.mochaccino/designs/named-rows-v3-columns/index.html',
      },
      {
        label: 'Earlier: v4 Linen Evolved',
        path: '/mockups/.mochaccino/designs/named-rows-v4-linen-evolved/index.html',
      },
    ],
  },
];

export default function MockupsView() {
  return (
    <div className="p-6 overflow-y-auto">
      <h1 className="text-lg font-semibold text-foreground mb-4">Mockups & Dashboards</h1>
      {mockups.map((group) => (
        <div key={group.category} className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            {group.category}
          </h2>
          <div className="space-y-1">
            {group.items.map((item) => (
              <a
                key={item.path}
                href={item.path}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-3 py-2 rounded text-sm text-foreground hover:bg-surface-mid transition-colors"
              >
                {item.label}
                <span className="ml-2 text-muted-foreground text-xs">&#x2197;</span>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
