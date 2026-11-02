import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookSignature } from "@/lib/paymongo/client";
import {
  extractPaymentIdFromEvent,
  extractPaymentIntentId,
  extractWebhookEventType,
  isPaymentSuccessEvent,
} from "@/lib/paymongo/webhook-events";
import { creditTopupIfPending } from "@/lib/wallet/fulfill-topup";

export const runtime = "nodejs";

function getSignatureHeader(request: Request): string | null {
  return (
    request.headers.get("paymongo-signature") ??
    request.headers.get("Paymongo-Signature")
  );
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = getSignatureHeader(request);

    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    let event: unknown;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const eventType = extractWebhookEventType(event);
    const admin = createAdminClient();

    if (isPaymentSuccessEvent(eventType)) {
      const paymentIntentId = extractPaymentIntentId(event);
      if (paymentIntentId) {
        const paymentId =
          extractPaymentIdFromEvent(event) ?? paymentIntentId;

        const { data: topup, error } = await admin
          .from("wallet_topups")
          .select("id, profile_id, amount_cents, status, payment_intent_id")
          .eq("payment_intent_id", paymentIntentId)
          .maybeSingle();

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        if (topup) {
          await creditTopupIfPending(admin, topup, paymentId);
        }
      }
      return NextResponse.json({ received: true });
    }

    const payload = (event as { data?: { attributes?: { data?: unknown } } })
      ?.data?.attributes?.data;
    const nestedAttrs =
      payload &&
      typeof payload === "object" &&
      "attributes" in payload &&
      typeof (payload as { attributes: unknown }).attributes === "object"
        ? ((payload as { attributes: Record<string, unknown> }).attributes as {
            payment_intent_id?: string;
          })
        : null;
    const paymentIntentIdFromPayment =
      nestedAttrs?.payment_intent_id ??
      extractPaymentIntentId(event);

    if (eventType === "payment.failed" && paymentIntentIdFromPayment) {
      await admin
        .from("wallet_topups")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("payment_intent_id", paymentIntentIdFromPayment)
        .eq("status", "pending");
    }

    if (eventType === "qrph.expired" && paymentIntentIdFromPayment) {
      await admin
        .from("wallet_topups")
        .update({ status: "expired", updated_at: new Date().toISOString() })
        .eq("payment_intent_id", paymentIntentIdFromPayment)
        .eq("status", "pending");
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
