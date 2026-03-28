import GitSyncPill from './GitSyncPill.js';

export default function Header() {
  return (
    <header className="h-14 flex items-center gap-4 px-5 border-b border-border bg-card shrink-0">
      <span className="text-[28px] leading-none">
        <span
          className="text-foreground tracking-[0.02em]"
          style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontWeight: 400 }}
        >
          Angel
        </span>
        <span
          className="text-primary tracking-[-0.02em] uppercase"
          style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900 }}
        >
          EYE
        </span>
      </span>
      <div className="flex items-center gap-3 ml-auto text-muted-foreground text-sm">
        <GitSyncPill />
        <span className="text-xs">v0.1.0</span>
      </div>
    </header>
  );
}
