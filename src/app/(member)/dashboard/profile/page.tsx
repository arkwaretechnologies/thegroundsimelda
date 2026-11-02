import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/glass";
import {
  ProfilePanel,
  type ProfileFormValues,
} from "@/components/dashboard/profile-panel";
import type { Gender, SkillLevel } from "@/lib/types/database";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, address, club, gender, skill_level, avatar_url")
    .eq("id", user!.id)
    .maybeSingle();

  const initial: ProfileFormValues = {
    full_name: profile?.full_name ?? null,
    phone: profile?.phone ?? null,
    address: profile?.address ?? null,
    club: profile?.club ?? null,
    gender: (profile?.gender as Gender | null) ?? null,
    skill_level: (profile?.skill_level as SkillLevel | null) ?? null,
    avatar_url: profile?.avatar_url ?? null,
  };

  return (
    <div>
      <PageHeader
        title="Profile"
        description="Your name, contact details, and the club you’ve joined."
      />
      <ProfilePanel initial={initial} />
    </div>
  );
}
