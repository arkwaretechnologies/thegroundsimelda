# API Reference

All JSON APIs return `{ ... }` on success or `{ "error": "message" }` on failure.

## Auth-required member APIs

### `GET /api/profile`

Returns the authenticated member’s profile.

### `PATCH /api/profile`

Update own profile.

```json
{
  "full_name": "Member Name",
  "phone": "09XXXXXXXXX",
  "address": "optional",
  "club": "optional free-text club name",
  "gender": "male | female | null (optional)",
  "skill_level": "beginner | intermediate | advanced | professional | null (optional)"
}
```

`club` is free text for the pickle club they joined (not `branch_id`). Gender and skill level are profile defaults.

### `POST /api/profile/avatar`

Upload a profile photo (`multipart/form-data`, field `file`). JPEG, PNG, WebP, or GIF up to 2 MB.

Stores the file in the public `avatars` bucket under `{user_id}/avatar.*` and updates `profiles.avatar_url` with the public URL.

```json
{ "avatar_url": "https://…/storage/v1/object/public/avatars/…/avatar.jpg?v=…" }
```

### `POST /api/wallet/topup`

Creates a PayMongo QR Ph payment. Returns QR image and top-up id. Credits on PayMongo webhook or when the client polls `GET /api/wallet/topup/[id]` after payment succeeds.

```json
{ "amount_cents": 100000 }
```

Response:

```json
{
  "topup_id": "uuid",
  "payment_intent_id": "pi_...",
  "qr_image_url": "data:image/png;base64,...",
  "expires_at": "ISO-8601"
}
```

### `GET /api/wallet/topup/[id]`

Poll top-up status: `pending`, `paid`, `failed`, or `expired`. While `pending`, the server checks PayMongo for a succeeded payment intent and credits the wallet if the webhook has not run yet.

### `POST /api/webhooks/paymongo`

PayMongo webhook (signature required). Register:

`https://<your-production-domain>/api/webhooks/paymongo`

Events: `payment.paid`, `payment_intent.succeeded`, `payment.failed`, `qrph.expired`.

### `POST /api/memberships/purchase`

```json
{ "plan_id": "uuid" }
```

Debits wallet and activates membership.

### `POST /api/bookings`

Exclusive court only. Open Play uses registration below. The bookings page lists exclusive courts with `status = available` only.

```json
{
  "court_id": "uuid",
  "starts_at": "ISO-8601",
  "ends_at": "ISO-8601"
}
```

### `GET /api/open-play/sessions?date=YYYY-MM-DD`

Auth required. Lists **staff-created** `open_play_sessions` schedules overlapping that Manila calendar date (status `scheduled` or `open`, no court filter). Court names come from multi-court links or the session’s `court_id`. Each row includes registration counts when available.

```json
{
  "sessions": [
    {
      "id": "uuid",
      "title": "Open Play",
      "starts_at": "ISO-8601",
      "ends_at": "ISO-8601",
      "status": "scheduled | open",
      "max_players": 16,
      "court_names": "Court 1, Court 2",
      "registered_count": 4,
      "my_registration_status": "registered | checked_in | null"
    }
  ]
}
```

### `GET /api/open-play/register?session_id=uuid`

Returns `{ fee_cents, balance_cents }` for the current user and session (membership rate or branch default open play fee).

### `POST /api/open-play/register`

Register for a staff-scheduled Open Play session (wallet debit, roster status `registered`; staff check-in in Admin). Returns **402** with `code: "insufficient_balance"` when wallet is too low.

```json
{ "session_id": "uuid" }
```

## RFID webhook

### `POST /api/rfid/scan`

Headers: `x-rfid-api-key: <RFID_API_KEY>`

```json
{
  "card_uid": "PV-CARD-001",
  "branch_id": "11111111-1111-1111-1111-111111111111"
}
```

Response includes `queue_id`, `fee_charged_cents`, `matches_created`.

## Postgres RPCs (shared backend)

| Function | Purpose |
|---|---|
| `wallet_topup` | Credit wallet + ledger |
| `wallet_debit` | Debit with balance check |
| `purchase_membership` | Buy plan |
| `create_booking` | Book court + debit |
| `rfid_scan` | Full scan pipeline |
| `open_play_session_set` | Open/close session (admin app) |
| `try_matchmake` | Form matches (admin app) |
| `complete_open_play_match` | End match + free court (admin app) |
