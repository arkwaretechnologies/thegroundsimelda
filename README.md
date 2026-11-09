# The Grounds (Member App)

Member-facing Progressive Web App for **The Grounds** — membership, wallet, and court booking.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Framer Motion · Supabase · Vercel

> Staff admin, Open Play console, and Live TV live in a **separate project**. This app shares the same Supabase backend.

## Features

- Marketing landing + membership plans
- Auth (email/password + Google OAuth)
- Member dashboard: wallet (PayMongo QR Ph top-ups), memberships, bookings, history, notifications
- Court booking with wallet debit (public schedule shows open / booked / closed hours)
- Staff **Reservations** (`/dashboard/reservations`): per-court hour closures and walk-in holds
- RFID scan webhook (`POST /api/rfid/scan`) for check-in hardware
- Multi-branch schema ready (`branches` + `NEXT_PUBLIC_DEFAULT_BRANCH_ID`)

## Quick start

1. Copy env and fill Supabase keys:

```bash
cp .env.example .env.local
```

2. Install and run:

```bash
npm install
npm run dev
```

3. Apply SQL migrations in the Supabase SQL editor (schema from your source project, then):

- `supabase/migrations/20261102000001_the_grounds_seed.sql`

4. Enable Google provider in Supabase Auth (optional) and add redirect URL:
   `http://localhost:3000/auth/callback`

See [docs/SETUP.md](docs/SETUP.md) for full setup and Vercel deploy.

## Key routes

| Route | Purpose |
|---|---|
| `/` | Marketing |
| `/plans` | Membership plans |
| `/login` `/signup` | Auth |
| `/dashboard` | Member home |
| `POST /api/rfid/scan` | RFID webhook (`x-rfid-api-key`) |

## Docs

- [Architecture](docs/ARCHITECTURE.md)
- [API](docs/API.md)
- [Setup](docs/SETUP.md)
