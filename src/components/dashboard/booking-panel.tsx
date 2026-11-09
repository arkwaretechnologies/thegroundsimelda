"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatISO } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { buildExclusiveSlots } from "@/lib/booking/exclusive-slots";
import {
  ExclusiveSlotCalendar,
  type ExclusiveSelection,
} from "@/components/dashboard/exclusive-slot-calendar";
import { TopUpWalletSheet } from "@/components/dashboard/top-up-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { manilaToday } from "@/lib/open-play/sessions";
import { mapBookingErrorMessage } from "@/lib/booking/court-availability";
import {
  findBookingConflict,
  type CourtBookingInterval,
} from "@/lib/booking/exclusive-availability";

const selectMenuClass = "z-[110]";

type Court = {
  id: string;
  name: string;
  status: string;
};

type CourtOccupancy = {
  court_id: string;
  starts_at: string;
  ends_at: string;
};

type AvailabilitySnapshot = {
  occupancy: CourtOccupancy[];
  blocks: CourtOccupancy[];
};

function buildCourtIntervals(
  courtId: string,
  occupancy: CourtOccupancy[],
  blocks: CourtOccupancy[]
): CourtBookingInterval[] {
  const forCourt = (rows: CourtOccupancy[]) =>
    rows
      .filter((b) => b.court_id === courtId)
      .map((b) => ({ starts_at: b.starts_at, ends_at: b.ends_at }));
  return [...forCourt(occupancy), ...forCourt(blocks)];
}

function exclusiveSlotConflict(
  courtId: string,
  selection: ExclusiveSelection,
  occupancy: CourtOccupancy[],
  blocks: CourtOccupancy[]
): boolean {
  if (selection.hasConflict) return true;
  const intervals = buildCourtIntervals(courtId, occupancy, blocks);
  return Boolean(
    findBookingConflict(
      selection.startsAt,
      selection.durationHours,
      intervals
    )
  );
}

function toastExclusiveSlotUnavailable() {
  toast.error(
    "This time is no longer available — your wallet was not charged. Please choose another slot."
  );
}

type OpenPlaySession = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  status: "scheduled" | "open" | "closed";
  max_players: number;
  court_names: string;
  registered_count: number;
  my_registration_status?: string | null;
};

type Booking = {
  id: string;
  starts_at: string;
  ends_at: string;
  type: string;
  fee_cents: number;
  courts: { name: string } | null;
};

type OpenPlayRegistrationItem = {
  id: string;
  status: string;
  fee_cents: number;
  session_title: string;
  starts_at: string;
};

