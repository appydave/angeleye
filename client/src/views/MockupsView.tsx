import { useState, useEffect, useCallback } from 'react';

const MOCKUP_BASE = '/mockups/.mochaccino/designs';

type Rating = 'liked' | 'chosen' | undefined;
type Ratings = Record<string, 'liked' | 'chosen'>;

interface FeatureMockup {
  name: string;
  desc: string;
  path: string;
  featured?: boolean;
}

interface ThemeMockup {
  num: number;
  name: string;
  tagline: string;
  desc: string;
  palette: string[];
  selected?: boolean;
  links: { label: string; path: string }[];
}

interface Phase {
  title: string;
  tag: string;
  tagType?: 'new' | 'default';
  dates: string;
  desc: string;
  type: 'feature' | 'theme';
  items: FeatureMockup[] | ThemeMockup[];
}

const phases: Phase[] = [
  {
    title: 'Phase 5 — Wave Visualization',
    tag: 'Latest',
    tagType: 'new',
    dates: '2026-03-28',
    desc: 'Wave-based agent workflow visualization. The complete design system for viewing BMAD story lifecycles as horizontal waves with three-panel drill-down, audit intelligence, handover controls, and sub-agent tree views.',
    type: 'feature',
    items: [
      {
        name: 'wave-infographic',
        desc: 'Design system infographic — visual poster of the entire wave visualization concept',
        path: `${MOCKUP_BASE}/wave-infographic/index.html`,
        featured: true,
      },
      {
        name: 'wave-three-panel',
        desc: 'Full wave view — wave bar + agent profile + transcript + audit log',
        path: `${MOCKUP_BASE}/wave-three-panel/index.html`,
        featured: true,
      },
      {
        name: 'wave-bar',
        desc: 'Three wave bar variants — clean run, active+pending, backtrack with SVG arcs',
        path: `${MOCKUP_BASE}/wave-bar/index.html`,
        featured: true,
      },
      {
        name: 'wave-audit-panel',
        desc: 'Audit panel comparison — predicates, observations, classifications, extractions across 3 agents',
        path: `${MOCKUP_BASE}/wave-audit-panel/index.html`,
        featured: true,
      },
      {
        name: 'wave-sprint-board',
        desc: 'Sprint board — Kanban with 7 story cards, Epic 0 toggle, progressive disclosure entry',
        path: `${MOCKUP_BASE}/wave-sprint-board/index.html`,
        featured: true,
      },
      {
        name: 'wave-handover',
        desc: 'Handover UX — PASS, CONDITIONAL PASS, and REJECT scenarios with paste-back messages',
        path: `${MOCKUP_BASE}/wave-handover/index.html`,
        featured: true,
      },
      {
        name: 'wave-subagents',
        desc: "Sub-agent tree — Nate's 6 review agents with expanded tool call timeline and findings",
        path: `${MOCKUP_BASE}/wave-subagents/index.html`,
        featured: true,
      },
    ] as FeatureMockup[],
  },
  {
    title: 'Design System',
    tag: '2 designs',
    dates: '2026-03-27',
    desc: 'Logo wordmark explorations and competitive landscape analysis.',
    type: 'feature',
    items: [
      {
        name: 'reference-landscape',
        desc: '31 systems across orchestration, observability, and emerging — with GitHub links, synthesis patterns, and AngelEye differentiation',
        path: `${MOCKUP_BASE}/reference-landscape/index.html`,
        featured: true,
      },
      {
        name: 'logo-variations',
        desc: '10 AngelEye wordmark explorations — typography, weight, glow, pill, stacked, outline',
        path: `${MOCKUP_BASE}/logo-variations/index.html`,
        featured: true,
      },
    ] as FeatureMockup[],
  },
  {
    title: 'Phase 4 — Chain Visualization',
    tag: '4 designs',
    dates: '2026-03-27',
    desc: 'Story chain and session enrichment views. Kanban boards, horizontal pipelines, and detail panels for understanding how sessions compose into larger workflows.',
    type: 'feature',
    items: [
      {
        name: 'chain-sprint-board',
        desc: 'Kanban board — story chains across lifecycle stages',
        path: `${MOCKUP_BASE}/chain-sprint-board/index.html`,
        featured: true,
      },
      {
        name: 'chain-story-pipeline',
        desc: 'Horizontal pipeline — Story 2.4 with agent nodes and backtracks',
        path: `${MOCKUP_BASE}/chain-story-pipeline/index.html`,
        featured: true,
      },
      {
        name: 'chain-session-detail',
        desc: 'Session enrichment panels — predicates, classifiers, workflow context',
        path: `${MOCKUP_BASE}/chain-session-detail/index.html`,
        featured: true,
      },
      {
        name: 'story-walkthrough',
        desc: 'Guided story walkthrough — step through a chain with narrative context',
        path: `${MOCKUP_BASE}/story-walkthrough/index.html`,
        featured: true,
      },
    ] as FeatureMockup[],
  },
  {
    title: 'Phase 3 — Sync UX',
    tag: '5 designs',
    dates: '2026-03-25 to 2026-03-26',
    desc: 'Iterating on the sync button, diff table, and progress states. From initial layout through to the polished final treatment with inline change indicators.',
    type: 'feature',
    items: [
      {
        name: 'sync-ux-a',
        desc: 'Sync button and diff table — initial layout exploration',
        path: `${MOCKUP_BASE}/sync-ux-a/index.html`,
      },
      {
        name: 'sync-ux-b',
        desc: 'Diff table refinement — column alignment and density tuning',
        path: `${MOCKUP_BASE}/sync-ux-b/index.html`,
      },
      {
        name: 'sync-ux-c',
        desc: 'Sync progress states — loading, success, and error treatment',
        path: `${MOCKUP_BASE}/sync-ux-c/index.html`,
      },
      {
        name: 'sync-ux-d',
        desc: 'Compact diff summary with inline change indicators',
        path: `${MOCKUP_BASE}/sync-ux-d/index.html`,
      },
      {
        name: 'sync-ux-e',
        desc: 'Final sync UX — polished diff view with action buttons',
        path: `${MOCKUP_BASE}/sync-ux-e/index.html`,
      },
    ] as FeatureMockup[],
  },
  {
    title: 'Phase 2 — Feature Design',
    tag: '10 designs',
    dates: '2026-03-24 to 2026-03-25',
    desc: 'Chat transcript panels and named session row treatments. Exploring how conversations display in side panels and how named sessions stand out from unnamed ones.',
    type: 'feature',
    items: [
      {
        name: 'chat-panel',
        desc: 'Session transcript side panel — conversation view of a session',
        path: `${MOCKUP_BASE}/chat-panel/index.html`,
      },
      {
        name: 'chat-panel-a',
        desc: 'Transcript panel iteration A — layout and density exploration',
        path: `${MOCKUP_BASE}/chat-panel-a/index.html`,
      },
      {
        name: 'chat-panel-b',
        desc: 'Transcript panel iteration B — alternative message styling',
        path: `${MOCKUP_BASE}/chat-panel-b/index.html`,
      },
      {
        name: 'chat-panel-refined',
        desc: 'Transcript panel final — polished message layout and scroll behavior',
        path: `${MOCKUP_BASE}/chat-panel-refined/index.html`,
      },
      {
        name: 'named-session-rows',
        desc: 'Named vs unnamed session row treatment — pennant glyph, name as hero',
        path: `${MOCKUP_BASE}/named-session-rows/index.html`,
      },
      {
        name: 'named-rows-v2-tight',
        desc: 'Tighter padding, session ID on hover only, middot separator',
        path: `${MOCKUP_BASE}/named-rows-v2-tight/index.html`,
      },
      {
        name: 'named-rows-v3-columns',
        desc: 'Fixed columns for when, pulse, and star — with column headers',
        path: `${MOCKUP_BASE}/named-rows-v3-columns/index.html`,
      },
      {
        name: 'named-rows-v4-linen-evolved',
        desc: 'Linen structure with Active/Ended groups and type column',
        path: `${MOCKUP_BASE}/named-rows-v4-linen-evolved/index.html`,
      },
      {
        name: 'named-rows-options',
        desc: 'Side-by-side layout option comparison for named rows',
        path: `${MOCKUP_BASE}/named-rows-options/index.html`,
      },
      {
        name: 'named-rows-v5-aligned',
        desc: 'Final aligned layout — consistent column widths and visual rhythm',
        path: `${MOCKUP_BASE}/named-rows-v5-aligned/index.html`,
      },
    ] as FeatureMockup[],
  },
  {
    title: 'Phase 1 — Theme Exploration',
    tag: '5 themes',
    dates: '2026-03-15',
    desc: 'Five visual directions for the AngelEye observer. Each theme explores a different relationship between dark and light zones, card elevation, and typographic weight. v2-linen was selected as the design direction.',
    type: 'theme',
    items: [
      {
        num: 1,
        name: 'Paper',
        tagline: 'Warm parchment + dark sidebar',
        desc: 'A well-designed document. Warm parchment as the main canvas, dark sidebar as the one intentional dark zone. Sessions feel like entries in an operations log.',
        palette: ['#f2ece4', '#faf7f3', '#1c1714', '#c8841a', '#2a2018', '#8a7a6a'],
        links: [
          { label: 'Observer', path: `${MOCKUP_BASE}/v1-paper/observer.html` },
          { label: 'Organiser', path: `${MOCKUP_BASE}/v1-paper/organiser.html` },
        ],
      },
      {
        num: 2,
        name: 'Linen',
        tagline: 'Floating cards on warm linen canvas',
        desc: 'Sessions float as white cards above a richer linen canvas. The card/background elevation is the design. Dark column header for structural weight.',
        palette: ['#e8e0d4', '#f5f1eb', '#2a2018', '#c8841a', '#ddd6cc', '#7a6e5e'],
        selected: true,
        links: [
          { label: 'Observer', path: `${MOCKUP_BASE}/v2-linen/observer.html` },
          { label: 'Organiser', path: `${MOCKUP_BASE}/v2-linen/organiser.html` },
        ],
      },
      {
        num: 3,
        name: 'Continuity',
        tagline: 'Dark nav + warm cream content',
        desc: 'Dark sidebar as navigation home, warm cream as the content world. You live in the dark nav but work in the light.',
        palette: ['#1a1512', '#f0ebe2', '#c8841a', '#e8e0d4', '#2a2018', '#8a7a68'],
        links: [
          { label: 'Observer', path: `${MOCKUP_BASE}/v3-continuity/observer.html` },
          { label: 'Organiser', path: `${MOCKUP_BASE}/v3-continuity/organiser.html` },
        ],
      },
      {
        num: 4,
        name: 'Cockpit Light',
        tagline: 'Active sessions render dark — live instruments',
        desc: 'Light canvas overall but active sessions render as dark rows. Like lit instruments on an operations panel. Dark = live, light = history.',
        palette: ['#f0ebe4', '#2a2018', '#c8841a', '#1a1512', '#f0ebe4', '#8a7a68'],
        links: [
          { label: 'Observer', path: `${MOCKUP_BASE}/v4-cockpit-light/observer.html` },
          { label: 'Organiser', path: `${MOCKUP_BASE}/v4-cockpit-light/organiser.html` },
        ],
      },
      {
        num: 5,
        name: 'Brief',
        tagline: 'Typography as the interface',
        desc: 'Maximum typographic clarity. No cards, no chrome. Session names are the hero. An amber rule divides live from history.',
        palette: ['#f5f1eb', '#f0ebe2', '#1a1410', '#c8841a', '#fef3e2', '#9a8a78'],
        links: [
          { label: 'Observer', path: `${MOCKUP_BASE}/v5-brief/observer.html` },
          { label: 'Organiser', path: `${MOCKUP_BASE}/v5-brief/organiser.html` },
        ],
      },
    ] as ThemeMockup[],
  },
  {
    title: 'Analysis Dashboards',
    tag: '3 designs',
    dates: '2026-03-23 to 2026-03-29',
    desc: 'Campaign analysis views — static dashboards, infographics, and hybrid overlays that compare live registry data against analysis campaign mock data.',
    type: 'feature',
    items: [
      {
        name: 'campaign-dashboard-hybrid',
        desc: 'Hybrid dashboard — live registry data overlaid on mock data with LIVE/MOCK/PARTIAL badges and coverage summary',
        path: `${MOCKUP_BASE}/campaign-dashboard-hybrid/index.html`,
        featured: true,
      },
      {
        name: 'campaign-dashboard',
        desc: 'Campaign analysis dashboard — session metrics and patterns',
        path: '/mockups/docs/planning/angeleye-analysis-1/campaign-dashboard.html',
      },
      {
        name: 'campaign-infographic',
        desc: 'Campaign infographic — visual summary of session data',
        path: '/mockups/docs/planning/angeleye-analysis-1/campaign-infographic.html',
      },
    ] as FeatureMockup[],
  },
];

