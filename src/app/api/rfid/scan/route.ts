import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_BRANCH_ID } from "@/lib/types/database";

const schema = z.object({
  card_uid: z.string().min(3),
  branch_id: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  const apiKey = request.headers.get("x-rfid-api-key");
  if (!apiKey || apiKey !== process.env.RFID_API_KEY) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const branchId = parsed.data.branch_id ?? DEFAULT_BRANCH_ID;
  const admin = createAdminClient();

  const { data, error } = await admin.rpc("rfid_scan", {
    p_card_uid: parsed.data.card_uid,
    p_branch_id: branchId,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, result: data });
}
