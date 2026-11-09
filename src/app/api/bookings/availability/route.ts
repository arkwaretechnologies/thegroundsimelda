import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveMemberBranchId } from "@/lib/branch";

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

  const [{ data: occupancy }, { data: blocks }] = await Promise.all([
    supabase
      .from("bookings")
      .select("court_id, starts_at, ends_at")
      .eq("branch_id", branchId)
      .eq("type", "exclusive")
      .eq("status", "confirmed")
      .gte("ends_at", nowIso),
    supabase
      .from("court_schedule_blocks")
      .select("court_id, starts_at, ends_at")
      .eq("branch_id", branchId)
      .gte("ends_at", nowIso),
  ]);

  return NextResponse.json({
    court_occupancy: occupancy ?? [],
    court_blocks: blocks ?? [],
  });
}
