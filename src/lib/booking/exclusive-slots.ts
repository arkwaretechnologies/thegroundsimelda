const MANILA = "Asia/Manila";

/** How far ahead members (and public schedule) can book exclusive courts. */
export const BOOKING_DAYS_AHEAD = 90;

export type ExclusiveSlot = {
  id: string;
  label: string;
  startsAt: Date;
  endsAt: Date;
};

export function manilaDateKey(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: MANILA });
}

export function formatSlotTime(date: Date): string {
  return date.toLocaleString("en-PH", {
    timeZone: MANILA,
    hour: "numeric",
    minute: "2-digit",
  });
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function dateKey(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function manilaHourStart(dayKey: string, hour: number): Date {
  return new Date(`${dayKey}T${pad2(hour)}:00:00+08:00`);
}

export function groupExclusiveSlotsByDate(
  slots: ExclusiveSlot[]
): Map<string, ExclusiveSlot[]> {
  const map = new Map<string, ExclusiveSlot[]>();
  for (const slot of slots) {
    const key = manilaDateKey(slot.startsAt);
    const list = map.get(key) ?? [];
    list.push(slot);
    map.set(key, list);
  }
  return map;
}

function addDaysKey(dayKey: string, days: number): string {
  const [y, m, d] = dayKey.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + days));
  return dateKey(
    next.getUTCFullYear(),
    next.getUTCMonth() + 1,
    next.getUTCDate()
  );
}

/** On-the-hour slots for one Manila calendar month (bookable window only). */
export function buildExclusiveSlotsForMonth(
  openHour: number,
  closeHour: number,
  year: number,
  month: number,
  now = new Date(),
  daysAhead = BOOKING_DAYS_AHEAD
): ExclusiveSlot[] {
  const todayKey = manilaDateKey(now);
  const lastKey = addDaysKey(todayKey, daysAhead);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const slots: ExclusiveSlot[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const key = dateKey(year, month, day);
    if (key < todayKey || key > lastKey) continue;
    for (let hour = openHour; hour < closeHour; hour++) {
      const startsAt = manilaHourStart(key, hour);
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

/** On-the-hour slots within branch exclusive hours (matches create_booking rules). */
export function buildExclusiveSlots(
  openHour: number,
  closeHour: number,
  daysAhead = BOOKING_DAYS_AHEAD,
  now = new Date()
): ExclusiveSlot[] {
  const today = manilaDateKey(now);
  const [y, m] = today.split("-").map(Number);
  const last = addDaysKey(today, daysAhead);
  const [ly, lm] = last.split("-").map(Number);
  const slots: ExclusiveSlot[] = [];
  let year = y;
  let month = m;
  while (year < ly || (year === ly && month <= lm)) {
    slots.push(
      ...buildExclusiveSlotsForMonth(openHour, closeHour, year, month, now, daysAhead)
    );
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return slots;
}