const totalMockups = phases.reduce((sum, phase) => {
  if (phase.type === 'theme') {
    return sum + (phase.items as ThemeMockup[]).reduce((s, t) => s + t.links.length, 0);
  }
  return sum + phase.items.length;
}, 0);

// ── Rating cycle: unrated → liked → chosen → unrated ──

const RATING_CYCLE: Rating[] = [undefined, 'liked', 'chosen'];

function nextRating(current: Rating): Rating {
  const idx = RATING_CYCLE.indexOf(current);
  return RATING_CYCLE[(idx + 1) % RATING_CYCLE.length];
}

function RatingBadge({
  rating,
  onClick,
}: {
  rating: Rating;
  onClick: (e: React.MouseEvent) => void;
}) {
  if (!rating) {
    return (
      <button
        onClick={onClick}
        className="shrink-0 w-7 h-7 rounded-full border border-border text-muted-foreground/40 hover:border-primary/50 hover:text-primary/60 transition-all flex items-center justify-center"
        title="Click to rate: liked"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      </button>
    );
  }
  if (rating === 'liked') {
    return (
      <button
        onClick={onClick}
        className="shrink-0 w-7 h-7 rounded-full bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 transition-all flex items-center justify-center"
        title="Liked — click for chosen"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.7"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      </button>
    );
  }
  // chosen
  return (
    <button
      onClick={onClick}
      className="shrink-0 w-7 h-7 rounded-full bg-primary text-white border border-primary shadow-[0_0_8px_rgba(200,132,26,0.4)] hover:shadow-[0_0_12px_rgba(200,132,26,0.6)] transition-all flex items-center justify-center"
      title="Chosen — click to clear"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    </button>
  );
}

