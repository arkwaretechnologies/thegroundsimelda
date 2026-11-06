import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_BRANCH_ID } from "@/lib/types/database";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Use a JPEG, PNG, WebP, or GIF image" },
      { status: 400 }
    );
  }

  if (file.size <= 0 || file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Image must be under 2 MB" },
      { status: 400 }
    );
  }

  const ext = EXT_BY_TYPE[file.type] ?? "jpg";
  const path = `${user.id}/avatar.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
      cacheControl: "3600",
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 400 });
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  // Bust CDN/browser cache after replace
  const avatarUrl = `${publicUrl}?v=${Date.now()}`;

  const now = new Date().toISOString();
  const { data: updatedRows, error: updateError } = await supabase
    .from("profiles")
    .update({
      avatar_url: avatarUrl,
      updated_at: now,
    })
    .eq("id", user.id)
    .select("id");

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  if (!updatedRows?.length) {
    const { error: insertError } = await supabase.from("profiles").insert({
      id: user.id,
      branch_id: DEFAULT_BRANCH_ID,
      role: "member",
      elo_rating: 0,
      avatar_url: avatarUrl,
      full_name: user.user_metadata?.full_name ?? user.email ?? null,
      created_at: now,
      updated_at: now,
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }
  }

  return NextResponse.json({ avatar_url: avatarUrl });
}
