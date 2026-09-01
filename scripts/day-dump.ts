/**
 * day-dump — dump every prompt David typed on a given day as readable markdown.
 *
 * Usage:
 *   npx tsx scripts/day-dump.ts                        # today
 *   npx tsx scripts/day-dump.ts 2026-07-25             # a specific day
 *   npx tsx scripts/day-dump.ts 2026-07-25 captains-log
 *   npx tsx scripts/day-dump.ts today angeleye > day.md
 *
 * Deliberately does NOT use /api/search: that index holds only a 200-char stub
 * of the opening prompt and `notes` is empty corpus-wide, so it cannot find
 * conversation content. Session events are the source of truth for prompt text.
 */

// Server is bound to loopback — never the Tailscale IP.
const BASE = 'http://localhost:5051';

interface SessionRow {
  session_id: string;
  project?: string | null;
  started_at?: string | null;
  last_active?: string | null;
}

interface EventRow {
  event?: string;
  ts?: string;
  timestamp?: string;
  prompt?: string;
}

/** Local YYYY-MM-DD (not UTC — David reads days in his own timezone). */
function localDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function localTime(iso: string | null | undefined): string {
  if (!iso) return '??:??';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '??:??';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Registry timestamps are UTC; the requested date is local. Compare on the
 * local calendar day so an 08:00 AEST session isn't filed under yesterday.
 */
function isOnDate(iso: string | null | undefined, date: string): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  return localDate(d) === date;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const body = (await res.json()) as { status?: string; data?: T; error?: string };
  if (body.status === 'error') throw new Error(body.error ?? 'API returned error');
  return body.data as T;
}

async function main(): Promise<void> {
  const [rawDate, projectFilter] = process.argv.slice(2);
  const date = !rawDate || rawDate === 'today' ? localDate(new Date()) : rawDate;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    console.error(`Bad date "${date}" — expected YYYY-MM-DD or "today".`);
    process.exit(1);
  }

  // No `limit` param on purpose. Two registry rows have no `last_active`, so the
  // server's sort comparator yields NaN and Array.sort ordering goes arbitrary —
  // any limited page is an unpredictable slice that can drop today entirely.
  // (`limit` also silently caps at 200, so `limit=300` was never 300.)
  // Fetch the full set and order it here.
  let sessions: SessionRow[];
  try {
    const data = await getJson<{ sessions: SessionRow[] }>(`${BASE}/api/sessions`);
    sessions = data.sessions ?? [];
  } catch (err) {
    console.error(`Could not reach AngelEye at ${BASE} — is the server running?`);
    console.error(`  ${(err as Error).message}`);
    process.exit(1);
  }

  const matches = sessions
    .filter((s) => isOnDate(s.last_active, date) || isOnDate(s.started_at, date))
    .filter((s) => !projectFilter || (s.project ?? '') === projectFilter)
    .sort((a, b) => (a.started_at ?? '').localeCompare(b.started_at ?? ''));

  const scope = projectFilter ? ` — project \`${projectFilter}\`` : '';
  console.log(`# Conversations for ${date}${scope}\n`);

  if (matches.length === 0) {
    console.log(`_No sessions found._\n`);
    return;
  }

  let totalPrompts = 0;

  for (const s of matches) {
    // A session that began on an earlier day and ran into this one gets its
    // start date spelled out, so a bare "20:02" is never read as today.
    const startedOnDay = isOnDate(s.started_at, date);
    const startLabel = startedOnDay
      ? localTime(s.started_at)
      : `${localDate(new Date(s.started_at ?? ''))} ${localTime(s.started_at)} (carried over)`;
    const heading = `## ${startLabel} — ${s.project ?? 'unknown'} — \`${s.session_id}\``;

    let events: EventRow[] = [];
    let fetchError: string | null = null;
    try {
      const data = await getJson<{ events: EventRow[] } | EventRow[]>(
        `${BASE}/api/sessions/${s.session_id}/events?limit=500`
      );
      events = Array.isArray(data) ? data : (data.events ?? []);
    } catch (err) {
      fetchError = (err as Error).message;
    }

    if (fetchError) {
      console.log(`${heading} — **(events unavailable: ${fetchError})**\n`);
      continue;
    }

    const prompts = events.filter((e) => e.event === 'user_prompt');
    totalPrompts += prompts.length;

    if (prompts.length === 0) {
      // Surfaced, never skipped — a silent gap is worse than a visible one.
      console.log(`${heading} — **(no events)**\n`);
      continue;
    }

    console.log(`${heading} — ${prompts.length} prompt${prompts.length === 1 ? '' : 's'}\n`);

    prompts.forEach((p, i) => {
      const ts = localTime(p.ts ?? p.timestamp);
      console.log(`### ${i + 1}. ${ts}\n`);
      console.log(`${p.prompt ?? '(empty prompt)'}\n`);
    });
  }

  console.log(`---\n`);
  console.log(`_${matches.length} session(s), ${totalPrompts} prompt(s)._`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
