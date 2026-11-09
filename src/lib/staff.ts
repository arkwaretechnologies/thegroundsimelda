import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserRole } from "@/lib/types/database";

export function isStaffRole(role: UserRole | string | null | undefined): boolean {
  return role === "staff" || role === "admin";
}

export async function getProfileRole(
  supabase: SupabaseClient,
  userId: string
): Promise<{ role: UserRole; branch_id: string | null } | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role, branch_id")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return {
    role: data.role as UserRole,
    branch_id: data.branch_id,
  };
}

export async function requireStaff(
  supabase: SupabaseClient,
  userId: string
): Promise<
  | { ok: true; role: UserRole; branch_id: string | null }
  | { ok: false; status: 403 }
> {
  const profile = await getProfileRole(supabase, userId);
  if (!profile || !isStaffRole(profile.role)) {
    return { ok: false, status: 403 };
  }
  return { ok: true, role: profile.role, branch_id: profile.branch_id };
}
