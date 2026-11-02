import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const postSchema = z.object({
  session_id: z.string().uuid(),
});

function isInsufficientBalance(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes("insufficient") && lower.includes("balance");
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionId = new URL(request.url).searchParams.get("session_id");
  const parsed = z.string().uuid().safeParse(sessionId);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid session_id" }, { status: 400 });
  }

  const { data: feeCents, error: feeError } = await supabase.rpc(
    "quote_open_play_registration_fee",
    { p_session_id: parsed.data }
  );

  if (feeError) {
    return NextResponse.json({ error: feeError.message }, { status: 400 });
  }

  const { data: wallet } = await supabase
    .from("wallets")
    .select("balance_cents")
    .eq("profile_id", user.id)
    .maybeSingle();

  return NextResponse.json({
    fee_cents: feeCents ?? 0,
    balance_cents: wallet?.balance_cents ?? 0,
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = postSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  let feeCents = 0;
  const { data: quotedFee } = await supabase.rpc(
    "quote_open_play_registration_fee",
    { p_session_id: parsed.data.session_id }
  );
  if (typeof quotedFee === "number") {
    feeCents = quotedFee;
  }

  const { data, error } = await supabase.rpc(
    "member_register_open_play_session",
    {
      p_session_id: parsed.data.session_id,
    }
  );

  if (error) {
    if (isInsufficientBalance(error.message)) {
      return NextResponse.json(
        {
          error: "Insufficient wallet balance",
          code: "insufficient_balance",
          fee_cents: feeCents,
        },
        { status: 402 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ registration: data });
}
