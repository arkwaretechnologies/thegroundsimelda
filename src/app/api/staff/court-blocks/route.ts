import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/staff";

const bodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("close_hours"),
    court_id: z.string().uuid(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    hours: z.array(z.number().int().min(0).max(23)),
    reason: z.string().max(200).optional(),
  }),
  z.object({
    action: z.literal("close_day"),
    court_id: z.string().uuid(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    reason: z.string().max(200).optional(),
  }),
  z.object({
    action: z.literal("delete"),
    block_ids: z.array(z.string().uuid()).min(1),
  }),
]);

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

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const body = parsed.data;

  if (body.action === "close_hours") {
    const { error } = await supabase.rpc("staff_set_court_blocks", {
      p_court_id: body.court_id,
      p_date: body.date,
      p_hours: body.hours,
      p_reason: body.reason ?? null,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }

  if (body.action === "close_day") {
    const { error } = await supabase.rpc("staff_close_court_day", {
      p_court_id: body.court_id,
      p_date: body.date,
      p_reason: body.reason ?? null,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }

  const { error } = await supabase.rpc("staff_delete_court_blocks", {
    p_block_ids: body.block_ids,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
