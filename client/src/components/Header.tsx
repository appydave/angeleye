export default function Header() {
  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-border bg-surface shrink-0">
      <span className="font-bebas text-2xl tracking-wider text-primary">AngelEye</span>
      <div className="flex items-center gap-3 text-muted-foreground text-sm">
        <span className="text-xs">v0.1.0</span>
      </div>
    </header>
  );
}
