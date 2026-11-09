"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { ArrowRight } from "lucide-react";
import { BookCourtButton, useMemberGate } from "@/components/marketing/auth-modal";
import { ScheduleBoard } from "@/components/marketing/schedule-board";
import { TournamentsList } from "@/components/marketing/tournaments-list";
import {
  DrawLine,
  EASE_OUT,
  Magnetic,
  MaskLines,
  Spotlight,
} from "@/components/motion/primitives";
import type {
  PublicSchedule,
  PublicTournament,
} from "@/lib/marketing/public-schedule";
import { PageShell } from "@/components/shared/page-shell";
import { BRAND_NAME, BRAND_VENUE_LINE } from "@/lib/brand";

const JOIN_STICKER = "/join-now-sticker.png";

const HERO_IMAGE = "/Cinematic Pickleball Court Gear Scene.png";
const ABOUT_IMAGE = "/Golden Grounds Pickleball Café.png";

const goldButton =
  "bg-gold rounded-full text-[#15110a] shadow-[0_10px_30px_rgba(212,168,69,0.28)] hover:brightness-110";

const rise = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
};

/** Editorial section opener: index + label on the left, headline on the right. */
function SectionIntro({
  index,
  label,
  title,
  body,
}: {
  index: string;
  label: string;
  title: React.ReactNode[];
  body?: string;
}) {
  return (
    <div>
      <DrawLine />
      <div className="grid gap-5 pt-6 md:grid-cols-[minmax(0,1fr)_minmax(0,2.2fr)] md:gap-12 md:pt-8">
        <motion.div
          {...rise}
          transition={{ duration: 0.7, ease: EASE_OUT }}
          className="flex items-baseline gap-3"
        >
          <span className="font-[family-name:var(--font-cinzel)] text-sm tabular-nums text-[var(--tg-gold-light)]">
            ({index})
          </span>
          <span className="text-xs font-semibold uppercase tracking-[0.28em] text-white/55">
            {label}
          </span>
        </motion.div>
        <div>
          <h2 className="text-[2rem] font-semibold leading-[1.05] sm:text-5xl">
            <MaskLines lines={title} inView stagger={0.1} />
          </h2>
          {body ? (
            <motion.p
              {...rise}
              transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.15 }}
              className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground"
            >
              {body}
            </motion.p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const STEPS = [
  {
    n: "01",
    title: "Create & top up",
    body: "Open your free member account and load your digital wallet in seconds.",
  },
  {
    n: "02",
    title: "Book your court",
    body: "Reserve a private court by the hour, or save a spot in Open Play.",
  },
  {
    n: "03",
    title: "Check in & play",
    body: "Check in at the cashier when you arrive and walk straight on court.",
  },
];

const PILLARS = [
  {
    k: "Play",
    title: "Pickleball",
    body: "Well-kept courts for casual rallies, competitive games and Open Play sessions.",
  },
  {
    k: "Pause",
    title: "Café",
    body: "Freshly brewed coffee and bites to fuel up before a match or unwind after.",
  },
  {
    k: "Stay",
    title: "Bar",
    body: "Celebrate the win — or the comeback — with drinks and good company.",
  },
];

/** The neon "Join now" pickleball sticker — opens the sign-up modal. */
function JoinSticker() {
  const { go, checking } = useMemberGate();
  return (
    <motion.button
      type="button"
      aria-haspopup="dialog"
      aria-label={`Join ${BRAND_NAME}`}
      disabled={checking}
      onClick={() =>
        go({
          mode: "signup",
          next: "/dashboard",
          title: `Join ${BRAND_NAME}`,
          description:
            "Create your free member account — or sign in if you already have one.",
        })
      }
      className="relative block h-36 w-36 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--tg-gold-light)] focus-visible:ring-offset-4 focus-visible:ring-offset-[#0a0a09] sm:h-44 sm:w-44"
      animate={{ y: [0, -8, 0], rotate: [-4, 2, -4] }}
      transition={{ duration: 5, ease: "easeInOut", repeat: Infinity }}
      whileHover={{ scale: 1.08, rotate: -10, transition: { type: "spring", stiffness: 300, damping: 14 } }}
      whileTap={{ scale: 0.92 }}
    >
      <span
        aria-hidden
        className="absolute inset-[12%] rounded-full bg-[radial-gradient(circle,rgba(200,240,40,0.45),transparent_70%)] blur-2xl"
      />
      <Image
        src={JOIN_STICKER}
        alt=""
        fill
        sizes="(min-width: 640px) 176px, 144px"
        className="relative object-contain drop-shadow-[0_18px_30px_rgba(0,0,0,0.55)]"
      />
    </motion.button>
  );
}

export function LandingPage({
  schedule,
  tournaments,
}: {
  schedule: PublicSchedule;
  tournaments: PublicTournament[];
}) {
  const reduce = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "10%"]);
  const copyY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "-18%"]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.75], [1, reduce ? 1 : 0]);

  const aboutRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: aboutProgress } = useScroll({
    target: aboutRef,
    offset: ["start end", "end start"],
  });
  // Starts at 0% so server and client agree regardless of reduced motion.
  const aboutImageY = useTransform(aboutProgress, [0, 1], ["0%", reduce ? "0%" : "12%"]);

  return (
    <>
      {/* ───────────── Hero ───────────── */}
      <section
        ref={heroRef}
        className="relative isolate flex min-h-[calc(100svh-4rem)] w-full overflow-hidden bg-[#07261a] sm:min-h-[calc(100svh-4.5rem)]"
      >
        <motion.div
          className="absolute inset-x-0 -top-[10%] bottom-0 -z-20"
          style={{ y: imageY }}
        >
          <motion.div
            className="relative h-full w-full"
            initial={{ scale: 1.12 }}
            animate={{ scale: 1 }}
            transition={{ duration: 2.4, ease: EASE_OUT }}
          >
            <Image
              src={HERO_IMAGE}
              alt="Pickleball paddle, towel and ball resting courtside on a green court"
              fill
              priority
              sizes="100vw"
              className="object-cover object-[22%_center] lg:object-[center_57%]"
            />
          </motion.div>
        </motion.div>
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
          className="absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-b from-transparent to-[#0a0a09]"
        />

        <PageShell className="flex w-full flex-col py-10 sm:py-14 lg:flex-row lg:items-center lg:justify-end lg:py-20">
          <motion.div
            style={{ y: copyY, opacity: copyOpacity }}
            className="flex flex-1 flex-col justify-between gap-10 lg:w-[46%] lg:flex-none lg:justify-center"
          >
            <div className="text-center lg:text-left">
              <h1 className="sr-only">{BRAND_NAME}</h1>
              <motion.p
                initial={{ opacity: 0, letterSpacing: "0.6em" }}
                animate={{ opacity: 1, letterSpacing: "0.32em" }}
                transition={{ duration: 1.2, ease: EASE_OUT }}
                className="eyebrow"
              >
                {BRAND_VENUE_LINE}
              </motion.p>
              <p className="text-gold mt-4 font-[family-name:var(--font-cinzel)] text-[2.6rem] font-semibold leading-[1.02] sm:text-6xl lg:text-[4.5rem]">
                <MaskLines
                  lines={["The Social", "Standard."]}
                  delay={0.25}
                  stagger={0.14}
                  lineClassName="text-gold"
                />
              </p>
              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ duration: 1, ease: EASE_OUT, delay: 0.7 }}
                className="gold-rule mx-auto mt-6 max-w-[16rem] origin-center text-[10px] lg:mx-0 lg:origin-left"
              >
                ✦
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.85 }}
                className="mx-auto mt-6 max-w-md text-balance text-base leading-relaxed text-white/80 sm:text-lg lg:mx-0"
              >
                Courts, coffee and cocktails under one roof. Book your court,
                top up your wallet, and check the schedule — all from your phone.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE_OUT, delay: 1 }}
              className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center lg:justify-start"
            >
              <Magnetic className="w-full sm:w-auto">
                <BookCourtButton className={`${goldButton} w-full sm:w-auto`}>
                  Book a court <ArrowRight className="h-4 w-4" />
                </BookCourtButton>
              </Magnetic>
            </motion.div>
          </motion.div>
        </PageShell>

        <Link
          href="/#how"
          aria-label="Scroll to How it works"
          className="group absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 lg:flex"
        >
          <span className="text-[0.6rem] font-semibold uppercase tracking-[0.4em] text-white/50 transition group-hover:text-[var(--tg-gold-light)]">
            Scroll
          </span>
          <span className="relative h-10 w-px overflow-hidden bg-white/15">
            <motion.span
              className="absolute left-0 top-0 h-4 w-px bg-[var(--tg-gold-light)]"
              animate={{ y: ["-100%", "250%"] }}
              transition={{ duration: 1.8, ease: "easeInOut", repeat: Infinity }}
            />
          </span>
        </Link>
      </section>

      {/* ───────────── How it works ───────────── */}
      <section id="how" className="scroll-mt-20 py-20 sm:py-28">
        <PageShell>
          <SectionIntro
            index="01"
            label="How it works"
            title={["From sign-up", "to serve."]}
            body="Your whole member experience lives in one app — no forms at the counter, no waiting."
          />
          <div className="mt-14 grid md:grid-cols-3">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.n}
                {...rise}
                transition={{ duration: 0.8, ease: EASE_OUT, delay: i * 0.12 }}
                className="group relative border-[rgba(212,168,69,0.15)] py-8 max-md:border-b md:border-l md:px-8 md:py-2 md:first:border-l-0 md:first:pl-0"
              >
                <span className="text-outline block font-[family-name:var(--font-cinzel)] text-7xl font-semibold leading-none transition-colors duration-500 group-hover:text-[var(--tg-gold)] sm:text-8xl">
                  {s.n}
                </span>
                <h3 className="mt-6 text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                  {s.body}
                </p>
              </motion.div>
            ))}
          </div>
        </PageShell>
      </section>

      {/* ───────────── Schedule ───────────── */}
      <section id="schedule" className="scroll-mt-20 pb-20 sm:pb-28">
        <PageShell>
          <SectionIntro
            index="02"
            label="Schedule"
            title={["Find your", "time on court."]}
            body="See what's open this week. Reserve a private court for your group, or drop into Open Play and meet the community."
          />
          <motion.div
            {...rise}
            transition={{ duration: 0.8, ease: EASE_OUT }}
            className="mt-12"
          >
            <Spotlight className="rounded-[1.75rem]">
              <ScheduleBoard schedule={schedule} />
            </Spotlight>
          </motion.div>
        </PageShell>
      </section>

      {/* ───────────── Tournaments ───────────── */}
      <section id="tournaments" className="scroll-mt-20 pb-20 sm:pb-28">
        <PageShell>
          <SectionIntro
            index="03"
            label="Tournaments"
            title={["Compete at", "The Grounds."]}
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
          <SectionIntro
            index="04"
            label="About us"
            title={["More than", "a court."]}
            body={`${BRAND_NAME} brings pickleball, a café and a bar together in one place — somewhere to play hard, slow down over coffee, and stay for one more round with friends.`}
          />

          <motion.div
            ref={aboutRef}
            initial={{ clipPath: "inset(18% 6% 18% 6% round 1rem)" }}
            whileInView={{ clipPath: "inset(0% 0% 0% 0% round 1rem)" }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 1.3, ease: EASE_OUT }}
            className="relative mt-12 overflow-hidden rounded-2xl border border-[rgba(212,168,69,0.3)] shadow-[0_30px_80px_rgba(0,0,0,0.5)]"
          >
            <div className="relative aspect-[3/1] w-full overflow-hidden">
              <motion.div
                className="absolute inset-x-0 -top-[12%] bottom-0"
                style={{ y: aboutImageY }}
              >
                <Image
                  src={ABOUT_IMAGE}
                  alt={`${BRAND_NAME} — Pickleball, Café, Bar. The Social Standard.`}
                  fill
                  sizes="(min-width: 1088px) 1040px, 100vw"
                  className="object-cover"
                />
              </motion.div>
            </div>
          </motion.div>

          <div className="mt-12 grid gap-10 sm:grid-cols-3 sm:gap-8">
            {PILLARS.map((p, i) => (
              <motion.div
                key={p.title}
                {...rise}
                transition={{ duration: 0.8, ease: EASE_OUT, delay: i * 0.12 }}
              >
                <DrawLine />
                <p className="mt-5 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-[var(--tg-gold-light)]">
                  {p.k}
                </p>
                <h3 className="mt-2 text-2xl font-semibold">{p.title}</h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                  {p.body}
                </p>
              </motion.div>
            ))}
          </div>
        </PageShell>
      </section>

      {/* ───────────── CTA ───────────── */}
      <section className="pb-24 sm:pb-32">
        <PageShell>
          <DrawLine />
          <div className="flex flex-col items-start gap-10 pt-14 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/55">
                Membership
              </p>
              <h2 className="mt-4 text-[2.75rem] font-semibold leading-[1] sm:text-7xl">
                <MaskLines
                  inView
                  lines={["Ready", <span key="p" className="text-gold">to play?</span>]}
                />
              </h2>
              <motion.p
                {...rise}
                transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.2 }}
                className="mt-5 max-w-md text-muted-foreground"
              >
                Create your member account and manage your wallet and bookings
                in one place.
              </motion.p>
            </div>
            <Magnetic strength={0.4}>
              <JoinSticker />
            </Magnetic>
          </div>
        </PageShell>
      </section>
    </>
  );
}
