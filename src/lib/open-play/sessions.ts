import type { SupabaseClient } from "@supabase/supabase-js";

export type SessionCourtEmbed = {
  court_id: string;
  court: {
    id: string;
    name: string;
    status: string;
    is_open_play: boolean;
  } | null;
};

export type OpenPlaySessionRow = {
  id: string;
  branch_id: string;
  title: string | null;
  starts_at: string;
  ends_at: string;
  status: "scheduled" | "open" | "closed";
  max_players: number;
  court_id?: string | null;
  courts?: { name: string } | { name: string }[] | null;
  session_courts?: SessionCourtEmbed[];
};

const SELECTS = [
  // Rewrite: multi-court junction + optional title / court_id
  "id, branch_id, title, starts_at, ends_at, status, max_players, court_id, courts(name), session_courts:open_play_session_courts!open_play_session_courts_session_id_fkey(court_id, court:courts!open_play_session_courts_court_id_fkey(id, name, status, is_open_play))",
  // Junction without title
  "id, branch_id, starts_at, ends_at, status, max_players, court_id, courts(name), session_courts:open_play_session_courts!open_play_session_courts_session_id_fkey(court_id, court:courts!open_play_session_courts_court_id_fkey(id, name, status, is_open_play))",
  // Single court_id schema
  "id, branch_id, starts_at, ends_at, status, max_players, court_id, courts(name)",
  // Minimal columns only
  "id, branch_id, starts_at, ends_at, status, max_players",
] as const;

/** Manila has no DST. */
const MANILA_OFFSET = "+08:00";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function manilaToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function manilaDayBounds(date: string): {
  dayStart: string;
  dayEndExclusive: string;
} {
  if (!DATE_RE.test(date)) {
    throw new Error("Invalid date");
  }
  const dayStart = `${date}T00:00:00${MANILA_OFFSET}`;
  const [y, m, d] = date.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  const nextDate = `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(next.getUTCDate()).padStart(2, "0")}`;
  const dayEndExclusive = `${nextDate}T00:00:00${MANILA_OFFSET}`;
  return { dayStart, dayEndExclusive };
}

function isSchemaOrRelationError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("could not find") ||
    lower.includes("relationship") ||
    lower.includes("does not exist") ||
    lower.includes("schema cache") ||
    lower.includes("column") ||
    lower.includes("foreign key")
  );
}

function normalizeRows(data: unknown): OpenPlaySessionRow[] {
  return ((data ?? []) as OpenPlaySessionRow[]).map((row) => ({
    ...row,
    title: row.title ?? null,
    max_players: row.max_players ?? 32,
  }));
}

type SessionQuery = {
  eq: (col: string, val: string) => SessionQuery;
  in: (col: string, vals: string[]) => SessionQuery;
  gte: (col: string, val: string) => SessionQuery;
  gt: (col: string, val: string) => SessionQuery;
  lt: (col: string, val: string) => SessionQuery;
  order: (
    col: string,
    opts: { ascending: boolean }
  ) => PromiseLike<{ data: unknown; error: { message: string } | null }>;
};

async function querySessions(
  supabase: SupabaseClient,
  branchId: string,
  applyFilters: (q: SessionQuery) => SessionQuery
): Promise<OpenPlaySessionRow[]> {
  let lastError: string | null = null;

  for (const select of SELECTS) {
    const base = supabase
      .from("open_play_sessions")
      .select(select)
      .eq("branch_id", branchId)
      .in("status", ["scheduled", "open"]) as unknown as SessionQuery;

    const result = await applyFilters(base).order("starts_at", {
      ascending: true,
    });

    if (!result.error) {
      return normalizeRows(result.data);
    }

    lastError = result.error.message;
    if (!isSchemaOrRelationError(result.error.message)) {
      throw new Error(result.error.message);
    }
  }

  throw new Error(lastError ?? "Could not load open play schedules");
}

/** Upcoming sessions (legacy list). */
export async function listMemberOpenPlaySessions(
  supabase: SupabaseClient,
  branchId: string
): Promise<OpenPlaySessionRow[]> {
  const from = new Date(Date.now() - 86400000).toISOString();
  const nowIso = new Date().toISOString();

  return querySessions(supabase, branchId, (q) =>
    q.gte("starts_at", from).gt("ends_at", nowIso)
  );
}

/** Staff-created schedules overlapping a Manila calendar date. */
export async function listMemberOpenPlaySessionsForDate(
  supabase: SupabaseClient,
  branchId: string,
  date: string
): Promise<OpenPlaySessionRow[]> {
  const { dayStart, dayEndExclusive } = manilaDayBounds(date);

  return querySessions(supabase, branchId, (q) =>
    q.lt("starts_at", dayEndExclusive).gt("ends_at", dayStart)
  );
}

export function sessionCourtNames(session: OpenPlaySessionRow): string {
  const fromJunction = (session.session_courts ?? [])
    .map((sc) => sc.court?.name)
    .filter((n): n is string => Boolean(n));
  if (fromJunction.length > 0) {
    return fromJunction.join(", ");
  }

  const court = session.courts;
  if (Array.isArray(court)) {
    const names = court.map((c) => c.name).filter(Boolean);
    if (names.length > 0) return names.join(", ");
  } else if (court?.name) {
    return court.name;
  }

  return "Courts TBA";
}
