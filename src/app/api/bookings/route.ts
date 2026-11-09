import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { mapBookingErrorMessage } from "@/lib/booking/court-availability";

const schema = z.object({
  court_id: z.string().uuid(),
  starts_at: z.string(),
  ends_at: z.string(),
  type: z.enum(["exclusive", "open_play"]).default("exclusive"),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid booking" }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("create_booking", {
    p_court_id: parsed.data.court_id,
    p_starts_at: parsed.data.starts_at,
    p_ends_at: parsed.data.ends_at,
    p_type: parsed.data.type,
  });

  if (error) {
    return NextResponse.json(
      { error: mapBookingErrorMessage(error.message) },
      { status: 400 }
    );
  }

  return NextResponse.json({ booking: data });
}
