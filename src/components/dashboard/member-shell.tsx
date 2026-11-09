"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import {
  LayoutDashboard,
  Wallet,
  CalendarDays,
  History,
  Crown,
  User,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MemberAccountMenu } from "@/components/dashboard/member-account-menu";
import { BRAND_LOGO_SRC, BRAND_NAME } from "@/lib/brand";
import { getAdminReservationsUrl } from "@/lib/admin-app";
import type { LucideIcon } from "lucide-react";

const BASE_NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/dashboard/profile", label: "Profile", icon: User },
  { href: "/dashboard/wallet", label: "Wallet", icon: Wallet },
  { href: "/dashboard/membership", label: "Membership", icon: Crown },
  { href: "/dashboard/history", label: "History", icon: History },
] as const;

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  external?: boolean;
};

function buildNav(isStaff: boolean): NavItem[] {
  const staffUrl = getAdminReservationsUrl();
  const staffItem: NavItem | null =
    isStaff && staffUrl
      ? {
          href: staffUrl,
          label: "Reservations",
          icon: ClipboardList,
          external: true,
        }
      : null;
  if (!staffItem) return [...BASE_NAV];
  return [...BASE_NAV.slice(0, 2), staffItem, ...BASE_NAV.slice(2)];
}

function NavAnchor({
  item,
  active,
  className,
  children,
}: {
  item: NavItem;
  active: boolean;
  className: string;
  children: ReactNode;
}) {
  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {children}
      </a>
    );
  }
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={className}
    >
      {children}
    </Link>
  );
}

function BrandHeader({
  name,
  avatarUrl,
  email,
  className,
  tone = "default",
}: {
  name?: string | null;
  avatarUrl?: string | null;
  email?: string | null;
  className?: string;
  tone?: "default" | "dark";
}) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <Link
        href="/"
        className="flex shrink-0 items-center"
        aria-label={`${BRAND_NAME} home`}
      >
        <Image
          src={BRAND_LOGO_SRC}
          alt=""
          width={132}
          height={48}
          priority
          className={tone === "dark" ? "h-9 w-auto" : "h-11 w-auto"}
        />
      </Link>
      <MemberAccountMenu
        name={name}
        avatarUrl={avatarUrl}
        email={email}
        tone="dark"
      />
    </div>
  );
}

export function MemberShell({
  children,
  name,
  avatarUrl,
  email,
  isStaff = false,
}: {
  children: ReactNode;
  name?: string | null;
  avatarUrl?: string | null;
  email?: string | null;
  isStaff?: boolean;
}) {
  const pathname = usePathname();
  const nav = buildNav(isStaff);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const root = document.documentElement;
    const apply = () => {
      root.dataset.memberShell = mq.matches ? "mobile" : "desktop";
    };
    apply();
    mq.addEventListener("change", apply);
    return () => {
      mq.removeEventListener("change", apply);
      delete root.dataset.memberShell;
    };
  }, []);

  return (
    <div className="member-shell-root">
      <div className="member-shell-viewport">
        <div className="member-shell-frame">
          <header className="member-shell-header">
            <BrandHeader
              name={name}
              avatarUrl={avatarUrl}
              email={email}
              tone="dark"
            />
          </header>

          <aside className="member-shell-sidebar glass">
            <BrandHeader
              name={name}
              avatarUrl={avatarUrl}
              email={email}
            />
            <div className="gold-rule my-4 text-[8px]">✦</div>
            <p className="truncate px-1 text-xs text-muted-foreground">
              Signed in as
            </p>
            <p className="truncate px-1 text-sm font-semibold text-[var(--tg-gold-light)]">
              {name ?? "Member"}
            </p>
            <nav className="mt-5 space-y-1">
              {nav.map((item) => {
                const active = !item.external && pathname === item.href;
                const linkClass = cn(
                  "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-[rgba(212,168,69,0.14)] text-[var(--tg-gold-light)]"
                    : "text-white/60 hover:bg-white/[0.04] hover:text-white"
                );
                return (
                  <NavAnchor
                    key={item.href}
                    item={item}
                    active={active}
                    className={linkClass}
                  >
                    {active ? (
                      <span className="bg-gold absolute inset-y-2 left-0 w-[3px] rounded-full" />
                    ) : null}
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </NavAnchor>
                );
              })}
            </nav>
          </aside>

          <div className="member-shell-main">{children}</div>

          <nav className="member-shell-bottom-nav member-bottom-nav">
            <ul className="flex items-stretch justify-between gap-0.5">
              {nav.map((item) => {
                const active = !item.external && pathname === item.href;
                const linkClass = cn(
                  "relative flex flex-col items-center gap-1 rounded-xl px-0.5 py-1.5 text-[9px] font-medium leading-tight transition sm:text-[10px]",
                  active ? "text-[var(--tg-gold-light)]" : "text-white/50"
                );
                return (
                  <li key={item.href} className="min-w-0 flex-1">
                    <NavAnchor
                      item={item}
                      active={active}
                      className={linkClass}
                    >
                      {active ? (
                        <span className="bg-gold absolute -top-[0.45rem] h-[2px] w-6 rounded-full" />
                      ) : null}
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span className="max-w-full truncate">{item.label}</span>
                    </NavAnchor>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
}
