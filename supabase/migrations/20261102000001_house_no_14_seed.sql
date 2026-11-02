-- House No 14 baseline seed (idempotent)
-- Matches NEXT_PUBLIC_DEFAULT_BRANCH_ID=39ff10ae-f2c4-42e8-9548-54c25a8af434

INSERT INTO public.branches (id, name, slug, timezone, settings, is_active)
VALUES (
  '39ff10ae-f2c4-42e8-9548-54c25a8af434',
  'House No 14',
  'main',
  'Asia/Manila',
  '{}'::jsonb,
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  timezone = EXCLUDED.timezone,
  is_active = EXCLUDED.is_active,
  updated_at = now();

INSERT INTO public.branch_settings (
  branch_id,
  open_play_group_size,
  match_duration_mins,
  default_open_play_fee_cents,
  exclusive_court_fee_cents,
  tv_theme,
  tax_rate,
  payment_methods,
  primary_color,
  operating_hours,
  queue_paused,
  match_rules,
  exclusive_open_hour,
  exclusive_close_hour,
  walk_in_open_play_fee_cents,
  walk_in_exclusive_fee_cents
)
VALUES (
  '39ff10ae-f2c4-42e8-9548-54c25a8af434',
  4,
  30,
  12000,
  50000,
  'green',
  0,
  ARRAY['cash', 'gcash', 'maya', 'qrph']::text[],
  '#1faa5a',
  '{}'::jsonb,
  false,
  '{}'::jsonb,
  6,
  22,
  12000,
  50000
)
ON CONFLICT (branch_id) DO NOTHING;

INSERT INTO public.courts (id, branch_id, name, status, sort_order)
VALUES
  ('a6f65725-c824-4682-91c6-c9fb33105b42', '39ff10ae-f2c4-42e8-9548-54c25a8af434', 'Court 1', 'available', 1),
  ('82bd5f76-331e-4463-b52b-29b395dc4a88', '39ff10ae-f2c4-42e8-9548-54c25a8af434', 'Court 2', 'available', 2),
  ('3c3c2519-8fa2-4895-931a-87e9a717bc8f', '39ff10ae-f2c4-42e8-9548-54c25a8af434', 'Court 3', 'available', 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.membership_plans (
  id,
  branch_id,
  name,
  interval,
  duration_days,
  perks,
  active,
  priority_booking,
  discount_percent,
  price,
  open_play_fee
)
VALUES
  (
    '9d75cc5f-e0bc-4251-b8ff-ce013c590fa6',
    '39ff10ae-f2c4-42e8-9548-54c25a8af434',
    'Day Pass',
    'daily',
    1,
    '["Court access","Open Play included"]'::jsonb,
    true,
    false,
    0,
    350,
    0
  ),
  (
    'e9389b27-fbfb-48b3-9962-7a6b7a9348dd',
    '39ff10ae-f2c4-42e8-9548-54c25a8af434',
    'Weekly',
    'weekly',
    7,
    '["7-day access","Discounted Open Play"]'::jsonb,
    true,
    false,
    0,
    1200,
    50
  ),
  (
    'df977663-1acd-435f-8f8b-46a465cd18fc',
    '39ff10ae-f2c4-42e8-9548-54c25a8af434',
    'Monthly',
    'monthly',
    30,
    '["Unlimited Open Play","Priority booking"]'::jsonb,
    true,
    false,
    0,
    3500,
    0
  ),
  (
    '234299c7-a21c-4aa9-95c3-cf6c899437f8',
    '39ff10ae-f2c4-42e8-9548-54c25a8af434',
    'Annual',
    'annual',
    365,
    '["Best value","Guest passes"]'::jsonb,
    true,
    false,
    0,
    32000,
    0
  ),
  (
    'fe5f8302-d34f-4326-a9e5-fc91ecad907b',
    '39ff10ae-f2c4-42e8-9548-54c25a8af434',
    'VIP',
    'vip',
    365,
    '["VIP lounge","Free merchandise credit"]'::jsonb,
    true,
    false,
    0,
    55000,
    0
  )
ON CONFLICT (id) DO NOTHING;