function FeatureCard({
  item,
  rating,
  onRate,
}: {
  item: FeatureMockup;
  rating: Rating;
  onRate: (key: string, rating: Rating) => void;
}) {
  const handleRate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onRate(item.name, nextRating(rating));
  };

  return (
    <div
      className={`flex items-center gap-3 rounded-md border bg-card p-4 transition-all hover:shadow-md hover:border-border-raised ${
        rating === 'chosen'
          ? 'border-primary shadow-[0_0_12px_rgba(200,132,26,0.15)]'
          : rating === 'liked'
            ? 'border-primary/40'
            : item.featured
              ? 'border-l-[3px] border-l-primary'
              : 'border-border'
      }`}
    >
      <RatingBadge rating={rating} onClick={handleRate} />
      <a
        href={item.path}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 min-w-0 no-underline"
      >
        <div className="text-[13px] font-bold text-foreground tracking-wide">{item.name}</div>
        <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{item.desc}</div>
      </a>
      <a
        href={item.path}
        target="_blank"
        rel="noopener noreferrer"
        className={`shrink-0 px-3.5 py-1.5 rounded text-[11px] font-semibold uppercase tracking-wider no-underline ${
          item.featured ? 'bg-primary text-white' : 'bg-surface-mid text-foreground'
        }`}
      >
        Open
      </a>
    </div>
  );
}

