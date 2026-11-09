"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { cn } from "@/lib/utils";
import { manilaDateKey } from "@/lib/booking/exclusive-slots";
import type { HourSlotStatus } from "@/lib/booking/court-availability";

const MANILA = "Asia/Manila";

type Court = { id: string; name: string };

type GridResponse = {
  date: string;
  courts: Court[];
  hours: number[];
  cells: Record<string, Record<number, HourSlotStatus>>;
  blocks: {
    id: string;
    court_id: string;
    starts_at: string;
    ends_at: string;
    reason: string | null;
  }[];
  open_hour: number;
  close_hour: number;
};

function fmtHour(h: number) {
  const d = new Date(`1970-01-01T${String(h).padStart(2, "0")}:00:00+08:00`);
  return d.toLocaleTimeString("en-PH", {
    timeZone: MANILA,
    hour: "numeric",
    minute: "2-digit",
  });
}

function cellKey(courtId: string, hour: number) {
  return `${courtId}:${hour}`;
}

export function StaffReservationsPanel({
  initialOpenHour,
  initialCloseHour,
}: {
  initialOpenHour: number;
  initialCloseHour: number;
}) {
  const [date, setDate] = useState(() => manilaDateKey(new Date()));
  const [openHour, setOpenHour] = useState(initialOpenHour);
  const [closeHour, setCloseHour] = useState(initialCloseHour);
  const [grid, setGrid] = useState<GridResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCourtId, setSelectedCourtId] = useState("");
  const [selectedHours, setSelectedHours] = useState<Set<string>>(new Set());
  const [walkInLabel, setWalkInLabel] = useState("");
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/staff/reservations?date=${encodeURIComponent(date)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not load grid");
      setGrid(data);
      setOpenHour(data.open_hour);
      setCloseHour(data.close_hour);
      if (!selectedCourtId && data.courts?.[0]?.id) {
        setSelectedCourtId(data.courts[0].id);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load grid");
    } finally {
      setLoading(false);
    }
  }, [date, selectedCourtId]);

  useEffect(() => {
    void load();
  }, [load]);

  const activeCourtId = selectedCourtId || grid?.courts[0]?.id || "";

  const toggleHour = (courtId: string, hour: number) => {
    const key = cellKey(courtId, hour);
    setSelectedHours((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectionForCourt = useMemo(() => {
    const hours: number[] = [];
    for (const key of selectedHours) {
      const [cid, h] = key.split(":");
      if (cid === activeCourtId) hours.push(Number(h));
    }
    return hours.sort((a, b) => a - b);
  }, [selectedHours, activeCourtId]);

  async function saveHours() {
    const { error: msg, ok } = await postBlocks({
      action: "close_hours",
      court_id: activeCourtId,
      date,
      hours: selectionForCourt,
      reason: reason.trim() || undefined,
    });
    if (!ok) toast.error(msg);
    else {
      toast.success("Hours closed");
      setSelectedHours(new Set());
      void load();
    }
  }

  async function closeDay() {
    const { error: msg, ok } = await postBlocks({
      action: "close_day",
      court_id: activeCourtId,
      date,
      reason: reason.trim() || undefined,
    });
    if (!ok) toast.error(msg);
    else {
      toast.success("Day closed for this court");
      void load();
    }
  }

  async function clearSelection() {
    if (!grid?.blocks?.length || selectionForCourt.length === 0) {
      setSelectedHours(new Set());
      return;
    }
    const toDelete = grid.blocks
      .filter((b) => {
        if (b.court_id !== activeCourtId) return false;
        const start = new Date(b.starts_at);
        const h = Number(
          start.toLocaleString("en-GB", {
            timeZone: MANILA,
            hour: "numeric",
            hour12: false,
          })
        );
        return selectionForCourt.includes(h);
      })
      .map((b) => b.id);

    if (toDelete.length === 0) {
      toast.message("No closures to remove for selected hours");
      setSelectedHours(new Set());
      return;
    }

    const { error: msg, ok } = await postBlocks({
      action: "delete",
      block_ids: toDelete,
    });
    if (!ok) toast.error(msg);
    else {
      toast.success("Closures removed");
      setSelectedHours(new Set());
      void load();
    }
  }

  async function walkInReserve() {
    if (!activeCourtId || selectionForCourt.length !== 1) {
      toast.error("Select exactly one open hour for a walk-in");
      return;
    }
    const hour = selectionForCourt[0];
    const starts_at = new Date(
      `${date}T${String(hour).padStart(2, "0")}:00:00+08:00`
    ).toISOString();
    const ends_at = new Date(
      new Date(starts_at).getTime() + 3600000
    ).toISOString();

    const res = await fetch("/api/staff/walk-in-booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        court_id: activeCourtId,
        starts_at,
        ends_at,
        walk_in_label: walkInLabel.trim() || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Walk-in failed");
      return;
    }
    toast.success("Walk-in reservation saved");
    setWalkInLabel("");
    setSelectedHours(new Set());
    void load();
  }

  async function saveBranchHours() {
    const res = await fetch("/api/staff/exclusive-hours", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ open_hour: openHour, close_hour: closeHour }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Could not save hours");
      return;
    }
    toast.success("Operating hours updated");
    void load();
  }

  const courts = grid?.courts ?? [];
  const hours = grid?.hours ?? [];

  return (
    <div className="glass space-y-6 rounded-2xl p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="space-y-2">
          <Label htmlFor="res-date">Date</Label>
          <Input
            id="res-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Court</Label>
          <Select value={activeCourtId} onValueChange={setSelectedCourtId}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Court" />
            </SelectTrigger>
            <SelectContent>
              {courts.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <BranchHoursRow
          openHour={openHour}
          closeHour={closeHour}
          onOpen={setOpenHour}
          onClose={setCloseHour}
          onSave={saveBranchHours}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!selectionForCourt.length || loading}
          onClick={() => void saveHours()}
        >
          Close selected hours
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!activeCourtId || loading}
          onClick={() => void closeDay()}
        >
          Close whole day
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={loading}
          onClick={() => void clearSelection()}
        >
          Reopen selected
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={loading}
          onClick={() => void walkInReserve()}
        >
          Walk-in reserve (1 hr)
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="closure-reason">Closure note (optional)</Label>
          <Input
            id="closure-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Tournament"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="walk-in-label">Walk-in guest name</Label>
          <Input
            id="walk-in-label"
            value={walkInLabel}
            onChange={(e) => setWalkInLabel(e.target.value)}
            placeholder="Guest name"
          />
        </div>
      </div>

      {loading && !grid ? (
        <p className="text-sm text-muted-foreground">Loading schedule…</p>
      ) : courts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No exclusive courts found. Ensure courts are marked exclusive and the
          latest migration is applied.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] border-collapse text-sm">
            <thead>
              <tr>
                <th className="p-2 text-left font-medium text-muted-foreground">
                  Court
                </th>
                {hours.map((h) => (
                  <th
                    key={h}
                    className="p-1 text-center text-[0.65rem] font-medium text-muted-foreground"
                  >
                    {fmtHour(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {courts.map((court) => (
                <tr key={court.id} className="border-t border-border/40">
                  <td className="whitespace-nowrap p-2 font-medium">{court.name}</td>
                  {hours.map((h) => {
                    const status =
                      grid?.cells[court.id]?.[h] ?? ("available" as const);
                    const picked = selectedHours.has(cellKey(court.id, h));
                    return (
                      <td key={h} className="p-0.5">
                        <button
                          type="button"
                          onClick={() => toggleHour(court.id, h)}
                          className={cn(
                            "h-10 w-full rounded-md border text-[0.6rem] font-semibold uppercase tracking-wide transition",
                            status === "available" &&
                              "border-[rgba(212,168,69,0.25)] bg-black/20 text-white/80",
                            status === "booked" &&
                              "cursor-pointer border-white/10 bg-white/5 text-white/40",
                            status === "closed" &&
                              "border-red-400/30 bg-red-950/40 text-red-200/80",
                            picked &&
                              "ring-2 ring-[var(--tg-gold-light)] ring-offset-1 ring-offset-transparent"
                          )}
                        >
                          {picked ? "·" : status === "available" ? "Open" : status}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Closed hours block online booking. Walk-in reserves show as booked on the
        member app. First completed payment or walk-in wins if two people try the
        same slot.
      </p>
    </div>
  );
}

function BranchHoursRow({
  openHour,
  closeHour,
  onOpen,
  onClose,
  onSave,
}: {
  openHour: number;
  closeHour: number;
  onOpen: (n: number) => void;
  onClose: (n: number) => void;
  onSave: () => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="space-y-2">
        <Label htmlFor="open-h">Open hour</Label>
        <Input
          id="open-h"
          type="number"
          min={0}
          max={23}
          className="w-20"
          value={openHour}
          onChange={(e) => onOpen(Number(e.target.value))}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="close-h">Close hour</Label>
        <Input
          id="close-h"
          type="number"
          min={1}
          max={24}
          className="w-20"
          value={closeHour}
          onChange={(e) => onClose(Number(e.target.value))}
        />
      </div>
      <Button type="button" size="sm" variant="secondary" onClick={onSave}>
        Save hours
      </Button>
    </div>
  );
}

async function postBlocks(
  body:
    | {
        action: "close_hours";
        court_id: string;
        date: string;
        hours: number[];
        reason?: string;
      }
    | { action: "close_day"; court_id: string; date: string; reason?: string }
    | { action: "delete"; block_ids: string[] }
): Promise<{ ok: boolean; error: string }> {
  const res = await fetch("/api/staff/court-blocks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    return { ok: false, error: data.error ?? "Request failed" };
  }
  return { ok: true, error: "" };
}
