import type { SupabaseClient } from "@supabase/supabase-js";
import { getPaymentIntent } from "@/lib/paymongo/client";

export type TopupRow = {
  id: string;
  profile_id: string;
  amount_cents: number;
  status: string;
  payment_intent_id: string | null;
};

export async function creditTopupIfPending(
  admin: SupabaseClient,
  topup: TopupRow,
  paymentReference: string
): Promise<boolean> {
  if (topup.status === "paid") return true;

  const { error: rpcError } = await admin.rpc("wallet_topup_for_profile", {
    p_profile_id: topup.profile_id,
    p_amount_cents: topup.amount_cents,
    p_reference: paymentReference,
  });

  if (rpcError) {
    throw new Error(rpcError.message);
  }

  const { error: updateError } = await admin
    .from("wallet_topups")
    .update({
      status: "paid",
      payment_id: paymentReference,
      updated_at: new Date().toISOString(),
    })
    .eq("id", topup.id)
    .eq("status", "pending");

  if (updateError) {
    throw new Error(updateError.message);
  }

  return true;
}

export async function syncTopupFromPayMongo(
  admin: SupabaseClient,
  topup: TopupRow
): Promise<{ synced: boolean; status: string }> {
  if (topup.status !== "pending" || !topup.payment_intent_id) {
    return { synced: false, status: topup.status };
  }

  const intent = await getPaymentIntent(topup.payment_intent_id);
  const intentStatus = intent.data.attributes.status;

  if (intentStatus !== "succeeded") {
    return { synced: false, status: topup.status };
  }

  const reference = topup.payment_intent_id;
  await creditTopupIfPending(admin, topup, reference);
  return { synced: true, status: "paid" };
}
