import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_BRANCH_ID } from "@/lib/types/database";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Plans" };

const FALLBACK_PLANS = [
  {
    id: "1",
    name: "Day Pass",
    interval: "daily",
    price_cents: 35000,
    open_play_fee_cents: 0,
    perks: ["Court access", "Open Play included"],
  },
  {
    id: "2",
    name: "Weekly",
    interval: "weekly",
    price_cents: 120000,
    open_play_fee_cents: 5000,
    perks: ["7-day access", "Discounted Open Play"],
  },
  {
    id: "3",
    name: "Monthly",
    interval: "monthly",
    price_cents: 350000,
    open_play_fee_cents: 0,
    perks: ["Unlimited Open Play", "Priority booking"],
  },
  {
    id: "4",
    name: "Annual",
    interval: "annual",
    price_cents: 3200000,
    open_play_fee_cents: 0,
    perks: ["Best value", "Guest passes"],
  },
  {
    id: "5",
    name: "VIP",
    interval: "vip",
    price_cents: 5500000,
    open_play_fee_cents: 0,
    perks: ["VIP lounge", "Free merchandise credit"],
  },
];

export default async function PlansPage() {
  let plans = FALLBACK_PLANS;

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("membership_plans")
      .select("*")
      .eq("branch_id", DEFAULT_BRANCH_ID)
      .eq("active", true)
      .order("price_cents");
    if (data?.length) {
      plans = data.map((p) => ({
        id: p.id,
        name: p.name,
        interval: p.interval,
        price_cents: p.price_cents,
        open_play_fee_cents: p.open_play_fee_cents,
        perks: Array.isArray(p.perks) ? (p.perks as string[]) : [],
      }));
    }
  } catch {
    // Use fallback when Supabase is not configured yet
  }

  return (
    <div className="mx-auto w-full max-w-[68rem] px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
        Membership plans
      </h1>
      <p className="mt-2 max-w-lg text-sm text-muted-foreground sm:text-base">
        Pick the rhythm that fits your game — from day passes to VIP.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <div key={plan.id} className="glass flex flex-col rounded-3xl p-5">
            <Badge variant="secondary" className="w-fit capitalize">
              {plan.interval}
            </Badge>
            <h2 className="font-display mt-3 text-xl font-semibold tracking-tight">
              {plan.name}
            </h2>
            <p className="mt-1 font-display text-2xl font-bold text-primary">
              {formatCurrency(plan.price_cents)}
            </p>
            <ul className="mt-3 flex-1 space-y-1.5 text-sm text-muted-foreground">
              {(plan.perks as string[]).map((perk) => (
                <li key={perk}>• {perk}</li>
              ))}
              {plan.open_play_fee_cents === 0 ? (
                <li>• Open Play included</li>
              ) : (
                <li>
                  • Open Play {formatCurrency(plan.open_play_fee_cents)} / scan
                </li>
              )}
            </ul>
            <Button asChild className="mt-5 w-full">
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
