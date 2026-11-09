-- Court schedule blocks, overlap enforcement, staff walk-in booking helpers.

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Courts: exclusive bookable flag
ALTER TABLE public.courts
  ADD COLUMN IF NOT EXISTS is_exclusive boolean NOT NULL DEFAULT false;

UPDATE public.courts
SET is_exclusive = true
WHERE branch_id = '39ff10ae-f2c4-42e8-9548-54c25a8af434';

-- Optional guest label for staff walk-in reservations
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS walk_in_label text;

COMMENT ON COLUMN public.bookings.walk_in_label IS 'Staff walk-in guest name; profile_id is the staff member who created the hold.';

-- Staff closures (tournament, maintenance) — per court
CREATE TABLE IF NOT EXISTS public.court_schedule_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches (id) ON DELETE CASCADE,
  court_id uuid NOT NULL REFERENCES public.courts (id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  reason text,
  created_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT court_schedule_blocks_range CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS court_schedule_blocks_court_time_idx
  ON public.court_schedule_blocks (court_id, starts_at, ends_at);

ALTER TABLE public.court_schedule_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS court_schedule_blocks_select ON public.court_schedule_blocks;
CREATE POLICY court_schedule_blocks_select
  ON public.court_schedule_blocks
  FOR SELECT
  TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS court_schedule_blocks_staff_write ON public.court_schedule_blocks;
CREATE POLICY court_schedule_blocks_staff_write
  ON public.court_schedule_blocks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('staff', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('staff', 'admin')
    )
  );

-- Prevent double-booking confirmed exclusive courts (race-safe at DB level)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'bookings_no_overlap_exclusive'
  ) THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_no_overlap_exclusive
      EXCLUDE USING gist (
        court_id WITH =,
        tstzrange(starts_at, ends_at, '[)') WITH &&
      )
      WHERE (status = 'confirmed' AND type = 'exclusive');
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Could not add bookings_no_overlap_exclusive: %', SQLERRM;
END $$;

