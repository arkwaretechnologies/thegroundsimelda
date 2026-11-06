"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  CircleDot,
  Coffee,
  Store,
  Wallet,
  Wine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookCourtButton } from "@/components/marketing/auth-modal";
import { ScheduleBoard } from "@/components/marketing/schedule-board";
import { TournamentsList } from "@/components/marketing/tournaments-list";
import type {
  PublicSchedule,
  PublicTournament,
} from "@/lib/marketing/public-schedule";
import { PageShell } from "@/components/shared/page-shell";
import { BRAND_NAME, BRAND_VENUE_LINE } from "@/lib/brand";

const HERO_IMAGE = "/Cinematic Pickleball Court Gear Scene.png";
const ABOUT_IMAGE = "/Golden Grounds Pickleball Café.png";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
};

const goldButton =
  "bg-gold rounded-full text-[#15110a] shadow-[0_10px_30px_rgba(212,168,69,0.28)] hover:brightness-110";

function SectionHeading({
  eyebrow,
  title,
  body,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  body?: string;
  align?: "center" | "left";
}) {
  const centered = align === "center";
  return (
    <motion.div
      {...fadeUp}
      transition={{ duration: 0.5 }}
      className={centered ? "mx-auto max-w-2xl text-center" : "max-w-xl"}
    >
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">
        {title}
      </h2>
      <div
        className={`gold-rule mt-5 text-[9px] ${centered ? "mx-auto max-w-[14rem]" : "max-w-[10rem]"}`}
      >
        ✦
      </div>
      {body ? (
        <p className="mt-5 text-base leading-relaxed text-muted-foreground">
          {body}
        </p>
      ) : null}
    </motion.div>
  );
}

