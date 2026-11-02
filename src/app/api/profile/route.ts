import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { skillLevelSchema } from "@/lib/skill-level";
import { genderSchema } from "@/lib/gender";

const PROFILE_SELECT =
  "id, full_name, phone, address, club, avatar_url, role, branch_id, gender, skill_level, elo_rating, created_at, updated_at";

const updateSchema = z.object({
  full_name: z.string().trim().min(1).max(120).nullable().optional(),
  phone: z.string().trim().max(32).nullable().optional(),
  address: z.string().trim().max(500).nullable().optional(),
  club: z.string().trim().max(120).nullable().optional(),
  gender: genderSchema,
  skill_level: skillLevelSchema,
});

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({ profile });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid profile" }, { status: 400 });
  }

  const body = parsed.data;
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (body.full_name !== undefined) {
    patch.full_name = body.full_name ? body.full_name : null;
  }
  if (body.phone !== undefined) {
    patch.phone = body.phone ? body.phone : null;
  }
  if (body.address !== undefined) {
    patch.address = body.address ? body.address : null;
  }
  if (body.club !== undefined) {
    patch.club = body.club ? body.club : null;
  }
  if (body.gender !== undefined) {
    patch.gender = body.gender ?? null;
  }
  if (body.skill_level !== undefined) {
    patch.skill_level = body.skill_level ?? null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", user.id)
    .select(PROFILE_SELECT)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (!data) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({ profile: data });
}
