import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/staff";
import { mapBookingErrorMessage } from "@/lib/booking/court-availability";

const schema = z.object({
  court_id: z.string().uuid(),
  starts_at: z.string(),
  ends_at: z.string(),
  walk_in_label: z.string().trim().max(120).optional(),
});

export async function POST(request: Request) {
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

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid booking" }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("staff_create_booking", {
    p_court_id: parsed.data.court_id,
    p_starts_at: parsed.data.starts_at,
    p_ends_at: parsed.data.ends_at,
    p_walk_in_label: parsed.data.walk_in_label ?? null,
  });

  if (error) {
    return NextResponse.json(
      { error: mapBookingErrorMessage(error.message) },
      { status: 400 }
    );
  }

  return NextResponse.json({ booking: data });
}
