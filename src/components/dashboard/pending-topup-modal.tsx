"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  TopUpQrPanel,
  type TopUpQrSession,
} from "@/components/dashboard/topup-qr-panel";
import { TopUpSuccessContent } from "@/components/dashboard/top-up-success-content";
import { useIsMobile } from "@/hooks/use-is-mobile";

type PendingTopupModalProps = {
  topupId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function PendingTopupBody({
  topupId,
  open,
  onOpenChange,
  successAmountCents,
  onSuccess,
}: PendingTopupModalProps & {
  successAmountCents: number | null;
  onSuccess: (amountCents: number) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<TopUpQrSession | null>(null);

  useEffect(() => {
    if (!open) {
      setSession(null);
      setLoading(false);
      return;
    }
    if (!topupId) {
      setSession(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setSession(null);

    (async () => {
      try {
        const res = await fetch(`/api/wallet/topup/${topupId}`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          throw new Error(data.error ?? "Could not load top-up");
        }
        const topup = data.topup as {
          status: string;
          amount_cents: number;
          qr_expires_at: string | null;
          qr_image_url: string | null;
        };
        if (topup.status === "paid") {
          onSuccess(topup.amount_cents);
          setLoading(false);
          return;
        }
        if (topup.status !== "pending" || !topup.qr_image_url) {
          toast.error(
            topup.status === "expired"
              ? "This QR has expired"
              : "This top-up is no longer pending"
          );
          onOpenChange(false);
          return;
        }
        setSession({
          topup_id: topupId,
          qr_image_url: topup.qr_image_url,
          expires_at: topup.qr_expires_at ?? new Date().toISOString(),
          amount_cents: topup.amount_cents,
        });
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Could not load top-up");
          onOpenChange(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, topupId, onOpenChange, onSuccess]);

  if (loading) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Loading QR code…
      </p>
    );
  }

  if (successAmountCents != null) {
    return (
      <TopUpSuccessContent
        amountCents={successAmountCents}
        onClose={() => onOpenChange(false)}
      />
    );
  }

  if (!session) {
    return null;
  }

  return (
    <TopUpQrPanel
      session={session}
      active={open}
      onClose={() => onOpenChange(false)}
      onExpired={() => onOpenChange(false)}
      onPaid={onSuccess}
    />
  );
}

export function PendingTopupModal({
  topupId,
  open,
  onOpenChange,
}: PendingTopupModalProps) {
  const isMobile = useIsMobile();
  const [successAmountCents, setSuccessAmountCents] = useState<number | null>(
    null
  );

  useEffect(() => {
    if (!open) setSuccessAmountCents(null);
  }, [open]);

  const body = (
    <PendingTopupBody
      topupId={topupId}
      open={open}
      onOpenChange={onOpenChange}
      successAmountCents={successAmountCents}
      onSuccess={setSuccessAmountCents}
    />
  );

  const title =
    successAmountCents != null ? "Top-up successful" : "Scan to pay";
  const description =
    successAmountCents != null
      ? "Your payment was received."
      : "Complete payment on your phone to credit your wallet.";

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="flex max-h-[min(92dvh,100%)] flex-col">
          <SheetHeader className="shrink-0 pr-8">
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </SheetHeader>
          {body}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}
