# Setup

## 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Copy **Project URL**, **anon key**, and **service_role key** into `.env.local`.
3. Apply your schema migrations (from the shared backend), then run The Grounds seed:

   - `supabase/migrations/20261102000001_the_grounds_seed.sql`
   - `supabase/migrations/20261102070000_member_api_grants.sql`

4. Confirm seed branch id matches env:

```
NEXT_PUBLIC_DEFAULT_BRANCH_ID=39ff10ae-f2c4-42e8-9548-54c25a8af434
```

Also apply later migrations in order (including profile avatars / public `avatars` storage bucket and RLS). Confirm in Studio → Storage that bucket `avatars` exists and is public.

## 2. Auth

### Email / password
Enable Email provider in Authentication → Providers.

### Google
1. Enable Google provider with OAuth client ID/secret.
2. Add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://<your-vercel-domain>/auth/callback`

## 3. Local app

```bash
npm install
cp .env.example .env.local
# fill keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up, then open `/dashboard`.

## 4. RFID scan test

With a card assigned in the admin project (or via SQL into `rfid_cards`), an open Open Play session, and wallet balance:

```bash
curl -X POST http://localhost:3000/api/rfid/scan \
  -H "Content-Type: application/json" \
  -H "x-rfid-api-key: $RFID_API_KEY" \
  -d '{"card_uid":"H14-CARD-001","branch_id":"39ff10ae-f2c4-42e8-9548-54c25a8af434"}'
```

## 5. PayMongo (wallet QR top-up)

1. Copy **Secret** and **Public** keys into `.env.local` (`PAYMONGO_SECRET_KEY`, `PAYMONGO_PUBLIC_KEY`).
2. Register a webhook in the PayMongo Dashboard pointing to:

   ```
   https://<your-production-domain>/api/webhooks/paymongo
   ```

   For local testing, wallet credit still works via **poll sync** (`GET /api/wallet/topup/[id]`) while the QR modal is open; register a tunnel URL only if you need to test webhooks locally.

3. Subscribe to events: `payment.paid`, `payment_intent.succeeded`, `payment.failed`, `qrph.expired`.
4. Copy the webhook **signing secret** (`whsk_...`) into `PAYMONGO_WEBHOOK_SECRET`.
5. **Public key is required** — QR Ph attach uses `PAYMONGO_PUBLIC_KEY` (same mode as secret key).
6. Ensure `wallet_topups` table exists in Supabase (from your schema migrations).

## 6. Vercel deploy

1. Push repo and import into Vercel.
2. Set the same env vars as `.env.example`.
3. Redeploy after adding env vars.
4. Update Supabase Auth redirect URLs to the production domain.

## Production checklist

- [ ] Migrations applied
- [ ] Seed branch + plans + courts present
- [ ] `RFID_API_KEY` is a strong secret
- [ ] Service role key never exposed to client
- [ ] Google OAuth redirect allowlist updated
- [ ] PWA manifest loads (`/manifest.webmanifest`)
- [ ] PayMongo webhook URL registered and `PAYMONGO_*` env vars set on Vercel
