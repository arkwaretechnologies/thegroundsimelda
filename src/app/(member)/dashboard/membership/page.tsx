import { createClient } from "@/lib/supabase/server";
import { DEFAULT_BRANCH_ID } from "@/lib/types/database";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/shared/glass";
import { Badge } from "@/components/ui/badge";
import { PurchasePlanButton } from "@/components/dashboard/purchase-plan-button";

export const metadata = { title: "Membership" };

export default async function MembershipPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: membership }, { data: plans }] = await Promise.all([
    supabase
      .from("memberships")
      .select("ends_at, membership_plans(name, interval)")
      .eq("profile_id", user!.id)
      .eq("status", "active")
      .order("ends_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("membership_plans")
      .select("id, name, interval, price_cents, open_play_fee_cents, perks")
      .eq("branch_id", DEFAULT_BRANCH_ID)
      .eq("active", true)
      .order("price_cents"),
  ]);

  const planRaw = membership?.membership_plans;
  const plan = (
    Array.isArray(planRaw) ? planRaw[0] : planRaw
  ) as { name: string; interval: string } | null | undefined;

  return (
    <div>
      <PageHeader
        title="Membership"
        description="Activate a plan with your wallet balance."
      />

      <div className="glass mb-5 rounded-2xl p-4">
        <h2 className="text-sm font-semibold text-pv-ink">Current status</h2>
        {membership ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant="success">{plan?.name ?? "Active"}</Badge>
            <span className="text-sm text-muted-foreground">
              Valid until {formatDate(membership.ends_at)}
            </span>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            No active membership. Choose a plan below.
          </p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {(plans ?? []).map((p) => (
          <PurchasePlanButton
            key={p.id}
            plan={{
              id: p.id,
              name: p.name,
              interval: p.interval,
              price_cents: p.price_cents,
              open_play_fee_cents: p.open_play_fee_cents,
              perks: Array.isArray(p.perks) ? (p.perks as string[]) : [],
            }}
          />
        ))}
      </div>
    </div>
  );
}
