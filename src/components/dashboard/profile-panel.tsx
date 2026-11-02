"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GENDER_LABELS,
  GENDER_NONE,
  GENDERS,
  genderFromSelect,
  type Gender,
} from "@/lib/gender";
import {
  SKILL_LEVEL_LABELS,
  SKILL_LEVEL_NONE,
  SKILL_LEVELS,
  skillLevelFromSelect,
  type SkillLevel,
} from "@/lib/skill-level";

export type ProfileFormValues = {
  full_name: string | null;
  phone: string | null;
  address: string | null;
  club: string | null;
  gender: Gender | null;
  skill_level: SkillLevel | null;
  avatar_url: string | null;
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return (name.trim() || "M").slice(0, 2).toUpperCase();
}

export function ProfilePanel({ initial }: { initial: ProfileFormValues }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState(initial.full_name ?? "");
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [address, setAddress] = useState(initial.address ?? "");
  const [club, setClub] = useState(initial.club ?? "");
  const [gender, setGender] = useState(initial.gender ?? GENDER_NONE);
  const [skillLevel, setSkillLevel] = useState(
    initial.skill_level ?? SKILL_LEVEL_NONE
  );
  const [avatarUrl, setAvatarUrl] = useState(initial.avatar_url ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not upload photo");
      setAvatarUrl(data.avatar_url as string);
      toast.success("Profile photo updated");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not upload photo");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!fullName.trim()) {
      toast.error("Full name is required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          address: address.trim() || null,
          club: club.trim() || null,
          gender: genderFromSelect(gender),
          skill_level: skillLevelFromSelect(skillLevel),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save profile");
      toast.success("Profile updated");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save profile");
    } finally {
      setSaving(false);
    }
  }

  const initials = getInitials(fullName || "Member");

  return (
    <div className="glass w-full space-y-4 rounded-2xl p-4">
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20 border-2 border-white/80 shadow-md">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={fullName || "Member"} /> : null}
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 space-y-2">
          <Label htmlFor="profile-avatar">Profile photo</Label>
          <input
            ref={fileInputRef}
            id="profile-avatar"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={onAvatarChange}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? "Uploading…" : "Change photo"}
          </Button>
          <p className="text-xs text-muted-foreground">
            JPEG, PNG, WebP, or GIF up to 2 MB
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="profile-name">Full name</Label>
        <Input
          id="profile-name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Your name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="profile-address">Address</Label>
        <Input
          id="profile-address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Home or mailing address"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="profile-phone">Contact no.</Label>
        <Input
          id="profile-phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="09XXXXXXXXX"
        />
      </div>

      <div className="space-y-2">
        <Label>Gender</Label>
        <Select value={gender} onValueChange={setGender}>
          <SelectTrigger>
            <SelectValue placeholder="Prefer not to say" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={GENDER_NONE}>Prefer not to say</SelectItem>
            {GENDERS.map((g) => (
              <SelectItem key={g} value={g}>
                {GENDER_LABELS[g]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Skill level</Label>
        <Select value={skillLevel} onValueChange={setSkillLevel}>
          <SelectTrigger>
            <SelectValue placeholder="Prefer not to say" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SKILL_LEVEL_NONE}>Prefer not to say</SelectItem>
            {SKILL_LEVELS.map((level) => (
              <SelectItem key={level} value={level}>
                {SKILL_LEVEL_LABELS[level]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="profile-club">Club</Label>
        <Input
          id="profile-club"
          value={club}
          onChange={(e) => setClub(e.target.value)}
          placeholder="Club you’ve joined"
        />
      </div>

      <Button onClick={save} disabled={saving} className="w-full">
        {saving ? "Saving…" : "Save profile"}
      </Button>
    </div>
  );
}
