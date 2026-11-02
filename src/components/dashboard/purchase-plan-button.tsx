"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Plan = {
  id: string;
  name: string;
  interval: string;
  price_cents: number;
  open_play_fee_cents: number;
  perks: string[];
};

export function PurchasePlanButton({ plan }: { plan: Plan }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function purchase() {
    setLoading(true);
    try {
      const res = await fetch("/api/memberships/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_id: plan.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Purchase failed");
      toast.success(`${plan.name} activated`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Purchase failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass flex flex-col rounded-2xl p-4">
      <Badge variant="secondary" className="w-fit capitalize">
        {plan.interval}
      </Badge>
      <h3 className="mt-2 text-base font-semibold tracking-tight">{plan.name}</h3>
      <p className="mt-0.5 text-xl font-semibold tabular-nums text-primary">
        {formatCurrency(plan.price_cents)}
      </p>
      <ul className="mt-3 flex-1 space-y-1 text-sm text-muted-foreground">
        {plan.perks.map((p) => (
          <li key={p}>• {p}</li>
        ))}
      </ul>
      <Button className="mt-5" onClick={purchase} disabled={loading}>
        {loading ? "Purchasing…" : "Buy with wallet"}
      </Button>
    </div>
  );
}
