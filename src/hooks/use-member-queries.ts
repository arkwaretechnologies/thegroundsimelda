"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useWallet(profileId?: string) {
  return useQuery({
    queryKey: ["wallet", profileId],
    enabled: Boolean(profileId),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("profile_id", profileId!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useMembership(profileId?: string) {
  return useQuery({
    queryKey: ["membership", profileId],
    enabled: Boolean(profileId),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("memberships")
        .select("*, membership_plans(name, interval)")
        .eq("profile_id", profileId!)
        .eq("status", "active")
        .order("ends_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useBookings(profileId?: string) {
  return useQuery({
    queryKey: ["bookings", profileId],
    enabled: Boolean(profileId),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("bookings")
        .select("*, courts(name)")
        .eq("profile_id", profileId!)
        .order("starts_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export type WalletTopUpSession = {
  topup_id: string;
  payment_intent_id: string;
  qr_image_url: string;
  expires_at: string;
};

export function useWalletTopUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (amount_cents: number): Promise<WalletTopUpSession> => {
      const res = await fetch("/api/wallet/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount_cents }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Top-up failed");
      return data as WalletTopUpSession;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
}
