"use client";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

export function TopUpSuccessContent({
  amountCents,
  onClose,
}: {
  amountCents: number;
  onClose: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="min-h-0 flex-1 space-y-3 py-2 text-center">
        <p className="text-sm text-muted-foreground">
          Your wallet has been credited.
        </p>
        <p className="text-3xl font-semibold tabular-nums text-pv-ink">
          {formatCurrency(amountCents)}
        </p>
      </div>
      <Button
        type="button"
        className="min-h-11 w-full shrink-0 touch-manipulation"
        onClick={onClose}
      >
        Close
      </Button>
    </div>
  );
}