function ThemeCard({
  item,
  ratings,
  onRate,
}: {
  item: ThemeMockup;
  ratings: Ratings;
  onRate: (key: string, rating: Rating) => void;
}) {
  return (
    <div
      className={`rounded-lg border overflow-hidden shadow-sm transition-all hover:shadow-md hover:-translate-y-px ${
        item.selected ? 'border-primary' : 'border-border'
      }`}
    >
      <div className="bg-foreground px-4 py-3.5 flex items-center gap-3 relative">
        <span
          className="text-primary font-bold text-2xl leading-none min-w-[24px]"
          style={{ fontFamily: "'Bebas Neue', sans-serif" }}
        >
          {item.num}
        </span>
        <div>
          <div className="text-card text-sm font-bold uppercase tracking-widest">{item.name}</div>
          <div className="text-[11px] mt-px" style={{ color: '#8a7a68' }}>
            {item.tagline}
          </div>
        </div>
        {item.selected && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-primary text-white text-[9px] font-bold px-2 py-0.5 rounded tracking-wider uppercase">
            Selected
          </span>
        )}
      </div>
      <div className="bg-card px-4 py-3.5">
        <div className="flex gap-1.5 mb-2.5">
          {item.palette.map((color, i) => (
            <div
              key={i}
              className="w-[18px] h-[18px] rounded-sm border border-black/8"
              style={{ background: color }}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed mb-3">{item.desc}</p>
        <div className="flex items-center gap-2">
          {item.links.map((link) => {
            const key = `${item.name.toLowerCase()}-${link.label.toLowerCase()}`;
            const r = ratings[key] as Rating;
            return (
              <div key={link.path} className="flex items-center gap-1.5">
                <RatingBadge
                  rating={r}
                  onClick={(e) => {
                    e.preventDefault();
                    onRate(key, nextRating(r));
                  }}
                />
                <a
                  href={link.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-block px-3.5 py-1.5 rounded text-[11px] font-semibold uppercase tracking-wider no-underline transition-colors ${
                    link.label === 'Observer'
                      ? 'bg-primary text-white hover:bg-primary/85'
                      : 'bg-surface border border-border text-foreground hover:bg-surface-mid'
                  }`}
                >
                  {link.label}
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PhaseSection({
  phase,
  ratings,
  onRate,
}: {
  phase: Phase;
  ratings: Ratings;
  onRate: (key: string, rating: Rating) => void;
}) {
  const isNew = phase.tagType === 'new';

  return (
    <section className="mb-2">
      <div className={`mb-5 pb-3 border-b ${isNew ? 'border-primary' : 'border-border'}`}>
        <div className="inline-flex items-center gap-2.5 mb-1.5">
          <h2
            className="text-2xl tracking-wider text-foreground"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          >
            {phase.title}
          </h2>
          <span
            className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
              isNew ? 'bg-primary text-white' : 'bg-surface-mid text-muted-foreground'
            }`}
          >
            {phase.tag}
          </span>
        </div>
        <div className="text-xs text-muted-foreground/70 tracking-wide">{phase.dates}</div>
        <p className="text-[13px] text-muted-foreground mt-1 max-w-2xl">{phase.desc}</p>
      </div>

      {phase.type === 'feature' ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3.5 mb-10">
          {(phase.items as FeatureMockup[]).map((item) => (
            <FeatureCard
              key={item.path}
              item={item}
              rating={ratings[item.name] as Rating}
              onRate={onRate}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(440px,1fr))] gap-5 mb-10">
          {(phase.items as ThemeMockup[]).map((item) => (
            <ThemeCard key={item.num} item={item} ratings={ratings} onRate={onRate} />
          ))}
        </div>
      )}
    </section>
  );
}

function FilterBar({
  filter,
  onFilter,
  counts,
}: {
  filter: 'all' | 'liked' | 'chosen';
  onFilter: (f: 'all' | 'liked' | 'chosen') => void;
  counts: { liked: number; chosen: number };
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onFilter('all')}
        className={`px-3 py-1 rounded text-[11px] font-semibold uppercase tracking-wider transition-colors ${
          filter === 'all'
            ? 'bg-foreground text-card'
            : 'bg-surface-mid text-muted-foreground hover:bg-border'
        }`}
      >
        All
      </button>
      <button
        onClick={() => onFilter('liked')}
        className={`px-3 py-1 rounded text-[11px] font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
          filter === 'liked'
            ? 'bg-primary/20 text-primary border border-primary/30'
            : 'bg-surface-mid text-muted-foreground hover:bg-border'
        }`}
      >
        Liked {counts.liked > 0 && <span className="text-[10px]">({counts.liked})</span>}
      </button>
      <button
        onClick={() => onFilter('chosen')}
        className={`px-3 py-1 rounded text-[11px] font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
          filter === 'chosen'
            ? 'bg-primary text-white'
            : 'bg-surface-mid text-muted-foreground hover:bg-border'
        }`}
      >
        Chosen {counts.chosen > 0 && <span className="text-[10px]">({counts.chosen})</span>}
      </button>
    </div>
  );
}

export default function MockupsView() {
  const [ratings, setRatings] = useState<Ratings>({});
  const [filter, setFilter] = useState<'all' | 'liked' | 'chosen'>('all');

  useEffect(() => {
    fetch('/api/preferences')
      .then((r) => r.json())
      .then((json) => {
        if (json.status === 'ok' && json.data?.mockupRatings) {
          setRatings(json.data.mockupRatings);
        }
      })
      .catch(() => {});
  }, []);

  const handleRate = useCallback((key: string, rating: Rating) => {
    setRatings((prev) => {
      const next = { ...prev };
      if (!rating) {
        delete next[key];
      } else {
        next[key] = rating;
      }
      return next;
    });

    fetch('/api/preferences/mockup-rating', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, rating: rating ?? null }),
    }).catch(() => {});
  }, []);

  const counts = {
    liked: Object.values(ratings).filter((r) => r === 'liked').length,
    chosen: Object.values(ratings).filter((r) => r === 'chosen').length,
  };

  // Collect all mockup keys that match the filter
  const ratedKeys = new Set(
    Object.entries(ratings)
      .filter(([, r]) => filter === 'all' || r === filter)
      .map(([k]) => k)
  );

  const shouldShow = (key: string) => filter === 'all' || ratedKeys.has(key);

  // Filter phases — for feature phases, filter items; for theme phases, filter by any link rated
  const filteredPhases = phases
    .map((phase) => {
      if (filter === 'all') return phase;
      if (phase.type === 'feature') {
        const items = (phase.items as FeatureMockup[]).filter((item) => shouldShow(item.name));
        if (items.length === 0) return null;
        return { ...phase, items };
      }
      // theme — show if any link for this theme is rated at the filter level
      const items = (phase.items as ThemeMockup[]).filter((item) =>
        item.links.some((link) => {
          const key = `${item.name.toLowerCase()}-${link.label.toLowerCase()}`;
          return shouldShow(key);
        })
      );
      if (items.length === 0) return null;
      return { ...phase, items };
    })
    .filter(Boolean) as Phase[];

  return (
    <div className="overflow-y-auto h-full">
      {/* Gallery header */}
      <div className="bg-foreground px-10 py-7 flex items-baseline gap-4 flex-wrap">
        <span
          className="text-primary text-3xl tracking-wider"
          style={{ fontFamily: "'Bebas Neue', sans-serif" }}
        >
          AngelEye
        </span>
        <span className="text-[13px] tracking-wider" style={{ color: '#6a5e52' }}>
          Design Gallery
        </span>
        <div className="ml-auto flex items-center gap-3">
          <FilterBar filter={filter} onFilter={setFilter} counts={counts} />
          <span className="text-[11px] tracking-wide" style={{ color: '#6a5e52' }}>
            Mar 15 — Mar 29, 2026
          </span>
          <span className="bg-primary text-foreground text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            {totalMockups} mockups
          </span>
        </div>
      </div>

      {/* Phases */}
      <div className="px-10 pt-8 pb-8">
        {filteredPhases.length > 0 ? (
          filteredPhases.map((phase) => (
            <PhaseSection key={phase.title} phase={phase} ratings={ratings} onRate={handleRate} />
          ))
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-sm">No {filter} mockups yet.</p>
            <p className="text-xs mt-1">Click the star on any mockup card to rate it.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mx-10 py-5 border-t border-border text-[11px] text-muted-foreground/60 tracking-wide">
        Mochaccino — AngelEye design gallery — {totalMockups} mockups across {phases.length} phases
        — v2-linen design system
      </div>
    </div>
  );
}
