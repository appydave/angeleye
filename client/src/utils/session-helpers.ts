import type { RegistryEntry } from '@appystack/shared';

export function timeAgo(isoString: string): string {
  const secs = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}

export function sessionLabel(entry: RegistryEntry): string {
  if (entry.name) return entry.name;
  if (entry.project) return entry.project;
  if (entry.project_dir) {
    const base = entry.project_dir.split('/').filter(Boolean).pop();
    if (base) return base;
  }
  return entry.session_id?.slice(0, 8) ?? 'unknown';
}

export function statusDot(
  isoString: string,
  status?: string
): { symbol: string; className: string } {
  if (status === 'ended') return { symbol: '○', className: 'text-muted-foreground' };
  const secs = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (secs < 30) return { symbol: '●', className: 'text-green-500' };
  if (secs < 120) return { symbol: '●', className: 'text-amber-400' };
  return { symbol: '○', className: 'text-muted-foreground' };
}
