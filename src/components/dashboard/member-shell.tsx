"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  LayoutDashboard,
  Wallet,
  CalendarDays,
  History,
  Bell,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MemberAccountMenu } from "@/components/dashboard/member-account-menu";
import { BRAND_WORDMARK } from "@/lib/brand";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/dashboard/profile", label: "Profile", icon: User },
  { href: "/dashboard/wallet", label: "Wallet", icon: Wallet },
  { href: "/dashboard/membership", label: "Membership", icon: Bell },
  { href: "/dashboard/history", label: "History", icon: History },
];

function BrandHeader({
  name,
  avatarUrl,
  email,
  className,
}: {
  name?: string | null;
  avatarUrl?: string | null;
  email?: string | null;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <div className="min-w-0">
        <Link href="/" className="text-base font-semibold tracking-tight">
          {BRAND_WORDMARK.primary}{" "}
          <span className="text-primary">{BRAND_WORDMARK.accent}</span>
        </Link>
        <p className="truncate text-xs text-muted-foreground">
          {name ?? "Member"}
        </p>
      </div>
      <MemberAccountMenu name={name} avatarUrl={avatarUrl} email={email} />
    </div>
  );
}

export function MemberShell({
  children,
  name,
  avatarUrl,
  email,
}: {
  children: React.ReactNode;
  name?: string | null;
  avatarUrl?: string | null;
  email?: string | null;
}) {
  const pathname = usePathname();

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
            <BrandHeader name={name} avatarUrl={avatarUrl} email={email} />
          </header>

          <aside className="member-shell-sidebar glass">
            <BrandHeader
              name={name}
              avatarUrl={avatarUrl}
              email={email}
              className="items-start"
            />
            <nav className="mt-4 space-y-1">
              {NAV.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition",
                      active
                        ? "bg-primary text-white shadow-md shadow-primary/25"
                        : "text-pv-muted hover:bg-white/60 hover:text-pv-ink"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>

          <div className="member-shell-main">{children}</div>

          <nav className="member-shell-bottom-nav member-bottom-nav">
            <ul className="flex items-stretch justify-between gap-0.5">
              {NAV.map((item) => {
                const active = pathname === item.href;
                return (
                  <li key={item.href} className="min-w-0 flex-1">
                    <Link
                      href={item.href}
                      className={cn(
                        "flex flex-col items-center gap-0.5 rounded-xl px-0.5 py-1.5 text-[9px] font-medium leading-tight transition sm:text-[10px]",
                        active
                          ? "bg-primary/15 text-primary"
                          : "text-pv-muted"
                      )}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span className="max-w-full truncate">{item.label}</span>
                    </Link>
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
