// Server only: uses the service-role client.
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_BRANCH_ID } from "@/lib/types/database";
import {
  countOpenPlayRegistrations,
  countTournamentRegistrations,
  listMemberOpenPlaySessions,
  sessionCourtNames,
} from "@/lib/open-play/sessions";
import { BOOKING_DAYS_AHEAD } from "@/lib/booking/exclusive-slots";
import { fetchCourtScheduleSnapshot } from "@/lib/booking/fetch-court-schedule";

/**
 * Public, anonymised schedule data for the marketing page.
 * Only times, court names and counts leave the server — never who booked.
 */
export type PublicSchedule = {
  courts: { id: string; name: string }[];
  /** Confirmed exclusive bookings (court + time range only). */
  busy: { court_id: string; starts_at: string; ends_at: string }[];
  /** Staff closures (court + time range only). */
  blocks: { court_id: string; starts_at: string; ends_at: string }[];
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
  blocks: [],
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
    const until = new Date(
      now.getTime() + (BOOKING_DAYS_AHEAD + 1) * 86400000
    );

    const [snapshot, sessionRows] = await Promise.all([
      fetchCourtScheduleSnapshot(supabase, branchId, now, until),
      listMemberOpenPlaySessions(supabase, branchId).catch(() => []),
    ]);

    const sessions = sessionRows.filter(
      (s) => new Date(s.starts_at) < until
    );

    const counts = sessions.length
      ? await countOpenPlayRegistrations(
          supabase,
          sessions.map((s) => s.id)
        )
      : new Map<string, number>();

    return {
      courts: snapshot.courts.map((c) => ({ id: c.id, name: c.name })),
      busy: snapshot.bookings.map((row) => ({
        court_id: row.court_id!,
        starts_at: row.starts_at,
        ends_at: row.ends_at,
      })),
      blocks: snapshot.blocks.map((row) => ({
        court_id: row.court_id!,
        starts_at: row.starts_at,
        ends_at: row.ends_at,
      })),
      sessions: sessions.map((row) => ({
        id: row.id,
        title: row.title ?? "Open Play",
        starts_at: row.starts_at,
        ends_at: row.ends_at,
        courts: sessionCourtNames(row),
        max_players: row.max_players,
        registered: counts.get(row.id) ?? 0,
      })),
      openHour: snapshot.openHour,
      closeHour: snapshot.closeHour,
      exclusiveFeeCents: snapshot.exclusiveFeeCents,
      openPlayFeeCents: snapshot.openPlayFeeCents,
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

    const counts = await countTournamentRegistrations(
      supabase,
      data.map((t) => t.id)
    );

    return data.map((t) => ({
      ...t,
      registered: counts.get(t.id) ?? 0,
    })) as PublicTournament[];
  } catch {
    return [];
  }
}
