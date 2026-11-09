/** The Grounds Admin app (closures, walk-ins, pricing hours). */
const ADMIN_APP_URL = process.env.NEXT_PUBLIC_ADMIN_APP_URL?.trim();

export function getAdminAppBaseUrl(): string | null {
  if (!ADMIN_APP_URL) return null;
  return ADMIN_APP_URL.replace(/\/$/, "");
}

export function getAdminReservationsUrl(): string | null {
  const base = getAdminAppBaseUrl();
  if (!base) return null;
  return `${base}/reservations`;
}
