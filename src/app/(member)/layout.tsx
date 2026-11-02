import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MemberShell } from "@/components/dashboard/member-shell";

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const avatarFromAuth =
    typeof user.user_metadata?.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : typeof user.user_metadata?.picture === "string"
        ? user.user_metadata.picture
        : null;

  return (
    <MemberShell
      name={profile?.full_name ?? user.email}
      avatarUrl={profile?.avatar_url ?? avatarFromAuth}
      email={user.email}
    >
      {children}
    </MemberShell>
  );
}