export function LandingPage({
  schedule,
  tournaments,
}: {
  schedule: PublicSchedule;
  tournaments: PublicTournament[];
}) {
  return (
    <>
      {/* ───────────── Hero ───────────── */}
      <section className="relative isolate flex min-h-[calc(100svh-4rem)] w-full overflow-hidden bg-[#07261a] sm:min-h-[calc(100svh-4.5rem)]">
        <Image
          src={HERO_IMAGE}
          alt="Pickleball paddle, towel and ball resting courtside on a green court"
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover object-[22%_center] lg:object-[center_62%]"
        />
        {/* Mobile / tablet: darken top for headline + bottom for CTAs */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(0,0,0,0.82)_0%,rgba(0,0,0,0.35)_32%,rgba(0,0,0,0.05)_55%,rgba(0,0,0,0.75)_88%,rgba(0,0,0,0.92)_100%)] lg:hidden"
        />
        {/* Desktop: darken the empty right side where copy sits */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 hidden bg-[linear-gradient(270deg,rgba(0,0,0,0.85)_0%,rgba(0,0,0,0.55)_38%,rgba(0,0,0,0)_68%)] lg:block"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 -z-10 h-24 bg-gradient-to-b from-transparent to-[#0a0a09]"
        />

        <PageShell className="flex w-full flex-col py-10 sm:py-14 lg:flex-row lg:items-center lg:justify-end lg:py-20">
          <div className="flex flex-1 flex-col justify-between gap-10 lg:w-[46%] lg:flex-none lg:justify-center">
            <div className="text-center lg:text-left">
              <h1 className="sr-only">{BRAND_NAME}</h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="eyebrow"
              >
                {BRAND_VENUE_LINE}
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.08 }}
                className="text-gold mt-4 font-[family-name:var(--font-cinzel)] text-[2.6rem] font-semibold leading-[1.05] sm:text-6xl lg:text-[4.25rem]"
              >
                The Social
                <br />
                Standard.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, scaleX: 0.6 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.7, delay: 0.18 }}
                className="gold-rule mx-auto mt-6 max-w-[16rem] text-[10px] lg:mx-0"
              >
                ✦
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.24 }}
                className="mx-auto mt-6 max-w-md text-balance text-base leading-relaxed text-white/80 sm:text-lg lg:mx-0"
              >
                Courts, coffee and cocktails under one roof. Book your court,
                manage your membership and wallet — all from your phone.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.34 }}
              className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center lg:justify-start"
            >
              <BookCourtButton className={goldButton}>
                Book a court <ArrowRight className="h-4 w-4" />
              </BookCourtButton>
            </motion.div>
          </div>
        </PageShell>

        <Link
          href="/#how"
          aria-label="Scroll to How it works"
          className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 text-[#f3d27a]/70 transition hover:text-[#f3d27a] lg:block"
        >
          <ChevronDown className="h-6 w-6 animate-bounce" />
        </Link>
      </section>

      {/* ───────────── How it works ───────────── */}
      <section id="how" className="scroll-mt-20 py-20 sm:py-28">
        <PageShell>
          <SectionHeading
            eyebrow="How it works"
            title="From sign-up to serve in three steps"
            body="Create your account, top up, and book — your whole member experience lives in one app."
          />
          <div className="mt-14 grid gap-5 sm:grid-cols-3">
            {[
              {
                n: "I",
                icon: Wallet,
                title: "Top up & join",
                body: "Create your free account and fund your digital wallet in seconds.",
              },
              {
                n: "II",
                icon: CalendarDays,
                title: "Book your court",
                body: "Reserve exclusive court time or jump into Open Play whenever you like.",
              },
              {
                n: "III",
                icon: Store,
                title: "Check in & play",
                body: "Check in at the cashier when you arrive and head straight to the court.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                {...fadeUp}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="glass group relative overflow-hidden rounded-2xl p-7 transition-colors hover:border-[rgba(212,168,69,0.45)]"
              >
                <span
                  aria-hidden
                  className="absolute -top-3 right-4 font-[family-name:var(--font-cinzel)] text-7xl font-semibold text-[rgba(212,168,69,0.08)]"
                >
                  {item.n}
                </span>
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(212,168,69,0.4)] bg-[rgba(212,168,69,0.08)]">
                  <item.icon className="h-5 w-5 text-[#f3d27a]" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              </motion.div>
            ))}
          </div>
        </PageShell>
      </section>

      {/* ───────────── Schedule ───────────── */}
      <section id="schedule" className="scroll-mt-20 pb-20 sm:pb-28">
        <PageShell>
          <SectionHeading
            eyebrow="Schedule"
            title="Find your time on court"
            body="See what's open this week. Reserve a private court for your group, or drop into Open Play and meet the community."
          />
          <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="mt-12">
            <ScheduleBoard schedule={schedule} />
          </motion.div>
        </PageShell>
      </section>

      {/* ───────────── Tournaments ───────────── */}
      <section id="tournaments" className="scroll-mt-20 pb-20 sm:pb-28">
        <PageShell>
          <SectionHeading
            eyebrow="Tournaments"
            title="Compete at The Grounds"
            body="From friendly round robins to full brackets — test your game against the best players in the community."
          />
          <div className="mt-12">
            <TournamentsList tournaments={tournaments} />
          </div>
        </PageShell>
      </section>

      {/* ───────────── About us ───────────── */}
      <section id="about" className="scroll-mt-20 pb-20 sm:pb-28">
        <PageShell>
          <SectionHeading
            eyebrow="About us"
            title="More than a court"
            body={`${BRAND_NAME} brings pickleball, a café and a bar together in one place — somewhere to play hard, slow down over coffee, and stay for one more round with friends.`}
          />

          <motion.div
            {...fadeUp}
            transition={{ duration: 0.6 }}
            className="relative mt-12 overflow-hidden rounded-2xl border border-[rgba(212,168,69,0.3)] shadow-[0_30px_80px_rgba(0,0,0,0.5)]"
          >
            <div className="relative aspect-[3/1] w-full">
              <Image
                src={ABOUT_IMAGE}
                alt={`${BRAND_NAME} — Pickleball, Café, Bar. The Social Standard.`}
                fill
                sizes="(min-width: 1088px) 1040px, 100vw"
                className="object-cover"
              />
            </div>
          </motion.div>

          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {[
              {
                icon: CircleDot,
                title: "Pickleball",
                body: "Well-kept courts for casual rallies, competitive games and Open Play sessions.",
              },
              {
                icon: Coffee,
                title: "Café",
                body: "Freshly brewed coffee and bites to fuel up before a match or unwind after.",
              },
              {
                icon: Wine,
                title: "Bar",
                body: "Celebrate the win — or the comeback — with drinks and good company.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                {...fadeUp}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="text-center"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(212,168,69,0.4)]">
                  <item.icon className="h-5 w-5 text-[#f3d27a]" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              </motion.div>
            ))}
          </div>
        </PageShell>
      </section>

      {/* ───────────── CTA ───────────── */}
      <section className="pb-20 sm:pb-28">
        <PageShell>
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-[1.75rem] border border-[rgba(212,168,69,0.3)] bg-black px-6 py-14 text-center sm:px-12"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_120%,rgba(212,168,69,0.2),transparent_70%)]"
            />
            <div className="relative">
              <p className="eyebrow">Membership</p>
              <h2 className="text-gold mt-4 text-3xl font-semibold sm:text-4xl">
                Ready to play?
              </h2>
              <p className="mx-auto mt-4 max-w-md text-muted-foreground">
                Create your member account and manage your wallet, plans and
                bookings in one place.
              </p>
              <Button asChild size="lg" className={`${goldButton} mt-8`}>
                <Link href="/signup">
                  Create account <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </PageShell>
      </section>
    </>
  );
}
