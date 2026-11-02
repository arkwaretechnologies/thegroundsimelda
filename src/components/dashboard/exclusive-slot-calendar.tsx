"use client";

import { useEffect, useMemo, useState } from "react";
import { addHours } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import {
  type ExclusiveSlot,
  groupExclusiveSlotsByDate,
  formatSlotTime,
} from "@/lib/booking/exclusive-slots";
import {
  type CourtBookingInterval,
  findBookingConflict,
  isStartHourBooked,
  maxDurationForStart,
} from "@/lib/booking/exclusive-availability";

const MANILA = "Asia/Manila";
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const selectMenuClass = "z-[110]";

export type ExclusiveSelection = {
  startsAt: Date;
  endsAt: Date;
  durationHours: number;
  hasConflict: boolean;
};

function manilaParts(date: Date) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: MANILA,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  const parts = fmt.formatToParts(date);
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  return { year: get("year"), month: get("month"), day: get("day") };
}

function monthLabel(year: number, month: number) {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleString("en-PH", {
    timeZone: MANILA,
    month: "long",
    year: "numeric",
  });
}

function buildMonthGrid(year: number, month: number) {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const startPad = first.getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function formatSelectedDate(dateKey: string) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString("en-PH", {
    timeZone: MANILA,
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export function ExclusiveSlotCalendar({
  slots,
  courtBookings,
  exclusiveFeeCents,
  closeHour,
  onSelectionChange,
}: {
  slots: ExclusiveSlot[];
  courtBookings: CourtBookingInterval[];
  exclusiveFeeCents: number;
  closeHour: number;
  onSelectionChange: (selection: ExclusiveSelection | null) => void;
}) {
  const byDate = useMemo(() => groupExclusiveSlotsByDate(slots), [slots]);
  const dateKeys = useMemo(() => [...byDate.keys()].sort(), [byDate]);

  const firstSlot = slots[0];
  const initialMonth = firstSlot
    ? manilaParts(firstSlot.startsAt)
    : manilaParts(new Date());

  const [viewYear, setViewYear] = useState(initialMonth.year);
  const [viewMonth, setViewMonth] = useState(initialMonth.month);
  const [selectedDateKey, setSelectedDateKey] = useState(dateKeys[0] ?? "");
  const [startSlotId, setStartSlotId] = useState("");
  const [durationHours, setDurationHours] = useState(1);

  const daySlots = useMemo(
    () => byDate.get(selectedDateKey) ?? [],
    [byDate, selectedDateKey]
  );

  const availableStarts = useMemo(
    () => daySlots.filter((s) => !isStartHourBooked(courtBookings, s.startsAt)),
    [daySlots, courtBookings]
  );

  const selectedStartSlot = useMemo(
    () => daySlots.find((s) => s.id === startSlotId) ?? null,
    [daySlots, startSlotId]
  );

  const maxDuration = selectedStartSlot
    ? maxDurationForStart(selectedStartSlot.startsAt, courtBookings, closeHour)
    : 0;

  const conflict = useMemo(() => {
    if (!selectedStartSlot || durationHours < 1) return null;
    return findBookingConflict(
      selectedStartSlot.startsAt,
      durationHours,
      courtBookings
    );
  }, [selectedStartSlot, durationHours, courtBookings]);

  useEffect(() => {
    if (dateKeys.length === 0) {
      setSelectedDateKey("");
      return;
    }
    if (!dateKeys.includes(selectedDateKey)) {
      setSelectedDateKey(dateKeys[0]);
    }
  }, [dateKeys, selectedDateKey]);

  useEffect(() => {
    const firstAvailable = daySlots.find(
      (s) => !isStartHourBooked(courtBookings, s.startsAt)
    );
    setStartSlotId(firstAvailable?.id ?? daySlots[0]?.id ?? "");
    setDurationHours(1);
  }, [selectedDateKey, courtBookings, daySlots]);

  useEffect(() => {
    if (durationHours > maxDuration && maxDuration > 0) {
      setDurationHours(maxDuration);
    }
  }, [maxDuration, durationHours]);

  useEffect(() => {
    if (!selectedStartSlot || maxDuration < 1) {
      onSelectionChange(null);
      return;
    }
    const hasConflict = Boolean(
      findBookingConflict(
        selectedStartSlot.startsAt,
        durationHours,
        courtBookings
      )
    );
    if (hasConflict || durationHours > maxDuration) {
      onSelectionChange({
        startsAt: selectedStartSlot.startsAt,
        endsAt: addHours(selectedStartSlot.startsAt, durationHours),
        durationHours,
        hasConflict: true,
      });
      return;
    }
    onSelectionChange({
      startsAt: selectedStartSlot.startsAt,
      endsAt: addHours(selectedStartSlot.startsAt, durationHours),
      durationHours,
      hasConflict: false,
    });
  }, [
    selectedStartSlot,
    durationHours,
    maxDuration,
    courtBookings,
    onSelectionChange,
  ]);

  const monthCells = useMemo(
    () => buildMonthGrid(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  function shiftMonth(delta: number) {
    const d = new Date(Date.UTC(viewYear, viewMonth - 1 + delta, 1));
    setViewYear(d.getUTCFullYear());
    setViewMonth(d.getUTCMonth() + 1);
  }

  function dateKeyForDay(day: number) {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${viewYear}-${pad(viewMonth)}-${pad(day)}`;
  }

  if (slots.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No slots available in booking hours.
      </p>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-border/60 bg-white/40 p-3">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => shiftMonth(-1)}
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <p className="text-sm font-semibold text-pv-ink">
          {monthLabel(viewYear, viewMonth)}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => shiftMonth(1)}
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-muted-foreground">
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {monthCells.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="aspect-square" />;
          }
          const key = dateKeyForDay(day);
          const hasSlots = byDate.has(key);
          const selected = key === selectedDateKey;
          return (
            <button
              key={key}
              type="button"
              disabled={!hasSlots}
              onClick={() => setSelectedDateKey(key)}
              className={cn(
                "aspect-square rounded-xl text-sm font-medium transition touch-manipulation",
                !hasSlots && "cursor-not-allowed text-muted-foreground/40",
                hasSlots &&
                  !selected &&
                  "bg-white/70 text-pv-ink hover:bg-primary/10",
                selected &&
                  "bg-primary text-primary-foreground shadow-md shadow-primary/20"
              )}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="space-y-3 border-t border-border/60 pt-3">
        <p className="text-xs font-medium text-muted-foreground">
          {selectedDateKey ? formatSelectedDate(selectedDateKey) : "Pick a date"}
        </p>

        {daySlots.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No times on this day. Choose a highlighted date.
          </p>
        ) : (
          <>
            <div className="space-y-2">
              <Label>Start time</Label>
              <Select value={startSlotId} onValueChange={setStartSlotId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select start time" />
                </SelectTrigger>
                <SelectContent className={selectMenuClass}>
                  {daySlots.map((slot) => {
                    const booked = isStartHourBooked(
                      courtBookings,
                      slot.startsAt
                    );
                    return (
                      <SelectItem
                        key={slot.id}
                        value={slot.id}
                        disabled={booked}
                      >
                        {formatSlotTime(slot.startsAt)}
                        {booked ? " (Booked)" : ""}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Duration</Label>
              <Select
                value={String(durationHours)}
                onValueChange={(v) => setDurationHours(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Hours" />
                </SelectTrigger>
                <SelectContent className={selectMenuClass}>
                  {Array.from({ length: 6 }, (_, i) => i + 1).map((h) => {
                    const disabled =
                      !selectedStartSlot ||
                      h > maxDuration ||
                      Boolean(
                        selectedStartSlot &&
                          findBookingConflict(
                            selectedStartSlot.startsAt,
                            h,
                            courtBookings
                          )
                      );
                    return (
                      <SelectItem key={h} value={String(h)} disabled={disabled}>
                        {h} {h === 1 ? "hour" : "hours"}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {selectedStartSlot && maxDuration > 0 ? (
              <p className="text-sm text-muted-foreground">
                {durationHours} {durationHours === 1 ? "hour" : "hours"} ·{" "}
                {formatCurrency(exclusiveFeeCents * durationHours)} total (
                {formatCurrency(exclusiveFeeCents)}/hr)
              </p>
            ) : null}

            {availableStarts.length === 0 && daySlots.length > 0 ? (
              <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
                All start times are booked on this day. Try another date or
                court.
              </p>
            ) : null}

            {conflict && selectedStartSlot ? (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
                Can&apos;t book {durationHours}{" "}
                {durationHours === 1 ? "hour" : "hours"} from{" "}
                {formatSlotTime(selectedStartSlot.startsAt)} — this court is
                already booked at {conflict.label}.
              </p>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