export function BookingPanel({
  exclusiveCourts,
  courtOccupancy,
  courtBlocks = [],
  bookings,
  registrations,
  exclusiveFeeCents,
  openPlayFeeCents,
  exclusiveOpenHour,
  exclusiveCloseHour,
  walletBalanceCents,
}: {
  exclusiveCourts: Court[];
  courtOccupancy: CourtOccupancy[];
  courtBlocks?: CourtOccupancy[];
  bookings: Booking[];
  registrations: OpenPlayRegistrationItem[];
  exclusiveFeeCents: number;
  openPlayFeeCents: number;
  exclusiveOpenHour: number;
  exclusiveCloseHour: number;
  walletBalanceCents: number;
}) {
  const router = useRouter();
  const [type, setType] = useState<"exclusive" | "open_play">("exclusive");
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [sessionFeeCents, setSessionFeeCents] = useState<number | null>(null);
  const [courtId, setCourtId] = useState(() => exclusiveCourts[0]?.id ?? "");
  const [liveOccupancy, setLiveOccupancy] = useState(courtOccupancy);
  const [liveBlocks, setLiveBlocks] = useState(courtBlocks);
  const [exclusiveSelection, setExclusiveSelection] =
    useState<ExclusiveSelection | null>(null);
  const [opDate, setOpDate] = useState(() => manilaToday());
  const [sessions, setSessions] = useState<OpenPlaySession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentDialogKind, setPaymentDialogKind] = useState<
    "exclusive" | "open_play" | null
  >(null);
  const [paymentComplete, setPaymentComplete] = useState(false);
  /** Frozen at “Confirm payment” so refresh/clamp cannot shrink duration before pay. */
  const [lockedExclusive, setLockedExclusive] = useState<{
    courtId: string;
    selection: ExclusiveSelection;
  } | null>(null);

  const slots = useMemo(
    () => buildExclusiveSlots(exclusiveOpenHour, exclusiveCloseHour),
    [exclusiveOpenHour, exclusiveCloseHour]
  );

  useEffect(() => {
    setLiveOccupancy(courtOccupancy);
    setLiveBlocks(courtBlocks);
  }, [courtOccupancy, courtBlocks]);

  const courtBookings = useMemo(() => {
    const forCourt = (rows: CourtOccupancy[]) =>
      rows
        .filter((b) => b.court_id === courtId)
        .map((b) => ({ starts_at: b.starts_at, ends_at: b.ends_at }));
    return [...forCourt(liveOccupancy), ...forCourt(liveBlocks)];
  }, [liveOccupancy, liveBlocks, courtId]);

  const refreshExclusiveAvailability =
    useCallback(async (): Promise<AvailabilitySnapshot | null> => {
      try {
        const res = await fetch("/api/bookings/availability");
        const data = await res.json();
        if (!res.ok) return null;
        const occupancy = Array.isArray(data.court_occupancy)
          ? (data.court_occupancy as CourtOccupancy[])
          : liveOccupancy;
        const blocks = Array.isArray(data.court_blocks)
          ? (data.court_blocks as CourtOccupancy[])
          : liveBlocks;
        setLiveOccupancy(occupancy);
        setLiveBlocks(blocks);
        return { occupancy, blocks };
      } catch {
        return null;
      }
    }, [liveBlocks, liveOccupancy]);

  useEffect(() => {
    setCourtId(exclusiveCourts[0]?.id ?? "");
  }, [exclusiveCourts]);

  useEffect(() => {
    if (type !== "open_play") return;

    let cancelled = false;
    setSessionsLoading(true);
    setSessionId("");
    fetch(`/api/open-play/sessions?date=${encodeURIComponent(opDate)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Could not load sessions");
        return data.sessions as OpenPlaySession[];
      })
      .then((rows) => {
        if (cancelled) return;
        setSessions(rows);
        setSessionId(rows[0]?.id ?? "");
      })
      .catch((err) => {
        if (cancelled) return;
        setSessions([]);
        setSessionId("");
        toast.error(
          err instanceof Error ? err.message : "Could not load sessions"
        );
      })
      .finally(() => {
        if (!cancelled) setSessionsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [type, opDate]);

  useEffect(() => {
    if (!sessionId || type !== "open_play") {
      setSessionFeeCents(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/open-play/register?session_id=${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && typeof data.fee_cents === "number") {
          setSessionFeeCents(data.fee_cents);
        }
      })
      .catch(() => {
        if (!cancelled) setSessionFeeCents(null);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId, type]);

  const handleExclusiveSelection = useCallback(
    (selection: ExclusiveSelection | null) => {
      setExclusiveSelection(selection);
    },
    []
  );

  const selectedSession = useMemo(
    () => sessions.find((s) => s.id === sessionId) ?? null,
    [sessions, sessionId]
  );

  function handleTypeChange(next: "exclusive" | "open_play") {
    setType(next);
    setCourtId(exclusiveCourts[0]?.id ?? "");
    setExclusiveSelection(null);
    setSessionId("");
  }

  function closePaymentDialog() {
    if (loading) return;
    setPaymentDialogOpen(false);
    setPaymentDialogKind(null);
    setPaymentComplete(false);
    setLockedExclusive(null);
  }

  function snapshotExclusiveSelection(
    selection: ExclusiveSelection
  ): ExclusiveSelection {
    return {
      ...selection,
      startsAt: new Date(selection.startsAt),
      endsAt: new Date(selection.endsAt),
    };
  }

  async function openPaymentDialog(kind: "exclusive" | "open_play") {
    if (kind === "exclusive") {
      const snap = await refreshExclusiveAvailability();
      const occupancy = snap?.occupancy ?? liveOccupancy;
      const blocks = snap?.blocks ?? liveBlocks;
      if (!courtId || !exclusiveSelection) {
        toast.error("Select a valid court, date, and time");
        return;
      }
      if (
        exclusiveSlotConflict(courtId, exclusiveSelection, occupancy, blocks)
      ) {
        toastExclusiveSlotUnavailable();
        return;
      }
      setLockedExclusive({
        courtId,
        selection: snapshotExclusiveSelection(exclusiveSelection),
      });
    } else {
      setLockedExclusive(null);
      if (!sessionId) {
        toast.error("Select an open play schedule");
        return;
      }
      if (selectedSession?.my_registration_status) {
        toast.error("You are already registered for this session");
        return;
      }
      if (needsTopUp) {
        setTopUpOpen(true);
        return;
      }
    }
    setPaymentDialogKind(kind);
    setPaymentComplete(false);
    setPaymentDialogOpen(true);
  }

  async function bookExclusive(locked: {
    courtId: string;
    selection: ExclusiveSelection;
  }): Promise<boolean> {
    const { courtId: payCourtId, selection } = locked;
    if (!payCourtId || selection.hasConflict) {
      return false;
    }
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        court_id: payCourtId,
        starts_at: formatISO(selection.startsAt),
        ends_at: formatISO(selection.endsAt),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(
        mapBookingErrorMessage(
          typeof data.error === "string" ? data.error : "Booking failed"
        )
      );
    }
    return true;
  }

  async function registerOpenPlay(): Promise<boolean> {
    if (!sessionId) return false;
    const res = await fetch("/api/open-play/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId }),
    });
    const data = (await res.json()) as {
      error?: string;
      code?: string;
      fee_cents?: number;
    };
    if (res.status === 402 || data.code === "insufficient_balance") {
      const fee = data.fee_cents ?? sessionFeeCents ?? openPlayFeeCents;
      toast.error(
        `Top up your wallet to register — ${formatCurrency(fee)} required`
      );
      setPaymentDialogOpen(false);
      setTopUpOpen(true);
      return false;
    }
    if (!res.ok) throw new Error(data.error ?? "Registration failed");
    return true;
  }

  async function confirmPaymentFromDialog() {
    if (!paymentDialogKind || loading) return;
    setLoading(true);
    try {
      let ok = false;
      if (paymentDialogKind === "exclusive") {
        if (!lockedExclusive) {
          toast.error("Select a court and time again");
          return;
        }
        const snap = await refreshExclusiveAvailability();
        const occupancy = snap?.occupancy ?? liveOccupancy;
        const blocks = snap?.blocks ?? liveBlocks;
        if (
          exclusiveSlotConflict(
            lockedExclusive.courtId,
            lockedExclusive.selection,
            occupancy,
            blocks
          )
        ) {
          toastExclusiveSlotUnavailable();
          setPaymentDialogOpen(false);
          setPaymentDialogKind(null);
          setPaymentComplete(false);
          setLockedExclusive(null);
          return;
        }
        ok = await bookExclusive(lockedExclusive);
      } else {
        ok = await registerOpenPlay();
      }
      if (ok) {
        setPaymentComplete(true);
        if (paymentDialogKind === "open_play") {
          // Refresh day’s sessions so registration badge updates
          const res = await fetch(
            `/api/open-play/sessions?date=${encodeURIComponent(opDate)}`
          );
          const data = await res.json();
          if (res.ok && Array.isArray(data.sessions)) {
            setSessions(data.sessions);
          }
        }
        router.refresh();
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : paymentDialogKind === "exclusive"
            ? "Booking failed"
            : "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  }

  const canBookExclusive =
    Boolean(courtId) &&
    exclusiveSelection !== null &&
    !exclusiveSelection.hasConflict;

  const activityEmpty = bookings.length === 0 && registrations.length === 0;

  const registerFeeCents = sessionFeeCents ?? openPlayFeeCents;
  const needsTopUp =
    registerFeeCents > 0 && walletBalanceCents < registerFeeCents;

  const selectedCourt = exclusiveCourts.find((c) => c.id === courtId);
  const dialogExclusive =
    paymentDialogKind === "exclusive" && lockedExclusive
      ? lockedExclusive.selection
      : exclusiveSelection;
  const exclusiveTotalCents = dialogExclusive
    ? dialogExclusive.durationHours * exclusiveFeeCents
    : 0;
  const dialogFeeCents =
    paymentDialogKind === "exclusive"
      ? exclusiveTotalCents
      : registerFeeCents;
  const dialogBalanceAfterCents = Math.max(
    0,
    walletBalanceCents - dialogFeeCents
  );

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <TopUpWalletSheet open={topUpOpen} onOpenChange={setTopUpOpen} />
      <Dialog
        open={paymentDialogOpen}
        onOpenChange={(open) => {
          if (!open) closePaymentDialog();
          else setPaymentDialogOpen(true);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {paymentComplete ? "Payment complete" : "Confirm payment"}
            </DialogTitle>
            <DialogDescription>
              {paymentComplete
                ? paymentDialogKind === "exclusive"
                  ? "Your exclusive court booking is confirmed and paid from your wallet."
                  : "You are registered for open play. Staff will check you in when you arrive."
                : paymentDialogKind === "exclusive"
                  ? "Review your booking before paying from your wallet."
                  : "Review your open play registration before paying from your wallet."}
            </DialogDescription>
          </DialogHeader>

          {paymentDialogKind === "exclusive" && dialogExclusive ? (
            <ul className="space-y-1.5 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm">
              <li className="flex justify-between gap-3">
                <span className="text-muted-foreground">Court</span>
                <span className="text-right font-medium text-pv-ink">
                  {(lockedExclusive
                    ? exclusiveCourts.find((c) => c.id === lockedExclusive.courtId)
                    : selectedCourt
                  )?.name ?? "Court"}
                </span>
              </li>
              <li className="flex justify-between gap-3">
                <span className="text-muted-foreground">When</span>
                <span className="text-right font-medium text-pv-ink">
                  {formatDate(dialogExclusive.startsAt)} –{" "}
                  {formatDate(dialogExclusive.endsAt)}
                </span>
              </li>
              <li className="flex justify-between gap-3">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium text-pv-ink">
                  {dialogExclusive.durationHours}{" "}
                  {dialogExclusive.durationHours === 1 ? "hour" : "hours"}
                </span>
              </li>
            </ul>
          ) : null}

          {paymentDialogKind === "open_play" && selectedSession ? (
            <ul className="space-y-1.5 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm">
              <li className="flex justify-between gap-3">
                <span className="text-muted-foreground">Session</span>
                <span className="text-right font-medium text-pv-ink">
                  {selectedSession.title}
                </span>
              </li>
              <li className="flex justify-between gap-3">
                <span className="text-muted-foreground">Courts</span>
                <span className="text-right font-medium text-pv-ink">
                  {selectedSession.court_names}
                </span>
              </li>
              <li className="flex justify-between gap-3">
                <span className="text-muted-foreground">When</span>
                <span className="text-right font-medium text-pv-ink">
                  {formatDate(selectedSession.starts_at)} –{" "}
                  {formatDate(selectedSession.ends_at)}
                </span>
              </li>
            </ul>
          ) : null}

          <div className="rounded-2xl border border-border/60 bg-primary/5 px-4 py-3 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">
                {paymentComplete ? "Amount paid" : "Amount due"}
              </span>
              <span className="font-display font-semibold text-primary">
                {formatCurrency(dialogFeeCents)}
              </span>
            </div>
            <div className="mt-2 flex justify-between gap-3">
              <span className="text-muted-foreground">
                {paymentComplete ? "New wallet balance" : "Wallet after payment"}
              </span>
              <span className="font-medium text-pv-ink">
                {formatCurrency(dialogBalanceAfterCents)}
              </span>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {paymentComplete ? (
              <Button
                className="min-h-11 touch-manipulation sm:min-w-28"
                onClick={closePaymentDialog}
              >
                Done
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 touch-manipulation"
                  disabled={loading}
                  onClick={closePaymentDialog}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="min-h-11 touch-manipulation"
                  disabled={loading}
                  onClick={() => void confirmPaymentFromDialog()}
                >
                  {loading
                    ? "Processing…"
                    : `Pay ${formatCurrency(dialogFeeCents)} from wallet`}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <div className="glass space-y-4 rounded-2xl p-4">
        <h2 className="text-sm font-semibold text-pv-ink">New booking</h2>

        <div className="space-y-2">
          <Label htmlFor="booking-type">Booking type</Label>
          <Select
            value={type}
            onValueChange={(v) =>
              handleTypeChange(v as "exclusive" | "open_play")
            }
          >
            <SelectTrigger id="booking-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={selectMenuClass}>
              <SelectItem value="exclusive">Exclusive</SelectItem>
              <SelectItem value="open_play">Open Play</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="border-t border-border/60 pt-4">
          {type === "exclusive" ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {formatCurrency(exclusiveFeeCents)} per hour · pick date, start
                time, and duration below
              </p>
              <div className="space-y-2">
                <Label>Court</Label>
                {exclusiveCourts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No available exclusive courts right now. Try again later, or
                    ask staff if courts need to be marked exclusive in Admin.
                  </p>
                ) : (
                  <Select
                    value={courtId}
                    onValueChange={(id) => {
                      setCourtId(id);
                      setExclusiveSelection(null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select available court" />
                    </SelectTrigger>
                    <SelectContent className={selectMenuClass}>
                      {exclusiveCourts.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <Label>Date & time</Label>
                <ExclusiveSlotCalendar
                  slots={slots}
                  courtBookings={courtBookings}
                  exclusiveFeeCents={exclusiveFeeCents}
                  closeHour={exclusiveCloseHour}
                  onSelectionChange={handleExclusiveSelection}
                />
              </div>
              <Button
                onClick={() => void openPaymentDialog("exclusive")}
                disabled={loading || !canBookExclusive}
                className="min-h-11 w-full touch-manipulation"
              >
                Confirm & pay from wallet
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Pick a date to see Open Play sessions across courts. Pay from
                wallet now; staff check you in when you arrive.
              </p>
              <div className="space-y-2">
                <Label htmlFor="op-date">Date</Label>
                <Input
                  id="op-date"
                  type="date"
                  value={opDate}
                  onChange={(e) => setOpDate(e.target.value)}
                />
              </div>
              {sessionId && sessionFeeCents !== null ? (
                <p className="text-sm text-muted-foreground">
                  Your fee for this session:{" "}
                  <span className="font-medium text-pv-ink">
                    {formatCurrency(sessionFeeCents)}
                  </span>
                  {" · "}
                  Wallet: {formatCurrency(walletBalanceCents)}
                </p>
              ) : null}
              <div className="space-y-2">
                <Label>Sessions</Label>
                {sessionsLoading ? (
                  <p className="text-sm text-muted-foreground">
                    Loading sessions…
                  </p>
                ) : sessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No open play schedules created for this date. Pick another
                    day, or ask staff to create a schedule in Admin.
                  </p>
                ) : (
                  <ul className="flex max-h-64 flex-wrap gap-2 overflow-y-auto overscroll-contain">
                    {sessions.map((s) => {
                      const full = s.registered_count >= s.max_players;
                      const registered = Boolean(s.my_registration_status);
                      const selected = sessionId === s.id;
                      return (
                        <li key={s.id} className="w-full sm:w-[calc(50%-0.25rem)]">
                          <button
                            type="button"
                            className={`w-full touch-manipulation rounded-2xl border px-3 py-3 text-left text-sm transition ${
                              selected
                                ? "border-[rgba(243,210,122,0.6)] bg-[rgba(212,168,69,0.12)]"
                                : "border-border bg-black/25 hover:border-[rgba(212,168,69,0.4)] hover:bg-[rgba(212,168,69,0.06)]"
                            }`}
                            onClick={() => setSessionId(s.id)}
                          >
                            <p className="font-medium">{s.title}</p>
                            <p className="text-muted-foreground">
                              {formatDate(s.starts_at)} – {formatDate(s.ends_at)}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {s.court_names} · {s.registered_count}/
                              {s.max_players} ·{" "}
                              <span className="capitalize">{s.status}</span>
                            </p>
                          </button>
                          {selected ? (
                            <div className="mt-2 space-y-2">
                              {registered ? (
                                <Badge
                                  variant="success"
                                  className="capitalize"
                                >
                                  {s.my_registration_status?.replace("_", " ")}
                                </Badge>
                              ) : null}
                              {!registered && !full ? (
                                needsTopUp ? (
                                  <Button
                                    className="min-h-11 w-full touch-manipulation"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setTopUpOpen(true)}
                                  >
                                    Top up wallet to register
                                  </Button>
                                ) : (
                                  <Button
                                    className="min-h-11 w-full touch-manipulation"
                                    size="sm"
                                    disabled={loading}
                                    onClick={() =>
                                      openPaymentDialog("open_play")
                                    }
                                  >
                                    Register & pay from wallet
                                  </Button>
                                )
                              ) : null}
                              {full && !registered ? (
                                <p className="text-xs text-muted-foreground">
                                  Session full
                                </p>
                              ) : null}
                            </div>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="glass rounded-2xl p-4">
        <h2 className="text-sm font-semibold text-pv-ink">Your activity</h2>
        <ul className="mt-4 space-y-3">
          {activityEmpty && (
            <li className="text-sm text-muted-foreground">No bookings yet.</li>
          )}
          {bookings.map((b) => (
            <li
              key={`b-${b.id}`}
              className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm"
            >
              <div>
                <p className="font-medium">{b.courts?.name ?? "Court"}</p>
                <p className="text-muted-foreground">
                  {formatDate(b.starts_at)} · Exclusive
                </p>
              </div>
              <Badge variant="outline">{formatCurrency(b.fee_cents)}</Badge>
            </li>
          ))}
          {registrations.map((r) => (
            <li
              key={`r-${r.id}`}
              className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm"
            >
              <div>
                <p className="font-medium">{r.session_title}</p>
                <p className="text-muted-foreground">
                  {formatDate(r.starts_at)} · Open play
                </p>
              </div>
              <Badge variant="outline" className="capitalize">
                {r.status.replace("_", " ")}
              </Badge>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
