"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { normalizeQrImageSrc } from "@/lib/paymongo/qr-image";
import { formatCurrency } from "@/lib/utils";
import {
  TOPUP_PAYMONGO_SYNC_EVERY_POLLS,
  TOPUP_POLL_INTERVAL_MS,
} from "@/lib/wallet/topup";

export type TopUpQrSession = {
  topup_id: string;
  qr_image_url: string;
  expires_at: string;
  amount_cents: number;
};

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function TopUpQrPanel({
  session,
  active,
  onClose,
  onExpired,
  onPaid,
}: {
  session: TopUpQrSession;
  active: boolean;
  onClose: () => void;
  onExpired?: () => void;
  onPaid: (amountCents: number) => void;
}) {
  const router = useRouter();
  const expiredNotified = useRef(false);
  const paidHandled = useRef(false);
  const pollIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [remainingMs, setRemainingMs] = useState(() =>
    Math.max(0, new Date(session.expires_at).getTime() - Date.now())
  );
  const expired = remainingMs <= 0;

  useEffect(() => {
    if (!active) return;
    const tick = () => {
      setRemainingMs(
        Math.max(0, new Date(session.expires_at).getTime() - Date.now())
      );
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [active, session.expires_at]);

  useEffect(() => {
    if (!active || !expired || expiredNotified.current) return;
    expiredNotified.current = true;
    toast.error("QR expired — try again");
    onExpired?.();
    router.refresh();
  }, [active, expired, onExpired, router]);

  useEffect(() => {
    if (!active || expired || paidHandled.current) return;

    let cancelled = false;
    let pollCount = 0;
    let delay = TOPUP_POLL_INTERVAL_MS;

    const tick = async () => {
      if (cancelled || paidHandled.current) return;
      pollCount += 1;
      const sync =
        pollCount % TOPUP_PAYMONGO_SYNC_EVERY_POLLS === 0 ? "&sync=1" : "";
      try {
        const res = await fetch(
          `/api/wallet/topup/${session.topup_id}?poll=1${sync}`
        );
        const data = await res.json();
        if (!res.ok || cancelled || paidHandled.current) return;
        const status = data.topup?.status as string | undefined;
        if (status === "paid") {
          paidHandled.current = true;
          onPaid(session.amount_cents);
          router.refresh();
          return;
        }
        if (status === "failed" || status === "expired") {
          toast.error(
            status === "expired" ? "QR expired — try again" : "Payment failed"
          );
          onExpired?.();
          router.refresh();
          return;
        }
      } catch {
        /* ignore poll errors */
      }
      delay = Math.min(delay + 1000, 8000);
      pollIntervalRef.current = setTimeout(tick, delay);
    };

    pollIntervalRef.current = setTimeout(tick, delay);

    return () => {
      cancelled = true;
      if (pollIntervalRef.current) {
        clearTimeout(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [
    active,
    expired,
    session.topup_id,
    session.amount_cents,
    onPaid,
    onExpired,
    router,
  ]);

  if (expired) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <p className="text-center text-sm text-muted-foreground">
          This QR code has expired. Start a new top-up to get a fresh code.
        </p>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 w-full shrink-0 touch-manipulation"
          onClick={onClose}
        >
          Close
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain">
        <p className="text-center text-sm text-muted-foreground">
          Scan with GCash, Maya, or your bank app to pay{" "}
          <span className="font-semibold text-pv-ink">
            {formatCurrency(session.amount_cents)}
          </span>
        </p>
        <div className="mx-auto flex max-w-[240px] justify-center rounded-2xl bg-white p-3 shadow-inner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={normalizeQrImageSrc(session.qr_image_url)}
            alt="QR Ph payment code"
            className="h-auto w-full"
          />
        </div>
        <p className="text-center text-xs text-muted-foreground">
          Waiting for payment… Expires in{" "}
          <span className="font-semibold tabular-nums text-pv-ink">
            {formatCountdown(remainingMs)}
          </span>
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        className="min-h-11 w-full shrink-0 touch-manipulation"
        onClick={onClose}
      >
        Cancel
      </Button>
    </div>
  );
}
