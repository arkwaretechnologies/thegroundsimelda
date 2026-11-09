import { rangesOverlap } from "@/lib/booking/exclusive-availability";

const MANILA = "Asia/Manila";

export type TimeInterval = {
  court_id?: string;
  starts_at: string;
  ends_at: string;
};

export type CourtRef = { id: string; name: string };

export type HourSlotStatus = "available" | "booked" | "closed";

export type HourAggregateSlot = {
  hour: number;
  start: Date;
  free: number;
  closed: number;
  booked: number;
  totalCourts: number;
};

export function manilaDateKey(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: MANILA });
}

/** Manila on-the-hour slot (matches SQL `manila_hour_slot`). */
export function manilaHourStart(dayKey: string, hour: number): Date {
  return new Date(
    `${dayKey}T${String(hour).padStart(2, "0")}:00:00+08:00`
  );
}

function intervalBlocksCourt(
  courtId: string,
  hourStart: Date,
  hourEnd: Date,
  rows: TimeInterval[]
): boolean {
  return rows.some((row) => {
    if (row.court_id && row.court_id !== courtId) return false;
    return rangesOverlap(
      hourStart,
      hourEnd,
      new Date(row.starts_at),
      new Date(row.ends_at)
    );
  });
}

export function courtStatusForHour(
  courtId: string,
  hourStart: Date,
  hourEnd: Date,
  bookings: TimeInterval[],
  blocks: TimeInterval[]
): HourSlotStatus {
  if (intervalBlocksCourt(courtId, hourStart, hourEnd, blocks)) {
    return "closed";
  }
  if (intervalBlocksCourt(courtId, hourStart, hourEnd, bookings)) {
    return "booked";
  }
  return "available";
}

export function buildHourAggregates(args: {
  dayKey: string;
  openHour: number;
  closeHour: number;
  courts: CourtRef[];
  bookings: TimeInterval[];
  blocks: TimeInterval[];
  now?: Date;
}): HourAggregateSlot[] {
  const { dayKey, openHour, closeHour, courts, bookings, blocks } = args;
  const now = args.now ?? new Date();
  const totalCourts = courts.length;
  const out: HourAggregateSlot[] = [];

  for (let h = openHour; h < closeHour; h++) {
    const start = manilaHourStart(dayKey, h);
    if (start <= now) continue;
    const end = new Date(start.getTime() + 3600000);

    let free = 0;
    let closed = 0;
    let booked = 0;

    for (const court of courts) {
      const status = courtStatusForHour(court.id, start, end, bookings, blocks);
      if (status === "available") free++;
      else if (status === "closed") closed++;
      else booked++;
    }

    out.push({ hour: h, start, free, closed, booked, totalCourts });
  }

  return out;
}

export function buildCourtHourGrid(args: {
  dayKey: string;
  openHour: number;
  closeHour: number;
  courts: CourtRef[];
  bookings: TimeInterval[];
  blocks: TimeInterval[];
}): {
  hours: number[];
  cells: Record<string, Record<number, HourSlotStatus>>;
} {
  const { dayKey, openHour, closeHour, courts, bookings, blocks } = args;
  const hours: number[] = [];
  const cells: Record<string, Record<number, HourSlotStatus>> = {};

  for (const court of courts) {
    cells[court.id] = {};
  }

  for (let h = openHour; h < closeHour; h++) {
    hours.push(h);
    const start = manilaHourStart(dayKey, h);
    const end = new Date(start.getTime() + 3600000);
    for (const court of courts) {
      cells[court.id][h] = courtStatusForHour(
        court.id,
        start,
        end,
        bookings,
        blocks
      );
    }
  }

  return { hours, cells };
}

/** Map Postgres / RPC errors to member-friendly booking messages. */
export function mapBookingErrorMessage(raw: string): string {
  const lower = raw.toLowerCase();
  if (
    lower.includes("exclusion") ||
    lower.includes("court_booked") ||
    lower.includes("already booked") ||
    lower.includes("overlap")
  ) {
    return "This slot was just taken — your wallet was not charged. Please choose another time.";
  }
  if (lower.includes("court_closed") || lower.includes("closed for booking")) {
    return "This time is closed for booking — please choose another slot.";
  }
  return raw;
}
