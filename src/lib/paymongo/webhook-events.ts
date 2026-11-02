export function extractPaymentIntentId(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as Record<string, unknown>;

  const data = root.data;
  if (data && typeof data === "object") {
    const dataObj = data as Record<string, unknown>;

    if (typeof dataObj.id === "string" && dataObj.id.startsWith("pi_")) {
      return dataObj.id;
    }

    const attributes = dataObj.attributes;
    if (attributes && typeof attributes === "object") {
      const attrs = attributes as Record<string, unknown>;
      const nested = attrs.data;
      if (nested && typeof nested === "object") {
        const nestedObj = nested as Record<string, unknown>;
        const nestedId = nestedObj.id;
        if (typeof nestedId === "string" && nestedId.startsWith("pi_")) {
          return nestedId;
        }
        const nestedAttrs = nestedObj.attributes;
        if (nestedAttrs && typeof nestedAttrs === "object") {
          const pi = (nestedAttrs as Record<string, unknown>)
            .payment_intent_id;
          if (typeof pi === "string" && pi.startsWith("pi_")) {
            return pi;
          }
        }
      }
    }
  }

  if (typeof root.id === "string" && root.id.startsWith("pi_")) {
    return root.id;
  }

  return null;
}

export function extractWebhookEventType(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const data = (payload as Record<string, unknown>).data;
  if (!data || typeof data !== "object") return null;
  const attributes = (data as Record<string, unknown>).attributes;
  if (!attributes || typeof attributes !== "object") return null;
  const type = (attributes as Record<string, unknown>).type;
  return typeof type === "string" ? type : null;
}

export function isPaymentSuccessEvent(eventType: string | null): boolean {
  if (!eventType) return false;
  const normalized = eventType.toLowerCase();
  return (
    normalized === "payment.paid" ||
    normalized === "payment_intent.succeeded" ||
    (normalized.includes("payment_intent") && normalized.includes("succeed"))
  );
}

export function extractPaymentIdFromEvent(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const data = (payload as Record<string, unknown>).data;
  if (!data || typeof data !== "object") return null;
  const attributes = (data as Record<string, unknown>).attributes;
  if (!attributes || typeof attributes !== "object") return null;
  const nested = (attributes as Record<string, unknown>).data;
  if (!nested || typeof nested !== "object") return null;
  const nestedObj = nested as Record<string, unknown>;
  if (nestedObj.type === "payment" && typeof nestedObj.id === "string") {
    return nestedObj.id;
  }
  return null;
}
