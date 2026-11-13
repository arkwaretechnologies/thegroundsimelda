import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  buildHourAggregates,
  manilaHourStart,
} from "@/lib/booking/court-availability";
import { fetchCourtScheduleSnapshot } from "@/lib/booking/fetch-court-schedule";

const querySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

async function getReader() {
  try {
    return createAdminClient();
  } catch {
    return await createClient();
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({ date: url.searchParams.get("date") });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Use ?date=YYYY-MM-DD (Manila calendar day)" },
      { status: 400 }
    );
  }

  const dayKey = parsed.data.date;
  const dayStart = manilaHourStart(dayKey, 0);
  const dayEnd = new Date(dayStart.getTime() + 86400000);

  try {
    const supabase = await getReader();
    const snapshot = await fetchCourtScheduleSnapshot(
      supabase,
      undefined,
      dayStart,
      dayEnd
    );

    const slots = buildHourAggregates({
      dayKey,
      openHour: snapshot.openHour,
      closeHour: snapshot.closeHour,
      courts: snapshot.courts,
      bookings: snapshot.bookings,
      blocks: snapshot.blocks,
    });

    const hours = slots.map((s) => ({
      hour: s.hour,
      starts_at: s.start.toISOString(),
      free_courts: s.free,
      closed_courts: s.closed,
      booked_courts: s.booked,
      total_courts: s.totalCourts,
      status:
        s.totalCourts === 0
          ? "unavailable"
          : s.free === 0
            ? s.closed === s.totalCourts
              ? "closed"
              : "booked"
            : "available",
    }));

    return NextResponse.json(
      {
        date: dayKey,
        open_hour: snapshot.openHour,
        close_hour: snapshot.closeHour,
        courts: snapshot.courts,
        hours,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not load availability";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
