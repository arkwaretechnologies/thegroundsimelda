// Server only: uses the service-role client.
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_BRANCH_ID } from "@/lib/types/database";
import {
  listMemberOpenPlaySessions,
  sessionCourtNames,
} from "@/lib/open-play/sessions";

/**
 * Public, anonymised schedule data for the marketing page.
 * Only times, court names and counts leave the server — never who booked.
 */
export type PublicSchedule = {
  courts: { id: string; name: string }[];
  /** Confirmed exclusive bookings (court + time range only). */
  busy: { court_id: string; starts_at: string; ends_at: string }[];
  sessions: {
    id: string;
    title: string;
    starts_at: string;
    ends_at: string;
    courts: string;
    max_players: number;
    registered: number;
  }[];
  openHour: number;
  closeHour: number;
  exclusiveFeeCents: number;
  openPlayFeeCents: number;
};

export type PublicTournament = {
  id: string;
  name: string;
  description: string | null;
  status: "registration" | "seeding" | "ongoing";
  format: string;
  starts_at: string | null;
  ends_at: string | null;
  max_players: number;
  entry_fee_cents: number;
  registered: number;
};

const DAYS_AHEAD = 7;

async function getReader(): Promise<SupabaseClient> {
  try {
    return createAdminClient();
  } catch {
    // Without a service key fall back to anon (RLS may hide some rows).
    return (await createClient()) as unknown as SupabaseClient;
  }
}

const EMPTY_SCHEDULE: PublicSchedule = {
  courts: [],
  busy: [],
  sessions: [],
  openHour: 6,
  closeHour: 22,
  exclusiveFeeCents: 50000,
  openPlayFeeCents: 12000,
};

export async function getPublicSchedule(): Promise<PublicSchedule> {
  try {
    const supabase = await getReader();
    const branchId = DEFAULT_BRANCH_ID;
    const now = new Date();
    const until = new Date(now.getTime() + (DAYS_AHEAD + 1) * 86400000);

    const [courtsRes, busyRes, settingsRes, sessionRows] = await Promise.all([
      supabase
        .from("courts")
        .select("id, name")
        .eq("branch_id", branchId)
        .eq("is_exclusive", true)
        .eq("status", "available")
        .order("sort_order"),
      supabase
        .from("bookings")
        .select("court_id, starts_at, ends_at")
        .eq("branch_id", branchId)
        .eq("type", "exclusive")
        .eq("status", "confirmed")
        .gte("ends_at", now.toISOString())
        .lt("starts_at", until.toISOString()),
      supabase
        .from("branch_settings")
        .select(
          "exclusive_open_hour, exclusive_close_hour, exclusive_court_fee_cents, default_open_play_fee_cents"
        )
        .eq("branch_id", branchId)
        .maybeSingle(),
      listMemberOpenPlaySessions(supabase, branchId).catch(() => []),
    ]);

    const sessions = sessionRows.filter(
      (s) => new Date(s.starts_at) < until
    );

    const counts = new Map<string, number>();
    if (sessions.length) {
      const { data: regs } = await supabase
        .from("open_play_registrations")
        .select("session_id")
        .in(
          "session_id",
          sessions.map((s) => s.id)
        )
        .neq("status", "cancelled");
      for (const r of regs ?? []) {
        counts.set(r.session_id, (counts.get(r.session_id) ?? 0) + 1);
      }
    }

    const s = settingsRes.data;
    return {
      courts: courtsRes.data ?? [],
      busy: busyRes.data ?? [],
      sessions: sessions.map((row) => ({
        id: row.id,
        title: row.title ?? "Open Play",
        starts_at: row.starts_at,
        ends_at: row.ends_at,
        courts: sessionCourtNames(row),
        max_players: row.max_players,
        registered: counts.get(row.id) ?? 0,
      })),
      openHour: s?.exclusive_open_hour ?? EMPTY_SCHEDULE.openHour,
      closeHour: s?.exclusive_close_hour ?? EMPTY_SCHEDULE.closeHour,
      exclusiveFeeCents:
        s?.exclusive_court_fee_cents ?? EMPTY_SCHEDULE.exclusiveFeeCents,
      openPlayFeeCents:
        s?.default_open_play_fee_cents ?? EMPTY_SCHEDULE.openPlayFeeCents,
    };
  } catch {
    return EMPTY_SCHEDULE;
  }
}

export async function getPublicTournaments(): Promise<PublicTournament[]> {
  try {
    const supabase = await getReader();
    const { data, error } = await supabase
      .from("tournaments")
      .select(
        "id, name, description, status, format, starts_at, ends_at, max_players, entry_fee_cents"
      )
      .eq("branch_id", DEFAULT_BRANCH_ID)
      .in("status", ["registration", "seeding", "ongoing"])
      .order("starts_at", { ascending: true, nullsFirst: false })
      .limit(6);
    if (error || !data?.length) return [];

    const counts = new Map<string, number>();
    const { data: regs } = await supabase
      .from("tournament_registrations")
      .select("tournament_id")
      .in(
        "tournament_id",
        data.map((t) => t.id)
      )
      .neq("status", "withdrawn");
    for (const r of regs ?? []) {
      counts.set(r.tournament_id, (counts.get(r.tournament_id) ?? 0) + 1);
    }

    return data.map((t) => ({
      ...t,
      registered: counts.get(t.id) ?? 0,
    })) as PublicTournament[];
  } catch {
    return [];
  }
}
