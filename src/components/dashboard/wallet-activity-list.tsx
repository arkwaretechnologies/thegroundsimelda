"use client";

import { useMemo, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { effectiveTopupStatus } from "@/lib/wallet/topup";
import { PendingTopupModal } from "@/components/dashboard/pending-topup-modal";
import { cn } from "@/lib/utils";

export type WalletTransactionRow = {
  id: string;
  type: string;
  amount_cents: number;
  reference: string | null;
  created_at: string;
};

export type WalletTopupRow = {
  id: string;
  amount_cents: number;
  status: string;
  qr_expires_at: string | null;
  created_at: string;
};

type ActivityItem =
  | { kind: "tx"; data: WalletTransactionRow }
  | { kind: "topup"; data: WalletTopupRow };

function mergeActivity(
  txs: WalletTransactionRow[],
  topups: WalletTopupRow[]
): ActivityItem[] {
  const items: ActivityItem[] = [
    ...txs.map((data) => ({ kind: "tx" as const, data })),
    ...topups.map((data) => ({ kind: "topup" as const, data })),
  ];
  items.sort(
    (a, b) =>
      new Date(b.data.created_at).getTime() -
      new Date(a.data.created_at).getTime()
  );
  return items;
}

function topupBadgeVariant(
  status: ReturnType<typeof effectiveTopupStatus>
): "warning" | "outline" | "secondary" {
  if (status === "pending") return "warning";
  if (status === "failed") return "secondary";
  return "outline";
}

export function WalletActivityList({
  transactions,
  topups,
  variant = "wallet",
}: {
  transactions: WalletTransactionRow[];
  topups: WalletTopupRow[];
  variant?: "wallet" | "history";
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const items = useMemo(
    () => mergeActivity(transactions, topups),
    [transactions, topups]
  );

  function openPending(topupId: string) {
    setPendingId(topupId);
    setModalOpen(true);
  }

  const rowClass =
    variant === "history"
      ? "flex justify-between rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm"
      : "flex items-center justify-between gap-3 py-3 text-sm";

  return (
    <>
      <ul
        className={
          variant === "wallet" ? "mt-4 divide-y divide-border/60" : "space-y-3"
        }
      >
        {items.length === 0 && (
          <li className="py-4 text-sm text-muted-foreground">
            No transactions yet.
          </li>
        )}
        {items.map((item) => {
          if (item.kind === "tx") {
            const tx = item.data;
            return (
              <li key={`tx-${tx.id}`} className={rowClass}>
                <div>
                  <p className="font-medium capitalize">{tx.type}</p>
                  <p className="text-muted-foreground">
                    {variant === "wallet" ? (
                      <>
                        {tx.reference ?? "—"} · {formatDate(tx.created_at)}
                      </>
                    ) : (
                      formatDate(tx.created_at)
                    )}
                  </p>
                </div>
                {variant === "wallet" ? (
                  <Badge variant={tx.amount_cents >= 0 ? "success" : "outline"}>
                    {tx.amount_cents >= 0 ? "+" : ""}
                    {formatCurrency(tx.amount_cents)}
                  </Badge>
                ) : (
                  <span>{formatCurrency(tx.amount_cents)}</span>
                )}
              </li>
            );
          }

          const topup = item.data;
          const status = effectiveTopupStatus(
            topup.status,
            topup.qr_expires_at,
            topup.created_at
          );
          const clickable = status === "pending";

          const inner = (
            <>
              <div>
                <p className="font-medium">Top up</p>
                <p className="text-muted-foreground">
                  {formatDate(topup.created_at)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {variant === "wallet" && (
                  <Badge variant="success">
                    +{formatCurrency(topup.amount_cents)}
                  </Badge>
                )}
                <Badge variant={topupBadgeVariant(status)} className="capitalize">
                  {status}
                </Badge>
              </div>
            </>
          );

          if (clickable) {
            return (
              <li key={`topup-${topup.id}`}>
                <button
                  type="button"
                  onClick={() => openPending(topup.id)}
                  className={cn(
                    rowClass,
                    "w-full cursor-pointer text-left transition-colors hover:bg-[rgba(212,168,69,0.06)]"
                  )}
                >
                  {inner}
                </button>
              </li>
            );
          }

          return (
            <li key={`topup-${topup.id}`} className={rowClass}>
              {inner}
            </li>
          );
        })}
      </ul>
      <PendingTopupModal
        topupId={pendingId}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
}
