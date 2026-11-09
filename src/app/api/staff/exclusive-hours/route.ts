import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/staff";
import { resolveMemberBranchId } from "@/lib/branch";

const schema = z.object({
  open_hour: z.number().int().min(0).max(23),
  close_hour: z.number().int().min(1).max(24),
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
  if (!parsed.success || parsed.data.open_hour >= parsed.data.close_hour) {
    return NextResponse.json({ error: "Invalid hours" }, { status: 400 });
  }

  const branchId = await resolveMemberBranchId(supabase, user.id);

  const { error } = await supabase.rpc("staff_update_exclusive_hours", {
    p_branch_id: branchId,
    p_open_hour: parsed.data.open_hour,
    p_close_hour: parsed.data.close_hour,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
