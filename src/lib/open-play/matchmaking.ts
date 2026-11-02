export type QueuePlayer = {
  id: string;
  profile_id: string;
  full_name: string | null;
  joined_at: string;
  status: "waiting" | "playing" | "done" | "left";
};

export type AvailableCourt = {
  id: string;
  name: string;
  status: "available" | "occupied" | "maintenance";
  sort_order: number;
};

/**
 * Pure matchmaking helper for client previews / unit tests.
 * Production assignment runs in Postgres `try_matchmake`.
 */
export function previewMatchGroups(
  waiting: QueuePlayer[],
  courts: AvailableCourt[],
  groupSize = 4
) {
  const available = courts
    .filter((c) => c.status === "available")
    .sort((a, b) => a.sort_order - b.sort_order);
  const queue = [...waiting]
    .filter((p) => p.status === "waiting")
    .sort(
      (a, b) =>
        new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime()
    );

  const matches: { court: AvailableCourt; players: QueuePlayer[] }[] = [];
  let qi = 0;
  let ci = 0;

  while (qi + groupSize <= queue.length && ci < available.length) {
    matches.push({
      court: available[ci],
      players: queue.slice(qi, qi + groupSize),
    });
    qi += groupSize;
    ci += 1;
  }

  return matches;
}
