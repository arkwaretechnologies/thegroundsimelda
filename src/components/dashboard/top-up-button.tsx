"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  TopUpQrPanel,
  type TopUpQrSession,
} from "@/components/dashboard/topup-qr-panel";
import { TopUpSuccessContent } from "@/components/dashboard/top-up-success-content";
import { useIsMobile } from "@/hooks/use-is-mobile";

const PRESETS = [500, 1000, 2000, 5000];

type Step = "amount" | "qr" | "success";

function TopUpBody({
  step,
  amount,
  setAmount,
  loading,
  session,
  successAmountCents,
  onConfirmAmount,
  onClose,
  onQrExpired,
  onPaid,
  modalOpen,
}: {
  step: Step;
  amount: string;
  setAmount: (v: string) => void;
  loading: boolean;
  session: TopUpQrSession | null;
  successAmountCents: number | null;
  onConfirmAmount: () => void;
  onClose: () => void;
  onQrExpired: () => void;
  onPaid: (amountCents: number) => void;
  modalOpen: boolean;
}) {
  if (step === "success" && successAmountCents != null) {
    return (
      <TopUpSuccessContent amountCents={successAmountCents} onClose={onClose} />
    );
  }

  if (step === "qr" && session) {
    return (
      <TopUpQrPanel
        session={session}
        active={modalOpen}
        onClose={onClose}
        onExpired={onQrExpired}
        onPaid={onPaid}
      />
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pr-0.5">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <Button
              key={p}
              type="button"
              variant="outline"
              size="sm"
              className="min-h-10 touch-manipulation"
              onClick={() => setAmount(String(p))}
            >
              ₱{p.toLocaleString()}
            </Button>
          ))}
        </div>
        <div className="space-y-2">
          <Label htmlFor="topup-amount">Amount (PHP)</Label>
          <Input
            id="topup-amount"
            type="number"
            inputMode="decimal"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onFocus={(e) => {
              window.setTimeout(() => {
                e.target.scrollIntoView({ block: "center", behavior: "smooth" });
              }, 300);
            }}
            className="min-h-11 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        </div>
      </div>
      <Button
        onClick={onConfirmAmount}
        disabled={loading}
        className="min-h-11 w-full shrink-0 touch-manipulation"
      >
        {loading ? "Generating QR…" : "Continue to QR payment"}
      </Button>
    </div>
  );
}

function useTopUpFlow(open: boolean, onOpenChange: (open: boolean) => void) {
  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState("1000");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<TopUpQrSession | null>(null);
  const [successAmountCents, setSuccessAmountCents] = useState<number | null>(
    null
  );

  const reset = useCallback(() => {
    setStep("amount");
    setSession(null);
    setLoading(false);
    setSuccessAmountCents(null);
  }, []);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  async function confirmAmount() {
    const pesos = Number(amount);
    if (!pesos || pesos < 1) {
      toast.error("Enter at least ₱1");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/wallet/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount_cents: Math.round(pesos * 100) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Top-up failed");
      setSession({
        topup_id: data.topup_id,
        qr_image_url: data.qr_image_url,
        expires_at: data.expires_at,
        amount_cents: Math.round(pesos * 100),
      });
      setStep("qr");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Top-up failed");
    } finally {
      setLoading(false);
    }
  }

  const title =
    step === "success"
      ? "Top-up successful"
      : step === "qr"
        ? "Scan to pay"
        : "Top up wallet";
  const description =
    step === "success"
      ? "Your payment was received."
      : step === "qr"
        ? "Complete payment on your phone to credit your wallet."
        : "Pay via QR Ph (GCash, Maya, banks). Balance updates after payment confirms.";

  const bodyProps = {
    step,
    amount,
    setAmount,
    loading,
    session,
    successAmountCents,
    onConfirmAmount: confirmAmount,
    onClose: () => onOpenChange(false),
    onQrExpired: () => {
      setStep("amount");
      setSession(null);
    },
    onPaid: (amountCents: number) => {
      setSuccessAmountCents(amountCents);
      setStep("success");
    },
    modalOpen: open,
  };

  return { title, description, bodyProps };
}

export function TopUpWalletSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isMobile = useIsMobile();
  const { title, description, bodyProps } = useTopUpFlow(open, onOpenChange);

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="flex max-h-[min(92dvh,100%)] flex-col">
          <SheetHeader className="shrink-0 pr-8">
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </SheetHeader>
          <TopUpBody {...bodyProps} />
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
        <TopUpBody {...bodyProps} />
      </DialogContent>
    </Dialog>
  );
}

export function TopUpButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TopUpWalletSheet open={open} onOpenChange={setOpen} />
      <Button onClick={() => setOpen(true)}>Top up wallet</Button>
    </>
  );
}
