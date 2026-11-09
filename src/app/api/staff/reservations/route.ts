import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/staff";
import { resolveMemberBranchId } from "@/lib/branch";
import {
  buildCourtHourGrid,
  manilaHourStart,
} from "@/lib/booking/court-availability";
import { fetchCourtScheduleSnapshot } from "@/lib/booking/fetch-court-schedule";

const querySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const gate = await requireStaff(supabase, user.id);
  if (!gate.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({ date: url.searchParams.get("date") });
  if (!parsed.success) {
    return NextResponse.json({ error: "Use ?date=YYYY-MM-DD" }, { status: 400 });
  }

  const dayKey = parsed.data.date;
  const dayStart = manilaHourStart(dayKey, 0);
  const dayEnd = new Date(dayStart.getTime() + 86400000);
  const branchId = await resolveMemberBranchId(supabase, user.id);

  try {
    const snapshot = await fetchCourtScheduleSnapshot(
      supabase,
      branchId,
      dayStart,
      dayEnd
    );

    const [{ data: blockRows }, { data: bookingRows }] = await Promise.all([
      supabase
        .from("court_schedule_blocks")
        .select("id, court_id, starts_at, ends_at, reason")
        .eq("branch_id", branchId)
        .gte("ends_at", dayStart.toISOString())
        .lt("starts_at", dayEnd.toISOString()),
      supabase
        .from("bookings")
        .select(
          "id, court_id, starts_at, ends_at, walk_in_label, profile_id, status"
        )
        .eq("branch_id", branchId)
        .eq("type", "exclusive")
        .eq("status", "confirmed")
        .gte("ends_at", dayStart.toISOString())
        .lt("starts_at", dayEnd.toISOString()),
    ]);

    const { hours, cells } = buildCourtHourGrid({
      dayKey,
      openHour: snapshot.openHour,
      closeHour: snapshot.closeHour,
      courts: snapshot.courts,
      bookings: snapshot.bookings,
      blocks: snapshot.blocks,
    });

    return NextResponse.json({
      date: dayKey,
      branch_id: branchId,
      open_hour: snapshot.openHour,
      close_hour: snapshot.closeHour,
      courts: snapshot.courts,
      hours,
      cells,
      blocks: blockRows ?? [],
      bookings: bookingRows ?? [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not load grid";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
