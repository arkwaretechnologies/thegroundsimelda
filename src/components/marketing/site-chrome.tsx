"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookCourtButton, useMemberGate } from "@/components/marketing/auth-modal";
import { PageShell } from "@/components/shared/page-shell";
import { cn } from "@/lib/utils";
import {
  BRAND_NAME,
  BRAND_LOGO_SRC,
  BRAND_SHORT_DESCRIPTION,
  BRAND_VENUE_LINE,
} from "@/lib/brand";

export const MARKETING_NAV = [
  { href: "/#how", label: "How it works" },
  { href: "/#schedule", label: "Schedule" },
  { href: "/#tournaments", label: "Tournaments" },
  { href: "/#about", label: "About us" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { go } = useMemberGate();
  const openLogin = () =>
    go({
      mode: "signin",
      next: "/dashboard",
      title: "Welcome back",
      description: "Sign in to your member account.",
    });

  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 8);
      // Hide while scrolling down past the hero edge, reveal on any scroll up.
      if (Math.abs(y - lastY) > 6) {
        setHidden(y > lastY && y > 160);
        lastY = y;
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-[transform,background-color,border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        hidden && !open ? "-translate-y-full" : "translate-y-0",
        scrolled || open
          ? "border-[rgba(212,168,69,0.22)] bg-black/90 backdrop-blur-md"
          : "border-transparent bg-black"
      )}
    >
      <PageShell className="flex h-16 items-center justify-between gap-4 sm:h-[4.5rem]">
        <Link
          href="/"
          className="flex shrink-0 items-center"
          aria-label={`${BRAND_NAME} home`}
          onClick={() => setOpen(false)}
        >
          <Image
            src={BRAND_LOGO_SRC}
            alt=""
            width={150}
            height={56}
            priority
            className="h-10 w-auto sm:h-12"
          />
        </Link>

        <nav
          aria-label="Main"
          className="hidden items-center gap-8 md:flex"
        >
          {MARKETING_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group relative font-[family-name:var(--font-cinzel)] text-[0.8rem] font-medium uppercase tracking-[0.18em] text-white/75 transition-colors hover:text-[var(--tg-gold-light)]"
            >
              {item.label}
              <span className="absolute -bottom-1.5 left-1/2 h-px w-0 -translate-x-1/2 bg-[var(--tg-gold)] transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={openLogin}
            aria-haspopup="dialog"
            className="hidden text-white/85 hover:bg-white/10 hover:text-white sm:inline-flex"
          >
            Log in
          </Button>
          <BookCourtButton
            size="sm"
            mode="signup"
            next="/dashboard"
            title={`Join ${BRAND_NAME}`}
            description="Create your free member account — or sign in if you already have one."
            className="bg-gold rounded-full px-5 text-[#15110a] shadow-[0_6px_20px_rgba(212,168,69,0.3)] hover:brightness-110"
          >
            Join
          </BookCourtButton>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--tg-gold-light)] transition hover:bg-white/10 md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </PageShell>

      {/* Mobile menu */}
      <div
        id="mobile-nav"
        className={cn(
          "grid overflow-hidden border-t border-[rgba(212,168,69,0.18)] bg-black/95 transition-[grid-template-rows,opacity] duration-300 md:hidden",
          open
            ? "grid-rows-[1fr] opacity-100"
            : "pointer-events-none grid-rows-[0fr] border-transparent opacity-0"
        )}
      >
        <div className="min-h-0">
          <nav aria-label="Mobile" className="flex flex-col px-6 py-4">
            {MARKETING_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                tabIndex={open ? 0 : -1}
                className="border-b border-white/5 py-4 font-[family-name:var(--font-cinzel)] text-sm uppercase tracking-[0.22em] text-white/85 transition hover:text-[var(--tg-gold-light)]"
              >
                {item.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                openLogin();
              }}
              tabIndex={open ? 0 : -1}
              aria-haspopup="dialog"
              className="py-4 text-left font-[family-name:var(--font-cinzel)] text-sm uppercase tracking-[0.22em] text-[var(--tg-gold-light)]"
            >
              Log in
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-[rgba(212,168,69,0.18)] bg-black pt-14 pb-10">
      <PageShell>
        <div className="flex flex-col items-center text-center">
          <Image
            src={BRAND_LOGO_SRC}
            alt={BRAND_NAME}
            width={220}
            height={84}
            className="h-16 w-auto sm:h-20"
          />
          <p className="mt-4 max-w-sm text-sm text-white/55">
            {BRAND_SHORT_DESCRIPTION}
          </p>
          <nav
            aria-label="Footer"
            className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-3"
          >
            {MARKETING_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="font-[family-name:var(--font-cinzel)] text-xs uppercase tracking-[0.2em] text-white/65 transition hover:text-[var(--tg-gold-light)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="gold-rule mt-10 w-full max-w-md text-[10px]">✦</div>
          <p className="mt-6 text-xs tracking-wide text-white/40">
            © {new Date().getFullYear()} {BRAND_NAME} · {BRAND_VENUE_LINE}
          </p>
        </div>
      </PageShell>
    </footer>
  );
}
