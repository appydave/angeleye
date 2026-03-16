export default function Header() {
  return (
    <header className="h-14 flex items-center gap-4 px-5 border-b border-border bg-card shrink-0">
      <span className="font-bebas text-2xl tracking-[0.15em] text-foreground uppercase">
        Angel<span className="text-primary">Eye</span>
      </span>
      <div className="flex items-center gap-3 ml-auto text-muted-foreground text-sm">
        <span className="text-xs">v0.1.0</span>
      </div>
    </header>
  );
}
