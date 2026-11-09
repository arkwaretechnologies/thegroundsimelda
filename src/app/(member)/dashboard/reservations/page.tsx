import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/glass";
import { Button } from "@/components/ui/button";
import { isStaffRole } from "@/lib/staff";
import { resolveMemberBranchId } from "@/lib/branch";
import { getAdminReservationsUrl } from "@/lib/admin-app";
import type { UserRole } from "@/lib/types/database";

export const metadata = { title: "Reservations" };

export default async function ReservationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!isStaffRole(profile?.role as UserRole | undefined)) {
    redirect("/dashboard");
  }

  await resolveMemberBranchId(supabase, user.id);

  const adminUrl = getAdminReservationsUrl();
  if (adminUrl) {
    redirect(adminUrl);
  }

  return (
    <div>
      <PageHeader
        title="Reservations"
        description="Closures and walk-ins are managed in The Grounds Admin."
      />
      <div className="glass rounded-2xl border border-white/[0.06] p-6">
        <p className="text-sm text-muted-foreground">
          Set{" "}
          <code className="text-xs">NEXT_PUBLIC_ADMIN_APP_URL</code> in your
          environment to open Admin Reservations from the member app nav. Staff
          should use Admin for court closures, walk-in holds, and operating
          hours (Settings → Pricing).
        </p>
        <Button asChild className="mt-4" variant="secondary" disabled>
          <Link href="/dashboard">Admin URL not configured</Link>
        </Button>
      </div>
    </div>
  );
}
