-- Member exclusive booking: insert confirmed row first, debit wallet only on success (FCFS).

CREATE OR REPLACE FUNCTION public.create_booking(
  p_court_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_type public.booking_type DEFAULT 'exclusive',
  p_gender public.gender DEFAULT NULL,
  p_skill_level public.skill_level DEFAULT NULL
)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_court public.courts;
  v_fee int;
  v_row public.bookings;
  v_balance int;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = '42501', MESSAGE = 'Sign in required.';
  END IF;

  IF p_ends_at <= p_starts_at THEN
    RAISE EXCEPTION 'invalid_range' USING MESSAGE = 'Invalid time range.';
  END IF;

  SELECT * INTO v_court FROM public.courts WHERE id = p_court_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'court_not_found';
  END IF;

  IF p_type <> 'exclusive' THEN
    RAISE EXCEPTION 'unsupported_type'
      USING MESSAGE = 'Use the open play registration flow for open play.';
  END IF;

  IF public.court_slot_blocked(p_court_id, p_starts_at, p_ends_at) THEN
    RAISE EXCEPTION 'court_closed' USING MESSAGE = 'This time is closed for booking.';
  END IF;

  SELECT COALESCE(bs.exclusive_court_fee_cents, 0)
  INTO v_fee
  FROM public.branch_settings bs
  WHERE bs.branch_id = v_court.branch_id;

  v_fee := COALESCE(v_fee, 0);

  SELECT w.balance_cents INTO v_balance
  FROM public.wallets w
  WHERE w.profile_id = v_uid
  FOR UPDATE;

  IF v_balance IS NULL OR v_balance < v_fee THEN
    RAISE EXCEPTION 'insufficient_balance'
      USING ERRCODE = 'P0001', MESSAGE = 'Insufficient wallet balance.';
  END IF;

  INSERT INTO public.bookings (
    branch_id,
    court_id,
    profile_id,
    type,
    starts_at,
    ends_at,
    status,
    fee_cents,
    gender,
    skill_level
  )
  VALUES (
    v_court.branch_id,
    p_court_id,
    v_uid,
    p_type,
    p_starts_at,
    p_ends_at,
    'confirmed',
    v_fee,
    p_gender,
    p_skill_level
  )
  RETURNING * INTO v_row;

  PERFORM public.wallet_debit(
    p_profile_id := v_uid,
    p_amount_cents := v_fee,
    p_reference := v_row.id::text,
    p_metadata := jsonb_build_object(
      'booking_id', v_row.id,
      'court_id', p_court_id,
      'type', 'exclusive'
    )
  );

  RETURN v_row;
EXCEPTION
  WHEN exclusion_violation THEN
    RAISE EXCEPTION 'court_booked'
      USING MESSAGE = 'This court is already booked for that time.';
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_booking(
  uuid, timestamptz, timestamptz, public.booking_type, public.gender, public.skill_level
) TO authenticated;
