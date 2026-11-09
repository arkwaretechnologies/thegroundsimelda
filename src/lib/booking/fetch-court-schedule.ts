import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_BRANCH_ID } from "@/lib/types/database";
import type { TimeInterval } from "@/lib/booking/court-availability";
import { BOOKING_DAYS_AHEAD } from "@/lib/booking/exclusive-slots";

export type CourtRef = { id: string; name: string; status?: string };

export type CourtScheduleSnapshot = {
  branchId: string;
  courts: CourtRef[];
  bookings: TimeInterval[];
  blocks: TimeInterval[];
  openHour: number;
  closeHour: number;
  exclusiveFeeCents: number;
  openPlayFeeCents: number;
};

export async function fetchCourtScheduleSnapshot(
  supabase: SupabaseClient,
  branchId: string = DEFAULT_BRANCH_ID,
  rangeStart?: Date,
  rangeEnd?: Date
): Promise<CourtScheduleSnapshot> {
  const now = rangeStart ?? new Date();
  const until =
    rangeEnd ??
    new Date(now.getTime() + (BOOKING_DAYS_AHEAD + 1) * 86400000);

  const [courtsRes, busyRes, blocksRes, settingsRes] = await Promise.all([
    supabase
      .from("courts")
      .select("id, name, status")
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
      .from("court_schedule_blocks")
      .select("court_id, starts_at, ends_at")
      .eq("branch_id", branchId)
      .gte("ends_at", now.toISOString())
      .lt("starts_at", until.toISOString()),
    supabase
      .from("branch_settings")
      .select(
        "exclusive_open_hour, exclusive_close_hour, exclusive_court_fee_cents, default_open_play_fee_cents"
      )
      .eq("branch_id", branchId)
      .maybeSingle(),
  ]);

  const settings = settingsRes.data;

  return {
    branchId,
    courts: courtsRes.data ?? [],
    bookings: (busyRes.data ?? []) as TimeInterval[],
    blocks: (blocksRes.data ?? []) as TimeInterval[],
    openHour: settings?.exclusive_open_hour ?? 6,
    closeHour: settings?.exclusive_close_hour ?? 22,
    exclusiveFeeCents: settings?.exclusive_court_fee_cents ?? 50000,
    openPlayFeeCents: settings?.default_open_play_fee_cents ?? 12000,
  };
}
