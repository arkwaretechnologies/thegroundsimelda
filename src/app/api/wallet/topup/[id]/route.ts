import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPaymentIntent } from "@/lib/paymongo/client";
import { normalizeQrImageSrc } from "@/lib/paymongo/qr-image";
import { syncTopupFromPayMongo } from "@/lib/wallet/fulfill-topup";
import {
  effectiveQrExpiresAt,
  effectiveTopupStatus,
  isTopupExpired,
} from "@/lib/wallet/topup";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("wallet_topups")
      .select(
        "id, status, amount_cents, qr_expires_at, created_at, updated_at, qr_image_url, payment_intent_id, profile_id"
      )
      .eq("id", id)
      .eq("profile_id", user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    let status = data.status;
    const expiresAt = effectiveQrExpiresAt(
      data.created_at,
      data.qr_expires_at
    );

    if (isTopupExpired(status, data.qr_expires_at, data.created_at)) {
      const admin = createAdminClient();
      await admin
        .from("wallet_topups")
        .update({ status: "expired", updated_at: new Date().toISOString() })
        .eq("id", data.id)
        .eq("status", "pending");
      status = "expired";
    } else if (status === "pending" && data.payment_intent_id) {
      try {
        const admin = createAdminClient();
        const sync = await syncTopupFromPayMongo(admin, {
          id: data.id,
          profile_id: data.profile_id,
          amount_cents: data.amount_cents,
          status: data.status,
          payment_intent_id: data.payment_intent_id,
        });
        if (sync.synced) {
          status = "paid";
        }
      } catch {
        /* poll sync is best-effort */
      }
    }

    const effectiveStatus = effectiveTopupStatus(
      status,
      data.qr_expires_at,
      data.created_at
    );
    let qrImageUrl: string | null = null;

    if (effectiveStatus === "pending") {
      qrImageUrl = data.qr_image_url
        ? normalizeQrImageSrc(data.qr_image_url)
        : null;
      if (!qrImageUrl && data.payment_intent_id) {
        try {
          const intent = await getPaymentIntent(data.payment_intent_id);
          const raw =
            intent.data.attributes.next_action?.code?.image_url ?? null;
          qrImageUrl = raw ? normalizeQrImageSrc(raw) : null;
        } catch {
          qrImageUrl = null;
        }
      }
    }

    return NextResponse.json({
      topup: {
        id: data.id,
        status: effectiveStatus,
        amount_cents: data.amount_cents,
        qr_expires_at: expiresAt,
        updated_at: data.updated_at,
        qr_image_url: qrImageUrl,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
