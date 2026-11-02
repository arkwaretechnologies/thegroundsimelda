/** PayMongo QR Ph validity (seconds). */
export const QR_EXPIRY_SECONDS = 600;

export type WalletTopupStatus = "pending" | "paid" | "failed" | "expired";

/** Caps legacy 30-minute rows to the current 10-minute policy. */
export function effectiveQrExpiresAt(
  createdAt: string,
  qrExpiresAt: string | null
): string {
  const capMs =
    new Date(createdAt).getTime() + QR_EXPIRY_SECONDS * 1000;
  if (!qrExpiresAt) {
    return new Date(capMs).toISOString();
  }
  const storedMs = new Date(qrExpiresAt).getTime();
  return new Date(Math.min(storedMs, capMs)).toISOString();
}

export function isTopupExpired(
  status: string,
  qrExpiresAt: string | null,
  createdAt?: string | null
): boolean {
  if (status === "expired") return true;
  if (status !== "pending") return false;
  const effective =
    createdAt != null
      ? effectiveQrExpiresAt(createdAt, qrExpiresAt)
      : qrExpiresAt;
  if (!effective) return false;
  return Date.now() >= new Date(effective).getTime();
}

export function effectiveTopupStatus(
  status: string,
  qrExpiresAt: string | null,
  createdAt?: string | null
): WalletTopupStatus {
  if (isTopupExpired(status, qrExpiresAt, createdAt)) return "expired";
  return status as WalletTopupStatus;
}
