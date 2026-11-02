import { z } from "zod";

export const GENDERS = ["male", "female"] as const;

export type Gender = (typeof GENDERS)[number];

export const GENDER_LABELS: Record<Gender, string> = {
  male: "Male",
  female: "Female",
};

/** Sentinel for Select “Prefer not to say” (maps to null / omit). */
export const GENDER_NONE = "none";

export const genderSchema = z.enum(GENDERS).optional().nullable();

export function genderFromSelect(
  value: string | null | undefined
): Gender | null {
  if (!value || value === GENDER_NONE) return null;
  return GENDERS.includes(value as Gender) ? (value as Gender) : null;
}