CREATE OR REPLACE FUNCTION public.is_staff_or_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('staff', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.manila_hour_slot(p_date date, p_hour int)
RETURNS timestamptz
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT (to_char(p_date, 'YYYY-MM-DD') || 'T' || lpad(p_hour::text, 2, '0') || ':00:00+08')::timestamptz;
$$;

CREATE OR REPLACE FUNCTION public.court_slot_blocked(
  p_court_id uuid,
  p_starts timestamptz,
  p_ends timestamptz
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.court_schedule_blocks b
    WHERE b.court_id = p_court_id
      AND tstzrange(b.starts_at, b.ends_at, '[)') && tstzrange(p_starts, p_ends, '[)')
  );
$$;

CREATE OR REPLACE FUNCTION public.bookings_enforce_not_blocked()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'confirmed' AND NEW.type = 'exclusive' THEN
  IF public.court_slot_blocked(NEW.court_id, NEW.starts_at, NEW.ends_at) THEN
    RAISE EXCEPTION 'court_closed'
        USING ERRCODE = 'check_violation',
              MESSAGE = 'This time is closed for booking.';
  END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_enforce_not_blocked_trg ON public.bookings;
CREATE TRIGGER bookings_enforce_not_blocked_trg
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.bookings_enforce_not_blocked();

CREATE OR REPLACE FUNCTION public.staff_set_court_blocks(
  p_court_id uuid,
  p_date date,
  p_hours int[],
  p_reason text DEFAULT NULL
)
RETURNS SETOF public.court_schedule_blocks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_branch_id uuid;
  v_hour int;
  v_start timestamptz;
  v_end timestamptz;
BEGIN
  IF NOT public.is_staff_or_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501', MESSAGE = 'Staff access required.';
  END IF;

  SELECT c.branch_id INTO v_branch_id FROM public.courts c WHERE c.id = p_court_id;
  IF v_branch_id IS NULL THEN
    RAISE EXCEPTION 'court_not_found';
  END IF;

  FOREACH v_hour IN ARRAY p_hours
  LOOP
    v_start := public.manila_hour_slot(p_date, v_hour);
    v_end := v_start + interval '1 hour';

    DELETE FROM public.court_schedule_blocks b
    WHERE b.court_id = p_court_id
      AND b.starts_at = v_start
      AND b.ends_at = v_end;

    RETURN QUERY
    INSERT INTO public.court_schedule_blocks (
      branch_id, court_id, starts_at, ends_at, reason, created_by
    )
    VALUES (v_branch_id, p_court_id, v_start, v_end, p_reason, auth.uid())
    RETURNING *;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.staff_close_court_day(
  p_court_id uuid,
  p_date date,
  p_reason text DEFAULT NULL
)
RETURNS public.court_schedule_blocks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_branch_id uuid;
  v_open int;
  v_close int;
  v_start timestamptz;
  v_end timestamptz;
  v_row public.court_schedule_blocks;
BEGIN
  IF NOT public.is_staff_or_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501', MESSAGE = 'Staff access required.';
  END IF;

  SELECT c.branch_id INTO v_branch_id FROM public.courts c WHERE c.id = p_court_id;
  IF v_branch_id IS NULL THEN
    RAISE EXCEPTION 'court_not_found';
  END IF;

  SELECT bs.exclusive_open_hour, bs.exclusive_close_hour
  INTO v_open, v_close
  FROM public.branch_settings bs
  WHERE bs.branch_id = v_branch_id;

  v_open := COALESCE(v_open, 6);
  v_close := COALESCE(v_close, 22);

  v_start := public.manila_hour_slot(p_date, v_open);
  v_end := public.manila_hour_slot(p_date, v_close);

  INSERT INTO public.court_schedule_blocks (
    branch_id, court_id, starts_at, ends_at, reason, created_by
  )
  VALUES (v_branch_id, p_court_id, v_start, v_end, COALESCE(p_reason, 'Day closed'), auth.uid())
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.staff_delete_court_blocks(p_block_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_staff_or_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501', MESSAGE = 'Staff access required.';
  END IF;

  DELETE FROM public.court_schedule_blocks
  WHERE id = ANY (p_block_ids);
END;
$$;

CREATE OR REPLACE FUNCTION public.staff_create_booking(
  p_court_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_walk_in_label text DEFAULT NULL
)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_court public.courts;
  v_fee int;
  v_row public.bookings;
BEGIN
  IF NOT public.is_staff_or_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501', MESSAGE = 'Staff access required.';
  END IF;

  IF p_ends_at <= p_starts_at THEN
    RAISE EXCEPTION 'invalid_range';
  END IF;

  SELECT * INTO v_court FROM public.courts WHERE id = p_court_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'court_not_found';
  END IF;

  IF public.court_slot_blocked(p_court_id, p_starts_at, p_ends_at) THEN
    RAISE EXCEPTION 'court_closed'
      USING MESSAGE = 'This time is closed for booking.';
  END IF;

  SELECT COALESCE(bs.walk_in_exclusive_fee_cents, 0)
  INTO v_fee
  FROM public.branch_settings bs
  WHERE bs.branch_id = v_court.branch_id;

  INSERT INTO public.bookings (
    branch_id,
    court_id,
    profile_id,
    type,
    starts_at,
    ends_at,
    status,
    fee_cents,
    walk_in_label
  )
  VALUES (
    v_court.branch_id,
    p_court_id,
    auth.uid(),
    'exclusive',
    p_starts_at,
    p_ends_at,
    'confirmed',
    COALESCE(v_fee, 0),
    NULLIF(trim(p_walk_in_label), '')
  )
  RETURNING * INTO v_row;

  RETURN v_row;
EXCEPTION
  WHEN exclusion_violation THEN
    RAISE EXCEPTION 'court_booked'
      USING MESSAGE = 'This court is already booked for that time.';
END;
$$;

CREATE OR REPLACE FUNCTION public.staff_update_exclusive_hours(
  p_branch_id uuid,
  p_open_hour int,
  p_close_hour int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_staff_or_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501', MESSAGE = 'Staff access required.';
  END IF;

  IF p_open_hour < 0 OR p_close_hour > 24 OR p_open_hour >= p_close_hour THEN
    RAISE EXCEPTION 'invalid_hours';
  END IF;

  UPDATE public.branch_settings
  SET
    exclusive_open_hour = p_open_hour,
    exclusive_close_hour = p_close_hour
  WHERE branch_id = p_branch_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_staff_or_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.manila_hour_slot(date, int) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.court_slot_blocked(uuid, timestamptz, timestamptz) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.staff_set_court_blocks(uuid, date, int[], text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_close_court_day(uuid, date, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_delete_court_blocks(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_create_booking(uuid, timestamptz, timestamptz, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_update_exclusive_hours(uuid, int, int) TO authenticated;
