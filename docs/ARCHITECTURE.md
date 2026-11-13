# Architecture

## Overview

**The Grounds** member app is a Next.js 15 App Router PWA backed by Supabase (Postgres, Auth, Realtime). Money mutations run as Postgres RPCs for atomicity under RLS.

Staff admin, Open Play console, and Live TV are intended as a **separate frontend** on the same Supabase project.

```
Member browser / RFID reader
        │
        ▼
 Next.js member app (Vercel)
        │
        ▼
 Supabase Auth + Postgres (+ Realtime for other apps)
```

## Modules (this app)

| Module | Status | Notes |
|---|---|---|
| Auth & profiles | MVP | Email + Google |
| Wallet | MVP | PayMongo QR Ph top-up; credit via webhook + `wallet_topup_for_profile` |
| Memberships | MVP | Plans + `purchase_membership` |
| Bookings | MVP | Exclusive / open_play via `create_booking` |
| RFID scan webhook | MVP | `POST /api/rfid/scan` for hardware |
| Staff admin / TV | Out of scope | Separate project |

## Multi-branch

Operational tables are keyed by `branch_id`. This app uses `NEXT_PUBLIC_DEFAULT_BRANCH_ID`.

## Security

- RLS on all public tables
- Roles in `profiles.role` / `app_metadata` (never authorize from `user_metadata`)
- RFID endpoint validates `x-rfid-api-key` then uses service role for `rfid_scan`
- Service role key is server-only

## Frontend layout

- `(marketing)` — public site
- `(auth)` — login/signup
- `(member)` — member dashboard shell
- `api/*` — member mutations + RFID webhook

Shared UI lives in `components/ui` and `components/shared`.

## Performance

Optimizations target **request volume** (Vercel + Auth + PayMongo), not extra infrastructure. No Redis, queues, or workers.

| Area | Before | After (measured in-repo) |
|---|---|---|
| Middleware `getUser()` | Every non-static path (marketing, APIs, RFID, webhooks) | `/dashboard`, `/login`, `/signup`, `/auth` only. APIs still call `getUser()` themselves. |
| Dashboard navigation | Middleware + layout + page = 3 Auth checks | Same 3 on `/dashboard`; **0** middleware Auth on marketing and `/api/*` |
| Wallet QR poll | Every **2s**, PayMongo on every poll, QR payload re-sent | **4s** with backoff to 8s; `?poll=1` skips QR; PayMongo only every 4th poll (`&sync=1`). Webhook remains the credit path. ~30 req/min → ~15 then fewer. |
| Exclusive slot generation | 90-day hour walk + `toLocaleString` per slot | Visible month only. Microbench (`npm run bench:slots`, 2026-11-13): **310ms / 1440 objects** vs **1.7ms / 281 objects**. |
| Open Play list | Up to 4 sequential select fallbacks | Primary junction select + one fallback |
| Availability query | All future confirmed bookings | Bounded to `BOOKING_DAYS_AHEAD` |
| Public courts/settings | Queried every ISR | `unstable_cache` 60s TTL |
| Postgres | RLS `auth.uid()` per row; missing `bookings.profile_id` / `wallet_transactions.wallet_id` indexes | `(select auth.uid())` initplan; query-backed indexes; staff court-block policy is INSERT/UPDATE/DELETE only |

Production CPU % / p95 function duration: compare Vercel invocation counts for `/api/wallet/topup/[id]` and middleware, plus Supabase query insights — not claimed here.

Run `npm run bench:slots` after slot-generator changes.
