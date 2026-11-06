import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/shared/glass";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { WalletActivityList } from "@/components/dashboard/wallet-activity-list";

export const metadata = { title: "History" };

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: attendance }, { data: bookings }, { data: wallet }] =
    await Promise.all([
      supabase
        .from("attendance_logs")
        .select("*")
        .eq("profile_id", user!.id)
        .order("scanned_at", { ascending: false })
        .limit(40),
      supabase
        .from("bookings")
        .select("*, courts(name)")
        .eq("profile_id", user!.id)
        .order("starts_at", { ascending: false })
        .limit(40),
      supabase.from("wallets").select("id").eq("profile_id", user!.id).maybeSingle(),
    ]);

  const { data: txs } = wallet
    ? await supabase
        .from("wallet_transactions")
        .select("id, type, amount_cents, reference, created_at")
        .eq("wallet_id", wallet.id)
        .order("created_at", { ascending: false })
        .limit(40)
    : { data: [] };

  const { data: topups } = await supabase
    .from("wallet_topups")
    .select("id, amount_cents, status, qr_expires_at, created_at")
    .eq("profile_id", user!.id)
    .neq("status", "paid")
    .order("created_at", { ascending: false })
    .limit(40);

  return (
    <div>
      <PageHeader
        title="History"
        description="Attendance, bookings, and wallet activity."
      />
      <Tabs defaultValue="attendance">
        <TabsList>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="wallet">Wallet</TabsTrigger>
        </TabsList>
        <TabsContent value="attendance">
          <div className="glass rounded-2xl p-4">
            <ul className="space-y-3">
              {(attendance ?? []).map((a) => (
                <li
                  key={a.id}
                  className="flex justify-between rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm"
                >
                  <span className="capitalize">{a.event.replace("_", " ")}</span>
                  <span className="text-muted-foreground">
                    {formatDate(a.scanned_at)}
                  </span>
                </li>
              ))}
              {(attendance ?? []).length === 0 && (
                <li className="text-sm text-muted-foreground">No attendance yet.</li>
              )}
            </ul>
          </div>
        </TabsContent>
        <TabsContent value="bookings">
          <div className="glass rounded-2xl p-4">
            <ul className="space-y-3">
              {(bookings ?? []).map((b) => {
                const court = (Array.isArray(b.courts) ? b.courts[0] : b.courts) as
                  | { name: string }
                  | null;
                return (
                  <li
                    key={b.id}
                    className="flex justify-between rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{court?.name}</p>
                      <p className="text-muted-foreground">
                        {formatDate(b.starts_at)}
                      </p>
                    </div>
                    <Badge variant="outline">{b.status}</Badge>
                  </li>
                );
              })}
            </ul>
          </div>
        </TabsContent>
        <TabsContent value="wallet">
          <div className="glass rounded-2xl p-4">
            <WalletActivityList
              transactions={txs ?? []}
              topups={topups ?? []}
              variant="history"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
