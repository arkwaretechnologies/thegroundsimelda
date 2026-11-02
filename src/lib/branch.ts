import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_BRANCH_ID } from "@/lib/types/database";

/** Member branch: profile override, then env default. */
export async function resolveMemberBranchId(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("branch_id")
    .eq("id", userId)
    .maybeSingle();

  return profile?.branch_id ?? DEFAULT_BRANCH_ID;
}
