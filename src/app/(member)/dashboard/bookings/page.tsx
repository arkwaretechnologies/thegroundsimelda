import { createClient } from "@/lib/supabase/server";
import { resolveMemberBranchId } from "@/lib/branch";
import { PageHeader } from "@/components/shared/glass";
import { BookingPanel } from "@/components/dashboard/booking-panel";
import { fetchCourtScheduleSnapshot } from "@/lib/booking/fetch-court-schedule";

export const metadata = { title: "Bookings" };

export default async function BookingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const branchId = await resolveMemberBranchId(supabase, user!.id);

  const snapshot = await fetchCourtScheduleSnapshot(supabase, branchId);

  const exclusiveCourts = snapshot.courts.filter(
    (c) => (c.status ?? "available") === "available"
  );

  const [{ data: bookings }, { data: wallet }, { data: myRegistrations }] =
    await Promise.all([
      supabase
        .from("bookings")
        .select("id, starts_at, ends_at, type, fee_cents, courts(name)")
        .eq("profile_id", user!.id)
        .order("starts_at", { ascending: false })
        .limit(20),
      supabase
        .from("wallets")
        .select("balance_cents")
        .eq("profile_id", user!.id)
        .maybeSingle(),
      supabase
        .from("open_play_registrations")
        .select(
          "id, status, fee_cents, session_id, open_play_sessions(title, starts_at)"
        )
        .eq("profile_id", user!.id)
        .neq("status", "cancelled")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  return (
    <div>
      <PageHeader
        title="Book a court"
        description="Reserve exclusive time or register for Open Play schedules."
      />
      <BookingPanel
        exclusiveCourts={exclusiveCourts.map((c) => ({
          id: c.id,
          name: c.name,
          status: c.status ?? "available",
        }))}
        courtOccupancy={snapshot.bookings.map((row) => ({
          court_id: row.court_id!,
          starts_at: row.starts_at,
          ends_at: row.ends_at,
        }))}
        courtBlocks={snapshot.blocks.map((row) => ({
          court_id: row.court_id!,
          starts_at: row.starts_at,
          ends_at: row.ends_at,
        }))}
        bookings={(bookings ?? []).map((b) => ({
          id: b.id,
          starts_at: b.starts_at,
          ends_at: b.ends_at,
          type: b.type,
          fee_cents: b.fee_cents,
          courts: (Array.isArray(b.courts) ? b.courts[0] : b.courts) as
            | { name: string }
            | null,
        }))}
        registrations={(myRegistrations ?? []).map((r) => {
          const session = (
            Array.isArray(r.open_play_sessions)
              ? r.open_play_sessions[0]
              : r.open_play_sessions
          ) as { title: string | null; starts_at: string } | null;
          return {
            id: r.id,
            status: r.status,
            fee_cents: r.fee_cents,
            session_title: session?.title ?? "Open Play",
            starts_at: session?.starts_at ?? new Date().toISOString(),
          };
        })}
        exclusiveFeeCents={snapshot.exclusiveFeeCents}
        openPlayFeeCents={snapshot.openPlayFeeCents}
        exclusiveOpenHour={snapshot.openHour}
        exclusiveCloseHour={snapshot.closeHour}
        walletBalanceCents={wallet?.balance_cents ?? 0}
      />
    </div>
  );
}
