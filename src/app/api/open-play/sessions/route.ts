import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { resolveMemberBranchId } from "@/lib/branch";
import {
  listMemberOpenPlaySessionsForDate,
  sessionCourtNames,
} from "@/lib/open-play/sessions";

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

  const parsed = querySchema.safeParse({
    date: new URL(request.url).searchParams.get("date"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const branchId = await resolveMemberBranchId(supabase, user.id);

  let sessionRows;
  try {
    sessionRows = await listMemberOpenPlaySessionsForDate(
      supabase,
      branchId,
      parsed.data.date
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not load sessions" },
      { status: 400 }
    );
  }

  const sessionIds = sessionRows.map((s) => s.id);

  let countBySession: Record<string, number> = {};
  let myRegBySession: Record<string, string> = {};

  if (sessionIds.length > 0) {
    const [{ data: regCounts, error: regCountError }, { data: myRegs, error: myRegError }] =
      await Promise.all([
        supabase
          .from("open_play_registrations")
          .select("session_id")
          .in("session_id", sessionIds)
          .in("status", ["registered", "checked_in"]),
        supabase
          .from("open_play_registrations")
          .select("session_id, status")
          .eq("profile_id", user.id)
          .in("session_id", sessionIds)
          .neq("status", "cancelled"),
      ]);

    // If registrations table is missing, still return schedules with zero counts.
    if (!regCountError) {
      countBySession = (regCounts ?? []).reduce<Record<string, number>>(
        (acc, row) => {
          acc[row.session_id] = (acc[row.session_id] ?? 0) + 1;
          return acc;
        },
        {}
      );
    }

    if (!myRegError) {
      myRegBySession = (myRegs ?? []).reduce<Record<string, string>>(
        (acc, row) => {
          acc[row.session_id] = row.status;
          return acc;
        },
        {}
      );
    }
  }

  return NextResponse.json({
    sessions: sessionRows.map((s) => ({
      id: s.id,
      title: s.title ?? "Open Play",
      starts_at: s.starts_at,
      ends_at: s.ends_at,
      status: s.status,
      max_players: s.max_players,
      court_names: sessionCourtNames(s),
      registered_count: countBySession[s.id] ?? 0,
      my_registration_status: myRegBySession[s.id] ?? null,
    })),
  });
}
