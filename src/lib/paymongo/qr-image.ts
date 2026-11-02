/** Normalize PayMongo QR image payloads for use in img src. */
export function normalizeQrImageSrc(url: string): string {
  if (url.startsWith("data:")) return url;
  if (url.startsWith("http")) return url;
  return `data:image/png;base64,${url}`;
}
