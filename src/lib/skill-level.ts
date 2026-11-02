import { z } from "zod";

export const SKILL_LEVELS = [
  "beginner",
  "intermediate",
  "advanced",
  "professional",
] as const;

export type SkillLevel = (typeof SKILL_LEVELS)[number];

export const SKILL_LEVEL_LABELS: Record<SkillLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  professional: "Professional",
};

/** Sentinel for Select “Prefer not to say” (maps to null / omit). */
export const SKILL_LEVEL_NONE = "none";

export const skillLevelSchema = z
  .enum(SKILL_LEVELS)
  .optional()
  .nullable();

export function skillLevelFromSelect(
  value: string | null | undefined
): SkillLevel | null {
  if (!value || value === SKILL_LEVEL_NONE) return null;
  return SKILL_LEVELS.includes(value as SkillLevel)
    ? (value as SkillLevel)
    : null;
}
