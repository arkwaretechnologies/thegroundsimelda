"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Moon,
  Sun,
  Sunrise,
  Users,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { useMemberGate } from "@/components/marketing/auth-modal";
import type { PublicSchedule } from "@/lib/marketing/public-schedule";
import { buildHourAggregates } from "@/lib/booking/court-availability";
import { BOOKING_DAYS_AHEAD } from "@/lib/booking/exclusive-slots";
import { Button } from "@/components/ui/button";

const MANILA = "Asia/Manila";

type Mode = "court" | "openplay";

function manilaKey(d: Date) {
  return d.toLocaleDateString("en-CA", { timeZone: MANILA });
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString("en-PH", {
    timeZone: MANILA,
    hour: "numeric",
    minute: "2-digit",
  });
}

const PERIODS = [
  { label: "Morning", icon: Sunrise, from: 0, to: 12 },
  { label: "Afternoon", icon: Sun, from: 12, to: 17 },
  { label: "Evening", icon: Moon, from: 17, to: 24 },
] as const;

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

function monthTitle(year: number, month: number) {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleString("en-PH", {
    timeZone: MANILA,
    month: "long",
    year: "numeric",
  });
}

function dateKey(year: number, month: number, day: number) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${year}-${pad(month)}-${pad(day)}`;
}

function maxBookableKey(from: Date) {
  const end = new Date(from.getTime() + BOOKING_DAYS_AHEAD * 86400000);
  return manilaKey(end);
}

function bookableDaysForMonth(
  viewYear: number,
  viewMonth: number,
  todayKey: string,
  lastKey: string
) {
  const daysInMonth = new Date(Date.UTC(viewYear, viewMonth, 0)).getUTCDate();
  const out: {
    key: string;
    weekday: string;
    date: string;
    month: string;
    isToday: boolean;
  }[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const key = dateKey(viewYear, viewMonth, d);
    if (key < todayKey || key > lastKey) continue;
    const noon = new Date(Date.UTC(viewYear, viewMonth - 1, d, 12));
    out.push({
      key,
      isToday: key === todayKey,
      weekday:
        key === todayKey
          ? "Today"
          : noon.toLocaleDateString("en-PH", {
              timeZone: MANILA,
              weekday: "short",
            }),
      date: noon.toLocaleDateString("en-PH", {
        timeZone: MANILA,
        day: "numeric",
      }),
      month: noon.toLocaleDateString("en-PH", {
        timeZone: MANILA,
        month: "short",
      }),
    });
  }
  return out;
}

export function ScheduleBoard({ schedule }: { schedule: PublicSchedule }) {
  const { go, checking } = useMemberGate();
  const [mode, setMode] = useState<Mode>("openplay");
  // "now" is only known on the client — avoids SSR/CSR mismatch.
  const [now, setNow] = useState<Date | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [viewYear, setViewYear] = useState<number | null>(null);
  const [viewMonth, setViewMonth] = useState<number | null>(null);

  useEffect(() => {
    const n = new Date();
    const { year, month } = manilaParts(n);
    setNow(n);
    setDay(manilaKey(n));
    setViewYear(year);
    setViewMonth(month);
  }, []);

  const todayKey = now ? manilaKey(now) : "";
  const lastBookableKey = now ? maxBookableKey(now) : "";

  const days = useMemo(() => {
    if (!viewYear || !viewMonth || !todayKey) return [];
    return bookableDaysForMonth(
      viewYear,
      viewMonth,
      todayKey,
      lastBookableKey
    );
  }, [viewYear, viewMonth, todayKey, lastBookableKey]);

  const canGoPrevMonth = useMemo(() => {
    if (!now || !viewYear || !viewMonth) return false;
    const { year, month } = manilaParts(now);
    return viewYear > year || (viewYear === year && viewMonth > month);
  }, [now, viewYear, viewMonth]);

  const canGoNextMonth = useMemo(() => {
    if (!now || !viewYear || !viewMonth) return false;
    const last = manilaParts(
      new Date(now.getTime() + BOOKING_DAYS_AHEAD * 86400000)
    );
    return (
      viewYear < last.year ||
      (viewYear === last.year && viewMonth < last.month)
    );
  }, [now, viewYear, viewMonth]);

  useEffect(() => {
    if (!days.length || !day) return;
    if (!days.some((d) => d.key === day)) {
      setDay(days[0].key);
    }
  }, [days, day]);

  function shiftMonth(delta: number) {
    if (!viewYear || !viewMonth) return;
    const d = new Date(Date.UTC(viewYear, viewMonth - 1 + delta, 1));
    setViewYear(d.getUTCFullYear());
    setViewMonth(d.getUTCMonth() + 1);
  }

  const sessionsByDay = useMemo(() => {
    const map = new Map<string, PublicSchedule["sessions"]>();
    for (const s of schedule.sessions) {
      if (now && new Date(s.ends_at) <= now) continue;
      const key = manilaKey(new Date(s.starts_at));
      map.set(key, [...(map.get(key) ?? []), s]);
    }
    return map;
  }, [schedule.sessions, now]);

  const slots = useMemo(() => {
    if (!now || !day) return [];
    return buildHourAggregates({
      dayKey: day,
      openHour: schedule.openHour,
      closeHour: schedule.closeHour,
      courts: schedule.courts,
      bookings: schedule.busy,
      blocks: schedule.blocks ?? [],
      now,
    });
  }, [now, day, schedule]);

  const daySessions = (day && sessionsByDay.get(day)) || [];
  const totalCourts = schedule.courts.length;

  const bookCourt = () =>
    go({
      next: "/dashboard/bookings",
      title: "Book your court",
      description: "Sign in or create a free account to reserve this slot.",
    });
  const joinOpenPlay = () =>
    go({
      next: "/dashboard/bookings",
      title: "Join Open Play",
      description: "Sign in or create a free account to save your spot.",
    });

  return (
    <div className="glass-strong relative overflow-hidden rounded-[1.75rem] p-4 sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(212,168,69,0.16),transparent_70%)]"
      />

      {/* Mode switch */}
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="tablist"
          aria-label="Schedule type"
          className="grid grid-cols-2 rounded-full border border-[rgba(212,168,69,0.25)] bg-black/40 p-1 sm:w-[22rem]"
        >
          {(
            [
              ["openplay", "Open Play"],
              ["court", "BOOK A COURT"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              role="tab"
              type="button"
              aria-selected={mode === value}
              onClick={() => setMode(value)}
              className={cn(
                "rounded-full px-4 py-2.5 text-sm font-semibold transition",
                mode === value
                  ? "bg-gold text-[#15110a] shadow-[0_6px_20px_rgba(212,168,69,0.25)]"
                  : "text-white/65 hover:text-[#f3d27a]"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          {mode === "court" ? (
            <>
              <span className="text-[#f3d27a]">
                {formatCurrency(schedule.exclusiveFeeCents)}
              </span>{" "}
              per court / hour · private play
            </>
          ) : (
            <>
              <span className="text-[#f3d27a]">
                {formatCurrency(schedule.openPlayFeeCents)}
              </span>{" "}
              per player · drop in &amp; rotate
            </>
          )}
        </p>
      </div>

      {/* Month + date strip */}
      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 text-[#f3d27a] hover:bg-white/10"
            disabled={!canGoPrevMonth}
            aria-label="Previous month"
            onClick={() => shiftMonth(-1)}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <p className="text-center font-[family-name:var(--font-cinzel)] text-sm font-semibold tracking-wide text-[#f3d27a] sm:text-base">
            {viewYear && viewMonth ? monthTitle(viewYear, viewMonth) : "—"}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 text-[#f3d27a] hover:bg-white/10"
            disabled={!canGoNextMonth}
            aria-label="Next month"
            onClick={() => shiftMonth(1)}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        <p className="text-center text-[0.7rem] text-muted-foreground">
          Book up to {BOOKING_DAYS_AHEAD} days ahead
        </p>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {days.length === 0
          ? (
            <p className="w-full py-4 text-center text-sm text-muted-foreground">
              No bookable days in this month — try another month.
            </p>
          )
          : days.map((d) => {
              const active = d.key === day;
              const hasOpenPlay = sessionsByDay.has(d.key);
              return (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setDay(d.key)}
                  aria-pressed={active}
                  className={cn(
                    "relative flex min-w-[4.25rem] flex-col items-center rounded-2xl border px-3 py-2.5 transition",
                    active
                      ? "border-[rgba(243,210,122,0.7)] bg-[rgba(212,168,69,0.14)] text-[#f3d27a]"
                      : "border-[rgba(212,168,69,0.15)] bg-black/25 text-white/70 hover:border-[rgba(212,168,69,0.4)]"
                  )}
                >
                  <span className="text-[0.65rem] font-semibold uppercase tracking-[0.18em]">
                    {d.weekday}
                  </span>
                  <span className="mt-0.5 font-[family-name:var(--font-cinzel)] text-xl font-semibold leading-none">
                    {d.date}
                  </span>
                  <span className="mt-0.5 text-[0.65rem] uppercase tracking-wider opacity-70">
                    {d.month}
                  </span>
                  {mode === "openplay" && hasOpenPlay ? (
                    <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#f3d27a]" />
                  ) : null}
                </button>
              );
            })}
        </div>
      </div>

      {/* Body */}
      <div className="relative mt-6 min-h-[14rem]">
        {!now ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        ) : mode === "court" ? (
          totalCourts === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Court booking opening soon"
              body="Exclusive courts aren't open for online booking yet. Check back shortly."
            />
          ) : slots.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No more slots today"
              body="Today's court hours are over — pick another day above."
            />
          ) : (
            <div className="space-y-6">
              {PERIODS.map((p) => {
                const list = slots.filter((s) => s.hour >= p.from && s.hour < p.to);
                if (!list.length) return null;
                return (
                  <div key={p.label}>
                    <p className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                      <p.icon className="h-3.5 w-3.5 text-[#f3d27a]" />
                      {p.label}
                    </p>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                      {list.map((s) => {
                        const full = s.free === 0;
                        const statusLabel = full ? "Reserved" : "Available";
                        return (
                          <button
                            key={s.hour}
                            type="button"
                            disabled={full || checking}
                            onClick={bookCourt}
                            aria-haspopup="dialog"
                            aria-label={`${fmtTime(s.start)} — ${statusLabel}`}
                            className={cn(
                              "group flex flex-col items-center rounded-xl border px-2 py-3 text-center transition",
                              full
                                ? "cursor-not-allowed border-white/5 bg-white/[0.02] text-white/30"
                                : "border-[rgba(212,168,69,0.22)] bg-black/30 hover:-translate-y-0.5 hover:border-[rgba(243,210,122,0.7)] hover:bg-[rgba(212,168,69,0.1)]"
                            )}
                          >
                            <span
                              className={cn(
                                "text-sm font-semibold",
                                full ? "line-through" : "text-[#f5efe2] group-hover:text-[#f3d27a]"
                              )}
                            >
                              {fmtTime(s.start)}
                            </span>
                            <span
                              className={cn(
                                "mt-1 text-[0.7rem]",
                                full
                                  ? "text-white/40"
                                  : "text-emerald-300/80"
                              )}
                            >
                              {statusLabel}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : daySessions.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No Open Play on this day"
            body={
              sessionsByDay.size
                ? "Days with a gold dot have Open Play sessions — tap one to see times."
                : "New Open Play sessions are posted by our staff regularly. Check back soon."
            }
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {daySessions.map((s) => {
              const left = Math.max(0, s.max_players - s.registered);
              const pct = Math.min(100, (s.registered / Math.max(1, s.max_players)) * 100);
              const live = new Date(s.starts_at) <= now;
              return (
                <div
                  key={s.id}
                  className="flex flex-col rounded-2xl border border-[rgba(212,168,69,0.22)] bg-black/30 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-1.5 text-sm font-semibold text-[#f3d27a]">
                        <Clock className="h-3.5 w-3.5" />
                        {fmtTime(new Date(s.starts_at))} – {fmtTime(new Date(s.ends_at))}
                      </p>
                      <h3 className="mt-1.5 text-lg font-semibold">{s.title}</h3>
                    </div>
                    {live ? (
                      <span className="shrink-0 rounded-full bg-emerald-400/15 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-emerald-300">
                        Live
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {s.courts}
                  </p>
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{s.registered} joined</span>
                      <span className={left === 0 ? "text-red-300" : "text-[#f3d27a]"}>
                        {left === 0 ? "Full" : `${left} spots left`}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div className="bg-gold h-full rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={left === 0 || checking}
                    onClick={joinOpenPlay}
                    aria-haspopup="dialog"
                    className="bg-gold mt-5 rounded-full py-2.5 text-sm font-semibold text-[#15110a] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {left === 0 ? "Session full" : "Join Open Play"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[rgba(212,168,69,0.25)] px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(212,168,69,0.4)]">
        <Icon className="h-5 w-5 text-[#f3d27a]" />
      </div>
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
