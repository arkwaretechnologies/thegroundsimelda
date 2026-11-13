import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveMemberBranchId } from "@/lib/branch";
import { BOOKING_DAYS_AHEAD } from "@/lib/booking/exclusive-slots";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const branchId = await resolveMemberBranchId(supabase, user.id);
  const nowIso = new Date().toISOString();
  const untilIso = new Date(
    Date.now() + (BOOKING_DAYS_AHEAD + 1) * 86400000
  ).toISOString();

  const [{ data: occupancy }, { data: blocks }] = await Promise.all([
    supabase
      .from("bookings")
      .select("court_id, starts_at, ends_at")
      .eq("branch_id", branchId)
      .eq("type", "exclusive")
      .eq("status", "confirmed")
      .gte("ends_at", nowIso)
      .lt("starts_at", untilIso),
    supabase
      .from("court_schedule_blocks")
      .select("court_id, starts_at, ends_at")
      .eq("branch_id", branchId)
      .gte("ends_at", nowIso)
      .lt("starts_at", untilIso),
  ]);

  return NextResponse.json({
    court_occupancy: occupancy ?? [],
    court_blocks: blocks ?? [],
  });
}
