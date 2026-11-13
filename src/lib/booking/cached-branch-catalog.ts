import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export type CourtRef = { id: string; name: string; status?: string };

export type CachedBranchSettings = {
  exclusive_open_hour: number | null;
  exclusive_close_hour: number | null;
  exclusive_court_fee_cents: number | null;
  default_open_play_fee_cents: number | null;
};

async function loadExclusiveCourts(branchId: string): Promise<CourtRef[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("courts")
    .select("id, name, status")
    .eq("branch_id", branchId)
    .eq("is_exclusive", true)
    .eq("status", "available")
    .order("sort_order");
  return (data ?? []) as CourtRef[];
}

async function loadBranchSettings(
  branchId: string
): Promise<CachedBranchSettings | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("branch_settings")
    .select(
      "exclusive_open_hour, exclusive_close_hour, exclusive_court_fee_cents, default_open_play_fee_cents"
    )
    .eq("branch_id", branchId)
    .maybeSingle();
  return data;
}

export const getCachedExclusiveCourts = unstable_cache(
  loadExclusiveCourts,
  ["exclusive-courts"],
  { revalidate: 60 }
);

export const getCachedBranchSettings = unstable_cache(
  loadBranchSettings,
  ["branch-settings"],
  { revalidate: 60 }
);
