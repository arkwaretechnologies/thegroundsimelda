import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageHeader, StatPill, WalletBadge } from "@/components/shared/glass";
import { Badge } from "@/components/ui/badge";
import { TopUpButton } from "@/components/dashboard/top-up-button";
import { ErrorBoundary } from "@/components/shared/error-boundary";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: wallet }, { data: membership }, { data: bookings }, { data: notifications }, { data: attendance }] =
    await Promise.all([
      supabase.from("wallets").select("*").eq("profile_id", user!.id).maybeSingle(),
      supabase
        .from("memberships")
        .select("*, membership_plans(name, interval)")
        .eq("profile_id", user!.id)
        .eq("status", "active")
        .order("ends_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("bookings")
        .select("*, courts(name)")
        .eq("profile_id", user!.id)
        .eq("status", "confirmed")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at")
        .limit(5),
      supabase
        .from("notifications")
        .select("*")
        .eq("profile_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("attendance_logs")
        .select("*")
        .eq("profile_id", user!.id)
        .order("scanned_at", { ascending: false })
        .limit(5),
    ]);

  const planRaw = membership?.membership_plans;
  const plan = (
    Array.isArray(planRaw) ? planRaw[0] : planRaw
  ) as { name: string; interval: string } | null | undefined;

  return (
    <ErrorBoundary>
      <div className="w-full">
        <PageHeader
          title="Your vibe"
          description="Wallet, membership, and upcoming play at a glance."
          action={<TopUpButton />}
        />

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <WalletBadge balanceCents={wallet?.balance_cents ?? 0} />
          {membership ? (
            <Badge variant="success">
              {plan?.name ?? "Active"} · ends {formatDate(membership.ends_at)}
            </Badge>
          ) : (
            <Badge variant="warning">No active membership</Badge>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <StatPill
            label="Balance"
            value={formatCurrency(wallet?.balance_cents ?? 0)}
          />
          <StatPill label="Bookings" value={bookings?.length ?? 0} />
          <StatPill label="Check-ins" value={attendance?.length ?? 0} />
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <section className="glass rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-pv-ink">Upcoming bookings</h2>
            <ul className="mt-2.5 space-y-2">
              {(bookings ?? []).length === 0 && (
                <li className="text-sm text-muted-foreground">
                  No upcoming bookings.
                </li>
              )}
              {(bookings ?? []).map((b) => {
                const court = (Array.isArray(b.courts) ? b.courts[0] : b.courts) as
                  | { name: string }
                  | null;
                return (
                  <li
                    key={b.id}
                    className="flex items-center justify-between rounded-xl bg-white/60 px-3 py-2 text-sm"
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

          <section className="glass rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-pv-ink">Notifications</h2>
            <ul className="mt-2.5 space-y-2">
              {(notifications ?? []).length === 0 && (
                <li className="text-sm text-muted-foreground">
                  You&apos;re all caught up.
                </li>
              )}
              {(notifications ?? []).map((n) => (
                <li
                  key={n.id}
                  className="rounded-xl bg-white/60 px-3 py-2 text-sm"
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
