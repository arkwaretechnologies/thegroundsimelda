import { addHours } from "date-fns";
import { formatSlotTime } from "@/lib/booking/exclusive-slots";

export type CourtBookingInterval = {
  starts_at: string;
  ends_at: string;
};

const MANILA = "Asia/Manila";
const MAX_DURATION_HOURS = 6;

export function rangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
): boolean {
  return aStart < bEnd && aEnd > bStart;
}

function parseBookingRange(b: CourtBookingInterval) {
  return {
    start: new Date(b.starts_at),
    end: new Date(b.ends_at),
  };
}

export function bookingBlocksHour(
  bookings: CourtBookingInterval[],
  hourStart: Date,
  hourEnd: Date
): boolean {
  return bookings.some((b) => {
    const { start, end } = parseBookingRange(b);
    return rangesOverlap(hourStart, hourEnd, start, end);
  });
}

export function isStartHourBooked(
  bookings: CourtBookingInterval[],
  slotStart: Date
): boolean {
  const hourEnd = addHours(slotStart, 1);
  return bookingBlocksHour(bookings, slotStart, hourEnd);
}

function manilaHour(date: Date): number {
  const hour = new Intl.DateTimeFormat("en-GB", {
    timeZone: MANILA,
    hour: "numeric",
    hour12: false,
  }).format(date);
  return Number(hour);
}

function hoursUntilClose(start: Date, closeHour: number): number {
  const startHour = manilaHour(start);
  return Math.max(0, closeHour - startHour);
}

function hoursUntilNextBooking(
  start: Date,
  bookings: CourtBookingInterval[]
): number {
  const startMs = start.getTime();
  let minDelta = Infinity;
  for (const b of bookings) {
    const bStart = new Date(b.starts_at).getTime();
    if (bStart > startMs) {
      minDelta = Math.min(minDelta, bStart - startMs);
    }
  }
  if (!Number.isFinite(minDelta)) return MAX_DURATION_HOURS;
  return Math.floor(minDelta / (60 * 60 * 1000));
}

export function maxDurationForStart(
  start: Date,
  bookings: CourtBookingInterval[],
  closeHour: number
): number {
  const cap = Math.min(
    MAX_DURATION_HOURS,
    hoursUntilClose(start, closeHour),
    hoursUntilNextBooking(start, bookings)
  );
  return Math.max(0, cap);
}

export function findBookingConflict(
  start: Date,
  durationHours: number,
  bookings: CourtBookingInterval[]
): { startsAt: Date; label: string } | null {
  const end = addHours(start, durationHours);
  for (const b of bookings) {
    const bStart = new Date(b.starts_at);
    const bEnd = new Date(b.ends_at);
    if (rangesOverlap(start, end, bStart, bEnd)) {
      return {
        startsAt: bStart,
        label: formatSlotTime(bStart),
      };
    }
  }
  return null;
}
