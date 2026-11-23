export type FeaturedTournament = {
  url: string;
  name: string;
  startsAtLabel: string;
  venue: string;
  entriesCloseLabel: string;
  feeSummary: string;
  statusLine: string;
  coverImageUrl?: string;
};

const DEFAULT_URL =
  "https://www.regmytourna.com/tournaments/the-grounds-pickleball-opening-tournament";

const REGMYTOURNA_OPENING: FeaturedTournament = {
  url:
    process.env.NEXT_PUBLIC_FEATURED_TOURNAMENT_URL?.trim() || DEFAULT_URL,
  name: "The Grounds Pickleball Opening Tournament",
  startsAtLabel: "Nov 28, 2026",
  venue: "The Grounds Imelda, San Jose, Imelda, Zamboanga Sibugay",
  entriesCloseLabel: "Nov 27, 2026, 11:59 AM",
  feeSummary: "₱500 – ₱1,000 per entry (paid online)",
  statusLine:
    "Registration has not opened yet on RegMyTourna — check back closer to the date.",
  coverImageUrl:
    "https://bfnnsqxlngsrnyqxbrpb.supabase.co/storage/v1/object/public/tournament-covers/ee44c901-c496-49a9-973f-9cd09600b5f6/24f38eaf-da7e-48e4-a9c3-05b486789ecb.webp",
};

/** Featured external tournament on the marketing homepage (RegMyTourna). */
export function getFeaturedTournament(): FeaturedTournament | null {
  if (!REGMYTOURNA_OPENING.url) return null;
  return REGMYTOURNA_OPENING;
}