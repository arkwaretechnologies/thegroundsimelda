/**
 * Microbench: old 90-day hour-walk vs month-scoped slot generation.
 * Run: node scripts/bench-exclusive-slots.mjs
 */
import { addHours } from "date-fns";

const MANILA = "Asia/Manila";
const BOOKING_DAYS_AHEAD = 90;
const OPEN = 6;
const CLOSE = 22;

function manilaHour(date) {
  const hour = new Intl.DateTimeFormat("en-GB", {
    timeZone: MANILA,
    hour: "numeric",
    hour12: false,
  }).format(date);
  return Number(hour);
}

function isOnTheHourUtc(date) {
  return (
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0
  );
}

function buildExclusiveSlotsOld(openHour, closeHour, daysAhead, now) {
  const hoursPerDay = Math.max(0, closeHour - openHour);
  const maxSlots = hoursPerDay * daysAhead;
  const slots = [];
  const cursor = new Date(now);
  cursor.setUTCMinutes(0, 0, 0);
  cursor.setUTCHours(cursor.getUTCHours() + 1);
  const maxIterations = 24 * daysAhead + 24;

  for (let i = 0; i < maxIterations && slots.length < maxSlots; i++) {
    const startsAt = addHours(cursor, i);
    if (startsAt <= now) continue;
    if (!isOnTheHourUtc(startsAt)) continue;
    const hour = manilaHour(startsAt);
    if (hour < openHour || hour >= closeHour) continue;
    const endsAt = addHours(startsAt, 1);
    const label = startsAt.toLocaleString("en-PH", {
      timeZone: MANILA,
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    slots.push({ id: startsAt.toISOString(), label, startsAt, endsAt });
  }
  return slots;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function manilaDateKey(date) {
  return date.toLocaleDateString("en-CA", { timeZone: MANILA });
}

function buildExclusiveSlotsForMonth(openHour, closeHour, year, month, now) {
  const todayKey = manilaDateKey(now);
  const last = new Date(now.getTime() + BOOKING_DAYS_AHEAD * 86400000);
  const lastKey = manilaDateKey(last);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const slots = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const key = `${year}-${pad2(month)}-${pad2(day)}`;
    if (key < todayKey || key > lastKey) continue;
    for (let hour = openHour; hour < closeHour; hour++) {
      const startsAt = new Date(`${key}T${pad2(hour)}:00:00+08:00`);
      if (startsAt <= now) continue;
      slots.push({
        id: startsAt.toISOString(),
        label: "",
        startsAt,
        endsAt: new Date(startsAt.getTime() + 3600000),
      });
    }
  }
  return slots;
}

function time(fn) {
  const t0 = performance.now();
  const result = fn();
  const ms = performance.now() - t0;
  return { ms, count: result.length };
}

const now = new Date("2026-11-13T04:00:00.000Z");
const parts = new Intl.DateTimeFormat("en-US", {
  timeZone: MANILA,
  year: "numeric",
  month: "numeric",
}).formatToParts(now);
const year = Number(parts.find((p) => p.type === "year").value);
const month = Number(parts.find((p) => p.type === "month").value);

const oldRun = time(() =>
  buildExclusiveSlotsOld(OPEN, CLOSE, BOOKING_DAYS_AHEAD, now)
);
const newRun = time(() =>
  buildExclusiveSlotsForMonth(OPEN, CLOSE, year, month, now)
);

console.log(
  JSON.stringify(
    {
      old_90_day_walk: oldRun,
      new_visible_month: newRun,
      object_count_ratio: Number((newRun.count / oldRun.count).toFixed(3)),
      poll_before: { interval_ms: 2000, paymongo_every_poll: true, req_per_min: 30 },
      poll_after: {
        interval_ms: 4000,
        backoff_to_ms: 8000,
        paymongo_every_n_polls: 4,
        req_per_min_start: 15,
      },
      getUser_per_dashboard_nav: {
        before: "middleware + layout + page (3)",
        after:
          "middleware (dashboard matcher only) + layout + page (3 on /dashboard; 0 on marketing/API)",
      },
    },
    null,
    2
  )
);
