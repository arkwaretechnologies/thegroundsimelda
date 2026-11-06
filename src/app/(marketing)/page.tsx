import { LandingPage } from "@/components/marketing/landing-page";
import {
  getPublicSchedule,
  getPublicTournaments,
} from "@/lib/marketing/public-schedule";

/** Refresh availability at most once a minute. */
export const revalidate = 60;

export default async function Page() {
  const [schedule, tournaments] = await Promise.all([
    getPublicSchedule(),
    getPublicTournaments(),
  ]);
  return <LandingPage schedule={schedule} tournaments={tournaments} />;
}
