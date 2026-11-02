import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createQrPhTopUpIntent } from "@/lib/paymongo/client";
import { normalizeQrImageSrc } from "@/lib/paymongo/qr-image";
import { QR_EXPIRY_SECONDS } from "@/lib/wallet/topup";
import { BRAND_PAYMONGO_LABEL } from "@/lib/brand";

const bodySchema = z.object({
  amount_cents: z.number().int().min(100).max(1_000_000_00),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const { amount_cents } = parsed.data;

    const { paymentIntentId, qrImageUrl } = await createQrPhTopUpIntent({
      amountCents: amount_cents,
      description: BRAND_PAYMONGO_LABEL,
      metadata: {
        user_id: user.id,
      },
    });

    const storedQrUrl = normalizeQrImageSrc(qrImageUrl);

    const qrExpiresAt = new Date(
      Date.now() + QR_EXPIRY_SECONDS * 1000
    ).toISOString();

    const { data: topupRow, error: insertError } = await supabase
      .from("wallet_topups")
      .insert({
        profile_id: user.id,
        amount_cents,
        status: "pending",
        payment_intent_id: paymentIntentId,
        qr_expires_at: qrExpiresAt,
        qr_image_url: storedQrUrl,
      })
      .select("id, qr_expires_at")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    return NextResponse.json({
      topup_id: topupRow.id,
      payment_intent_id: paymentIntentId,
      qr_image_url: storedQrUrl,
      expires_at: topupRow.qr_expires_at,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
