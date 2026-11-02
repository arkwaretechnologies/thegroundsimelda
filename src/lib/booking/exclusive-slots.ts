import { addHours } from "date-fns";

const MANILA = "Asia/Manila";

export type ExclusiveSlot = {
  id: string;
  label: string;
  startsAt: Date;
  endsAt: Date;
};

function manilaHour(date: Date): number {
  const hour = new Intl.DateTimeFormat("en-GB", {
    timeZone: MANILA,
    hour: "numeric",
    hour12: false,
  }).format(date);
  return Number(hour);
}

function isOnTheHourUtc(date: Date): boolean {
  return (
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0
  );
}

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
  for (const list of map.values()) {
    list.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  }
  return map;
}

/** On-the-hour slots within branch exclusive hours (matches create_booking rules). */
export function buildExclusiveSlots(
  openHour: number,
  closeHour: number,
  daysAhead = 14
): ExclusiveSlot[] {
  const hoursPerDay = Math.max(0, closeHour - openHour);
  const maxSlots = hoursPerDay * daysAhead;
  const slots: ExclusiveSlot[] = [];
  const now = new Date();
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

    slots.push({
      id: startsAt.toISOString(),
      label,
      startsAt,
      endsAt,
    });
  }

  return slots;
}
