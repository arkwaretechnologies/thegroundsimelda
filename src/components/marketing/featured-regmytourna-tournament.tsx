"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { CalendarDays, ExternalLink, MapPin, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FeaturedTournament } from "@/lib/marketing/featured-tournament";

export function FeaturedRegMyTournaTournament({
  tournament,
}: {
  tournament: FeaturedTournament;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5 }}
      className="mx-auto w-full max-w-4xl"
    >
      <article className="glass overflow-hidden rounded-[1.75rem] border border-[rgba(212,168,69,0.35)]">
        {tournament.coverImageUrl ? (
          <div className="relative h-40 w-full sm:h-52">
            <Image
              src={tournament.coverImageUrl}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 896px"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex items-end gap-3">
              <Trophy className="h-8 w-8 shrink-0 text-[#f3d27a]" aria-hidden />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f3d27a]/90">
                  Featured on RegMyTourna
                </p>
                <h3 className="text-lg font-semibold text-white sm:text-xl">
                  {tournament.name}
                </h3>
              </div>
            </div>
          </div>
        ) : null}

        <div className="p-5 sm:p-6">
          {!tournament.coverImageUrl ? (
            <h3 className="font-[family-name:var(--font-cinzel)] text-xl font-semibold text-[#f3d27a] sm:text-2xl">
              {tournament.name}
            </h3>
          ) : null}

          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {tournament.statusLine}
          </p>

          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <div className="flex gap-2">
              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[#f3d27a]" />
              <div>
                <dt className="text-xs uppercase tracking-wider text-white/45">
                  Tournament date
                </dt>
                <dd>{tournament.startsAtLabel}</dd>
              </div>
            </div>
            <div className="flex gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#f3d27a]" />
              <div>
                <dt className="text-xs uppercase tracking-wider text-white/45">
                  Venue
                </dt>
                <dd className="text-pretty">{tournament.venue}</dd>
              </div>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-white/45">
                Entries close
              </dt>
              <dd className="mt-0.5">{tournament.entriesCloseLabel}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-white/45">
                Entry fees
              </dt>
              <dd className="mt-0.5 text-[#f3d27a]">{tournament.feeSummary}</dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild className="bg-gold shrink-0 text-[#15110a] hover:brightness-110">
              <a
                href={tournament.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Register on RegMyTourna
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <a
              href={tournament.url}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate font-mono text-xs text-white/50 underline-offset-2 hover:text-[#f3d27a] hover:underline"
            >
              {tournament.url}
            </a>
          </div>
        </div>
      </article>
    </motion.div>
  );
}