import Link from "next/link";
import { ArrowRight, Bell, CalendarDays, Users, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatPill } from "@/components/shared/glass";
import { Badge } from "@/components/ui/badge";
import { TopUpButton } from "@/components/dashboard/top-up-button";
import { ErrorBoundary } from "@/components/shared/error-boundary";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: wallet }, { data: membership }, { data: bookings }, { data: notifications }, { data: attendance }, { data: profile }] =
    await Promise.all([
      supabase
        .from("wallets")
        .select("balance_cents")
        .eq("profile_id", user!.id)
        .maybeSingle(),
      supabase
        .from("memberships")
        .select("ends_at, membership_plans(name, interval)")
        .eq("profile_id", user!.id)
        .eq("status", "active")
        .order("ends_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("bookings")
        .select("id, starts_at, type, courts(name)")
        .eq("profile_id", user!.id)
        .eq("status", "confirmed")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at")
        .limit(5),
      supabase
        .from("notifications")
        .select("id, title, body")
        .eq("profile_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("attendance_logs")
        .select("id")
        .eq("profile_id", user!.id)
        .order("scanned_at", { ascending: false })
        .limit(5),
      supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user!.id)
        .maybeSingle(),
    ]);

  const planRaw = membership?.membership_plans;
  const plan = (
    Array.isArray(planRaw) ? planRaw[0] : planRaw
  ) as { name: string; interval: string } | null | undefined;

  const firstName =
    profile?.full_name?.trim().split(/\s+/)[0] ||
    user?.email?.split("@")[0] ||
    "Member";

  const quickActions = [
    { href: "/dashboard/bookings", label: "Book a court", icon: CalendarDays },
    { href: "/dashboard/bookings", label: "Join Open Play", icon: Users },
    { href: "/dashboard/wallet", label: "Wallet", icon: Wallet },
  ];

  return (
    <ErrorBoundary>
      <div className="w-full space-y-4">
        {/* Welcome / wallet hero */}
        <section className="glass-strong relative overflow-hidden rounded-3xl p-5 sm:p-7">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(212,168,69,0.2),transparent_70%)]"
          />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="eyebrow">Welcome back</p>
              <h1 className="mt-1.5 truncate text-2xl font-semibold sm:text-3xl">
                {firstName}
              </h1>
              <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/55">
                Wallet balance
              </p>
              <p className="text-gold font-[family-name:var(--font-cinzel)] text-4xl font-semibold tabular-nums sm:text-5xl">
                {formatCurrency(wallet?.balance_cents ?? 0)}
              </p>
              <div className="mt-3">
                {membership ? (
                  <Badge variant="success">
                    {plan?.name ?? "Active"} · ends {formatDate(membership.ends_at)}
                  </Badge>
                ) : (
                  <Badge variant="warning">No active membership</Badge>
                )}
              </div>
            </div>
            <div className="shrink-0">
              <TopUpButton />
            </div>
          </div>
        </section>

        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-2.5">
          {quickActions.map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className="glass group flex flex-col items-center gap-2 rounded-2xl px-2 py-4 text-center transition hover:border-[rgba(212,168,69,0.45)]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(212,168,69,0.4)] bg-[rgba(212,168,69,0.08)] transition group-hover:bg-[rgba(212,168,69,0.16)]">
                <a.icon className="h-4.5 w-4.5 text-[var(--tg-gold-light)]" />
              </span>
              <span className="text-xs font-semibold text-white/85 sm:text-sm">
                {a.label}
              </span>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <StatPill label="Plan" value={plan?.name ?? "None"} />
          <StatPill label="Upcoming" value={bookings?.length ?? 0} />
          <StatPill label="Check-ins" value={attendance?.length ?? 0} />
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <section className="glass rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <CalendarDays className="h-4 w-4 text-[var(--tg-gold-light)]" />
                Upcoming bookings
              </h2>
              <Link
                href="/dashboard/bookings"
                className="flex items-center gap-1 text-xs font-semibold text-[var(--tg-gold-light)] hover:underline"
              >
                Book <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <ul className="mt-3 space-y-2">
              {(bookings ?? []).length === 0 && (
                <li className="rounded-xl border border-dashed border-[rgba(212,168,69,0.25)] px-3 py-5 text-center text-sm text-muted-foreground">
                  No upcoming bookings yet.
                </li>
              )}
              {(bookings ?? []).map((b) => {
                const court = (Array.isArray(b.courts) ? b.courts[0] : b.courts) as
                  | { name: string }
                  | null;
                return (
                  <li
                    key={b.id}
                    className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-sm"
                  >
                    <div>
                      <p className="font-medium">{court?.name ?? "Court"}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(b.starts_at)}
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {b.type.replace("_", " ")}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="glass rounded-2xl p-4 sm:p-5">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <Bell className="h-4 w-4 text-[var(--tg-gold-light)]" />
              Notifications
            </h2>
            <ul className="mt-3 space-y-2">
              {(notifications ?? []).length === 0 && (
                <li className="rounded-xl border border-dashed border-[rgba(212,168,69,0.25)] px-3 py-5 text-center text-sm text-muted-foreground">
                  You&apos;re all caught up.
                </li>
              )}
              {(notifications ?? []).map((n) => (
                <li
                  key={n.id}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-sm"
                >
                  <p className="font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.body}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </ErrorBoundary>
  );
}
