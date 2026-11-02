import { createHmac, timingSafeEqual } from "crypto";

const PAYMONGO_API = "https://api.paymongo.com/v1";
const WEBHOOK_TOLERANCE_SEC = 300;

type AuthMode = "secret" | "public";

function getSecretKey(): string {
  const key = process.env.PAYMONGO_SECRET_KEY;
  if (!key) throw new Error("PAYMONGO_SECRET_KEY is not configured");
  return key;
}

function getPublicKey(): string {
  const key = process.env.PAYMONGO_PUBLIC_KEY;
  if (!key) throw new Error("PAYMONGO_PUBLIC_KEY is not configured");
  return key;
}

function authHeader(mode: AuthMode): string {
  const key = mode === "public" ? getPublicKey() : getSecretKey();
  const encoded = Buffer.from(`${key}:`).toString("base64");
  return `Basic ${encoded}`;
}

async function paymongoFetch<T>(
  path: string,
  init?: RequestInit,
  mode: AuthMode = "secret"
): Promise<T> {
  const res = await fetch(`${PAYMONGO_API}${path}`, {
    ...init,
    headers: {
      Authorization: authHeader(mode),
      "Content-Type": "application/json",
      Accept: "application/json",
      ...init?.headers,
    },
  });

  const json = (await res.json()) as T & { errors?: { detail?: string }[] };

  if (!res.ok) {
    const detail =
      json.errors?.[0]?.detail ?? `PayMongo request failed (${res.status})`;
    throw new Error(detail);
  }

  return json;
}

export type PaymentIntentAttributes = {
  amount: number;
  currency: string;
  status: string;
  client_key: string;
  next_action?: {
    code?: { image_url?: string; test_url?: string };
  } | null;
};

type PaymongoResource<T> = {
  data: {
    id: string;
    type: string;
    attributes: T;
  };
};

export async function createPaymentIntent(params: {
  amountCents: number;
  description: string;
  metadata: Record<string, string>;
}): Promise<PaymongoResource<PaymentIntentAttributes>> {
  return paymongoFetch(
    "/payment_intents",
    {
      method: "POST",
      body: JSON.stringify({
        data: {
          attributes: {
            amount: params.amountCents,
            currency: "PHP",
            payment_method_allowed: ["qrph"],
            description: params.description,
            metadata: params.metadata,
          },
        },
      }),
    },
    "secret"
  );
}

export async function createQrphPaymentMethod() {
  return paymongoFetch<{ data: { id: string } }>(
    "/payment_methods",
    {
      method: "POST",
      body: JSON.stringify({
        data: {
          attributes: {
            type: "qrph",
          },
        },
      }),
    },
    "public"
  );
}

export async function attachPaymentIntent(
  paymentIntentId: string,
  paymentMethodId: string,
  clientKey: string
): Promise<PaymongoResource<PaymentIntentAttributes>> {
  return paymongoFetch(
    `/payment_intents/${paymentIntentId}/attach`,
    {
      method: "POST",
      body: JSON.stringify({
        data: {
          attributes: {
            payment_method: paymentMethodId,
            client_key: clientKey,
          },
        },
      }),
    },
    "public"
  );
}

export async function getPaymentIntent(
  paymentIntentId: string
): Promise<PaymongoResource<PaymentIntentAttributes>> {
  return paymongoFetch(
    `/payment_intents/${paymentIntentId}`,
    {
      method: "GET",
    },
    "secret"
  );
}

export async function createQrPhTopUpIntent(params: {
  amountCents: number;
  description: string;
  metadata: Record<string, string>;
}): Promise<{
  paymentIntentId: string;
  qrImageUrl: string;
  testUrl: string | null;
}> {
  const intentRes = await createPaymentIntent(params);
  const paymentIntentId = intentRes.data.id;
  const clientKey = intentRes.data.attributes.client_key;

  const methodRes = await createQrphPaymentMethod();
  const attached = await attachPaymentIntent(
    paymentIntentId,
    methodRes.data.id,
    clientKey
  );

  const code = attached.data.attributes.next_action?.code;
  const qrImageUrl = code?.image_url ?? "";
  if (!qrImageUrl) {
    throw new Error("Could not generate QR code");
  }

  return {
    paymentIntentId,
    qrImageUrl,
    testUrl: code?.test_url ?? null,
  };
}

export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  const secret = process.env.PAYMONGO_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;

  const parts = signatureHeader.split(",").reduce(
    (acc, part) => {
      const [k, v] = part.split("=");
      if (k && v) acc[k.trim()] = v.trim();
      return acc;
    },
    {} as Record<string, string>
  );

  const timestamp = parts.t;
  const signature = parts.li || parts.te || parts.v1;
  if (!timestamp || !signature) return false;

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  const ageSec = Math.abs(Math.floor(Date.now() / 1000) - ts);
  if (ageSec > WEBHOOK_TOLERANCE_SEC) return false;

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  try {
    if (expected.length !== signature.length) return false;
    return timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expected, "hex")
    );
  } catch {
    return false;
  }
}

export type PaymongoWebhookEvent = {
  data: {
    id: string;
    attributes: {
      type: string;
      data: {
        id: string;
        type: string;
        attributes: {
          amount?: number;
          status?: string;
          payment_intent_id?: string;
        };
      };
    };
  };
};
