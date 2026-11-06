"use client";

import { motion } from "framer-motion";
import { Trophy, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { PublicTournament } from "@/lib/marketing/public-schedule";

const MANILA = "Asia/Manila";

const FORMAT_LABEL: Record<string, string> = {
  single_elimination: "Single elimination",
  double_elimination: "Double elimination",
  round_robin: "Round robin",
  swiss: "Swiss",
};

const STATUS: Record<PublicTournament["status"], { label: string; className: string }> = {
  registration: {
    label: "Registration open",
    className: "bg-[rgba(212,168,69,0.16)] text-[#f3d27a]",
  },
  seeding: {
    label: "Registration closed",
    className: "bg-white/10 text-white/70",
  },
  ongoing: {
    label: "In progress",
    className: "bg-emerald-400/15 text-emerald-300",
  },
};

function dateParts(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return {
    month: d.toLocaleDateString("en-PH", { timeZone: MANILA, month: "short" }),
    day: d.toLocaleDateString("en-PH", { timeZone: MANILA, day: "numeric" }),
    full: d.toLocaleString("en-PH", {
      timeZone: MANILA,
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}

export function TournamentsList({ tournaments }: { tournaments: PublicTournament[] }) {
  if (tournaments.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5 }}
        className="relative mx-auto max-w-2xl overflow-hidden rounded-[1.75rem] border border-[rgba(212,168,69,0.3)] bg-black px-6 py-14 text-center"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_50%_0%,rgba(212,168,69,0.18),transparent_70%)]"
        />
        <div className="relative">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(212,168,69,0.45)] bg-[rgba(212,168,69,0.08)]">
            <Trophy className="h-6 w-6 text-[#f3d27a]" />
          </div>
          <h3 className="text-gold mt-5 text-2xl font-semibold">
            The next championship is coming
          </h3>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            No tournaments are open right now. New events are announced here
            first — check back soon or ask our staff at the front desk.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {tournaments.map((t, i) => {
        const start = dateParts(t.starts_at);
        const status = STATUS[t.status];
        const left = Math.max(0, t.max_players - t.registered);
        return (
          <motion.article
            key={t.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="glass flex flex-col overflow-hidden rounded-2xl"
          >
            <div className="flex items-center gap-4 border-b border-[rgba(212,168,69,0.18)] bg-[linear-gradient(135deg,rgba(15,61,38,0.7),rgba(0,0,0,0.4))] p-5">
              <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl border border-[rgba(212,168,69,0.45)] bg-black/50">
                {start ? (
                  <>
                    <span className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[#f3d27a]">
                      {start.month}
                    </span>
                    <span className="font-[family-name:var(--font-cinzel)] text-2xl font-semibold leading-none">
                      {start.day}
                    </span>
                  </>
                ) : (
                  <Trophy className="h-6 w-6 text-[#f3d27a]" />
                )}
              </div>
              <div className="min-w-0">
                <span
                  className={`inline-block rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wider ${status.className}`}
                >
                  {status.label}
                </span>
                <h3 className="mt-2 truncate text-lg font-semibold">{t.name}</h3>
              </div>
            </div>
            <div className="flex flex-1 flex-col p-5">
              {t.description ? (
                <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                  {t.description}
                </p>
              ) : null}
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-wider text-white/45">Format</dt>
                  <dd className="mt-0.5">{FORMAT_LABEL[t.format] ?? t.format}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-white/45">Entry</dt>
                  <dd className="mt-0.5 text-[#f3d27a]">
                    {t.entry_fee_cents ? formatCurrency(t.entry_fee_cents) : "Free"}
                  </dd>
                </div>
                {start ? (
                  <div className="col-span-2">
                    <dt className="text-xs uppercase tracking-wider text-white/45">Starts</dt>
                    <dd className="mt-0.5">{start.full}</dd>
                  </div>
                ) : null}
              </dl>
              <p className="mt-auto flex items-center gap-1.5 pt-5 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5 text-[#f3d27a]" />
                {t.registered}/{t.max_players} players
                {t.status === "registration" ? ` · ${left} spots left` : ""}
              </p>
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}
