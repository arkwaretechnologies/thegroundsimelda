import { createClient } from "@/lib/supabase/server";
import { PageHeader, WalletBadge } from "@/components/shared/glass";
import { TopUpButton } from "@/components/dashboard/top-up-button";
import { WalletActivityList } from "@/components/dashboard/wallet-activity-list";

export const metadata = { title: "Wallet" };

export default async function WalletPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: wallet } = await supabase
    .from("wallets")
    .select("id, balance_cents")
    .eq("profile_id", user!.id)
    .maybeSingle();

  const [{ data: txs }, { data: topups }] = await Promise.all([
    wallet
      ? supabase
          .from("wallet_transactions")
          .select("id, type, amount_cents, reference, created_at")
          .eq("wallet_id", wallet.id)
          .order("created_at", { ascending: false })
          .limit(30)
      : Promise.resolve({ data: [] as never[] }),
    supabase
      .from("wallet_topups")
      .select("id, amount_cents, status, qr_expires_at, created_at")
      .eq("profile_id", user!.id)
      .neq("status", "paid")
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  return (
    <div>
      <PageHeader
        title="Wallet"
        description="Top up via QR Ph and track every debit."
        action={<TopUpButton />}
      />
      <div className="mb-6">
        <WalletBadge balanceCents={wallet?.balance_cents ?? 0} />
      </div>
      <div className="glass rounded-2xl p-4">
        <h2 className="text-sm font-semibold text-pv-ink">Transactions</h2>
        <WalletActivityList
          transactions={txs ?? []}
          topups={topups ?? []}
          variant="wallet"
        />
      </div>
    </div>
  );
}
