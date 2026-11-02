# Architecture

## Overview

**House No 14** member app is a Next.js 15 App Router PWA backed by Supabase (Postgres, Auth, Realtime). Money mutations run as Postgres RPCs for atomicity under RLS.

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
