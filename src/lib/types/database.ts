export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "member" | "staff" | "admin";
export type PlanInterval = "daily" | "weekly" | "monthly" | "annual" | "vip";
export type MembershipStatus = "active" | "expired" | "cancelled" | "pending";
export type WalletTxType = "topup" | "payment" | "refund" | "adjustment";
export type WalletTopupStatus = "pending" | "paid" | "failed" | "expired";
export type CourtStatus = "available" | "occupied" | "maintenance";
export type BookingType = "exclusive" | "open_play";
export type BookingStatus = "confirmed" | "cancelled" | "completed" | "no_show";
export type OpenPlaySessionStatus = "scheduled" | "open" | "closed";
export type OpenPlayRegistrationStatus =
  | "registered"
  | "checked_in"
  | "cancelled";
export type QueueStatus = "waiting" | "playing" | "done" | "left";
export type MatchStatus = "assigned" | "active" | "completed";
export type MatchTeam = "a" | "b";
export type AttendanceEvent = "check_in" | "open_play" | "checkout";
export type SkillLevel =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "professional";
export type Gender = "male" | "female";

export const DEFAULT_BRANCH_ID =
  process.env.NEXT_PUBLIC_DEFAULT_BRANCH_ID ??
  "39ff10ae-f2c4-42e8-9548-54c25a8af434";

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  club: string | null;
  avatar_url: string | null;
  role: UserRole;
  branch_id: string | null;
  gender: Gender | null;
  skill_level: SkillLevel | null;
  elo_rating: number;
  created_at: string;
  updated_at: string;
};

export type Wallet = {
  id: string;
  profile_id: string;
  balance_cents: number;
  currency: string;
  updated_at: string;
};

export type MembershipPlan = {
  id: string;
  branch_id: string;
  name: string;
  interval: PlanInterval;
  price_cents: number;
  open_play_fee_cents: number;
  duration_days: number;
  perks: Json;
  active: boolean;
  created_at: string;
};

export type Membership = {
  id: string;
  profile_id: string;
  plan_id: string;
  branch_id: string;
  status: MembershipStatus;
  starts_at: string;
  ends_at: string;
  created_at: string;
};

export type Court = {
  id: string;
  branch_id: string;
  name: string;
  status: CourtStatus;
  sort_order: number;
  created_at: string;
};

export type Booking = {
  id: string;
  branch_id: string;
  court_id: string;
  profile_id: string;
  type: BookingType;
  starts_at: string;
  ends_at: string;
  status: BookingStatus;
  fee_cents: number;
  created_at: string;
};

/** Kept for supabase gen types regeneration later */
export type Database = Record<string, never>;
