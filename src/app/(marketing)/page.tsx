"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Radio, Wallet, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/shared/page-shell";
import { BRAND_NAME } from "@/lib/brand";

export default function LandingPage() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const opacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.4]);

  return (
    <>
      <section
        ref={heroRef}
        className="relative flex min-h-[min(88vh,52rem)] items-center overflow-hidden py-16"
      >
        <motion.div
          style={{ y, opacity }}
          className="pointer-events-none absolute inset-0"
        >
          <div className="absolute left-1/2 top-16 h-64 w-64 -translate-x-1/2 rounded-full bg-[var(--pv-lime)]/35 blur-3xl" />
          <div className="absolute bottom-8 left-1/4 h-72 w-72 rounded-full bg-primary/25 blur-3xl" />
          <div className="absolute bottom-20 right-1/4 h-56 w-56 rounded-full bg-[var(--pv-lime)]/20 blur-3xl" />
        </motion.div>

        <PageShell className="relative flex flex-col items-center text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--pv-green-deep)] sm:text-sm"
          >
            Court life, elevated
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="font-display max-w-xl text-4xl font-bold leading-[1.05] tracking-tight text-pv-ink sm:text-5xl md:text-6xl"
          >
            {BRAND_NAME}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="mt-4 max-w-md text-base text-pv-muted text-balance sm:text-lg"
          >
            Membership, wallet, and court booking — one premium member
            experience.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.2 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <Button asChild size="lg">
              <Link href="/signup">
                Start playing <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </PageShell>
      </section>

      <section id="how" className="py-16 sm:py-20">
        <PageShell>
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            How it works
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground sm:text-base">
            Top up, activate a plan, and book courts from your phone.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3 sm:gap-5">
            {[
              {
                icon: Wallet,
                title: "Top up & join",
                body: "Fund your digital wallet and activate a plan in seconds.",
              },
              {
                icon: Radio,
                title: "RFID check-in",
                body: "Tap your member card at the club to check in and play.",
              },
              {
                icon: CalendarDays,
                title: "Book courts",
                body: "Reserve exclusive court time when you want private play.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="glass rounded-3xl p-5 text-left"
              >
                <item.icon className="h-7 w-7 text-primary" />
                <h3 className="font-display mt-3 text-lg font-semibold tracking-tight">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{item.body}</p>
              </motion.div>
            ))}
          </div>
        </PageShell>
      </section>

      <section className="pb-16 sm:pb-20">
        <PageShell>
          <div className="glass-strong rounded-[1.75rem] px-6 py-12 text-center sm:px-10">
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Ready to play?
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground sm:text-base">
              Create your member account and manage wallet, plans, and bookings
              in one place.
            </p>
            <Button asChild size="lg" className="mt-6">
              <Link href="/signup">Create account</Link>
            </Button>
          </div>
        </PageShell>
      </section>
    </>
  );
}
