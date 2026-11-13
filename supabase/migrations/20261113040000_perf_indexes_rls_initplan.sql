-- Query-backed indexes + RLS initplan wraps. Policy predicates stay equivalent.

CREATE INDEX IF NOT EXISTS idx_bookings_profile_starts
  ON public.bookings (profile_id, starts_at DESC);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_wallet_created
  ON public.wallet_transactions (wallet_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_court_schedule_blocks_branch_starts
  ON public.court_schedule_blocks (branch_id, starts_at);

CREATE INDEX IF NOT EXISTS idx_courts_branch_exclusive_status
  ON public.courts (branch_id, is_exclusive, status, sort_order);

-- Duplicate tournament unique indexes are constraint-backed; leave them in place.

-- Staff write should not also apply to SELECT (public select policy already exists)
DROP POLICY IF EXISTS court_schedule_blocks_staff_write ON public.court_schedule_blocks;
DROP POLICY IF EXISTS court_schedule_blocks_staff_insert ON public.court_schedule_blocks;
DROP POLICY IF EXISTS court_schedule_blocks_staff_update ON public.court_schedule_blocks;
DROP POLICY IF EXISTS court_schedule_blocks_staff_delete ON public.court_schedule_blocks;

CREATE POLICY court_schedule_blocks_staff_insert
  ON public.court_schedule_blocks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.role IN ('staff', 'admin')
    )
  );

CREATE POLICY court_schedule_blocks_staff_update
  ON public.court_schedule_blocks
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.role IN ('staff', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.role IN ('staff', 'admin')
    )
  );

CREATE POLICY court_schedule_blocks_staff_delete
  ON public.court_schedule_blocks
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.role IN ('staff', 'admin')
    )
  );

DROP POLICY IF EXISTS attendance_own ON public.attendance_logs;
CREATE POLICY attendance_own
  ON public.attendance_logs
  FOR SELECT
  USING (
    (profile_id = (SELECT auth.uid())) OR is_staff(branch_id)
  );

DROP POLICY IF EXISTS audit_logs_staff_select ON public.audit_logs;
CREATE POLICY audit_logs_staff_select
  ON public.audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND (
          p.role = 'admin'::user_role
          OR p.admin_role = ANY (
            ARRAY['super_admin'::admin_staff_role, 'manager'::admin_staff_role]
          )
        )
    )
  );

DROP POLICY IF EXISTS bookings_own ON public.bookings;
CREATE POLICY bookings_own
  ON public.bookings
  FOR SELECT
  USING (
    (profile_id = (SELECT auth.uid())) OR is_staff(branch_id)
  );

DROP POLICY IF EXISTS loyalty_own ON public.loyalty_points;
CREATE POLICY loyalty_own
  ON public.loyalty_points
  FOR SELECT
  USING (
    (profile_id = (SELECT auth.uid())) OR is_staff(NULL::uuid)
  );

DROP POLICY IF EXISTS memberships_own ON public.memberships;
CREATE POLICY memberships_own
  ON public.memberships
  FOR SELECT
  USING (
    (profile_id = (SELECT auth.uid())) OR is_staff(branch_id)
  );

DROP POLICY IF EXISTS notifications_own ON public.notifications;
CREATE POLICY notifications_own
  ON public.notifications
  FOR SELECT
  USING (profile_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS notifications_update_own ON public.notifications;
CREATE POLICY notifications_update_own
  ON public.notifications
  FOR UPDATE
  USING (profile_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Members read own open play registrations" ON public.open_play_registrations;
CREATE POLICY "Members read own open play registrations"
  ON public.open_play_registrations
  FOR SELECT
  USING (profile_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Members read branch open play sessions" ON public.open_play_sessions;
CREATE POLICY "Members read branch open play sessions"
  ON public.open_play_sessions
  FOR SELECT
  USING (
    branch_id = COALESCE(
      (
        SELECT p.branch_id
        FROM public.profiles p
        WHERE p.id = (SELECT auth.uid())
      ),
      '39ff10ae-f2c4-42e8-9548-54c25a8af434'::uuid
    )
  );

DROP POLICY IF EXISTS orders_own ON public.orders;
CREATE POLICY orders_own
  ON public.orders
  FOR SELECT
  USING (
    (profile_id = (SELECT auth.uid())) OR is_staff(branch_id)
  );

DROP POLICY IF EXISTS profiles_read_own ON public.profiles;
CREATE POLICY profiles_read_own
  ON public.profiles
  FOR SELECT
  USING (
    (id = (SELECT auth.uid())) OR is_staff(branch_id)
  );

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own
  ON public.profiles
  FOR UPDATE
  USING (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS referrals_own ON public.referrals;
CREATE POLICY referrals_own
  ON public.referrals
  FOR SELECT
  USING (
    (referrer_id = (SELECT auth.uid())) OR is_staff(NULL::uuid)
  );

DROP POLICY IF EXISTS rfid_read_own ON public.rfid_cards;
CREATE POLICY rfid_read_own
  ON public.rfid_cards
  FOR SELECT
  USING (profile_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Members insert own pending wallet topups" ON public.wallet_topups;
CREATE POLICY "Members insert own pending wallet topups"
  ON public.wallet_topups
  FOR INSERT
  WITH CHECK (
    (profile_id = (SELECT auth.uid()))
    AND (status = 'pending'::wallet_topup_status)
  );

DROP POLICY IF EXISTS "Members read own wallet topups" ON public.wallet_topups;
CREATE POLICY "Members read own wallet topups"
  ON public.wallet_topups
  FOR SELECT
  USING (profile_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS wallet_tx_own ON public.wallet_transactions;
CREATE POLICY wallet_tx_own
  ON public.wallet_transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.wallets w
      WHERE w.id = wallet_transactions.wallet_id
        AND (
          (w.profile_id = (SELECT auth.uid())) OR is_staff(NULL::uuid)
        )
    )
  );

DROP POLICY IF EXISTS wallets_own ON public.wallets;
CREATE POLICY wallets_own
  ON public.wallets
  FOR SELECT
  USING (
    (profile_id = (SELECT auth.uid())) OR is_staff(NULL::uuid)
  );
