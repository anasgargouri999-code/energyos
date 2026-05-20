-- ============================================================================
-- 003_solar_requests.sql
-- Adds the solar_requests table for the /solar lead-capture page.
-- Supersedes the loose solar_migration.sql file at the repo root.
-- ============================================================================


-- ============================================================================
-- 1. TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.solar_requests (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name               TEXT        NOT NULL,
  email                   TEXT        NOT NULL,
  phone                   TEXT,
  address                 TEXT,
  request_type            TEXT        NOT NULL DEFAULT 'home'
                            CHECK (request_type IN ('home', 'hospital', 'agriculture', 'commercial', 'other')),
  monthly_steg_bill       NUMERIC,                 -- TND / month (from bill-mode simulator)
  monthly_consumption_kwh NUMERIC,                 -- kWh / month (from kwh-mode simulator)
  panels_estimate         INTEGER,                 -- number of panels calculated client-side
  estimated_cost          NUMERIC,                 -- TND installed, calculated client-side
  message                 TEXT,
  status                  TEXT        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'contacted', 'quoted', 'installed', 'cancelled')),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.solar_requests IS 'Solar installation leads submitted from the /solar landing page';
COMMENT ON COLUMN public.solar_requests.request_type     IS 'home | hospital | agriculture | commercial | other';
COMMENT ON COLUMN public.solar_requests.panels_estimate  IS 'Client-side calculation: ceil(kwhMo / 60)';
COMMENT ON COLUMN public.solar_requests.estimated_cost   IS 'Client-side calculation: panels × 1100 TND × 1.18 overhead';
COMMENT ON COLUMN public.solar_requests.status           IS 'CRM pipeline stage managed via /api/admin/solar-requests/:id/status';


-- ============================================================================
-- 2. AUTO-UPDATE updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS solar_requests_updated_at ON public.solar_requests;
CREATE TRIGGER solar_requests_updated_at
  BEFORE UPDATE ON public.solar_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ============================================================================
-- 3. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_solar_requests_status       ON public.solar_requests (status);
CREATE INDEX IF NOT EXISTS idx_solar_requests_email        ON public.solar_requests (email);
CREATE INDEX IF NOT EXISTS idx_solar_requests_request_type ON public.solar_requests (request_type);
CREATE INDEX IF NOT EXISTS idx_solar_requests_created_at   ON public.solar_requests (created_at DESC);


-- ============================================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.solar_requests ENABLE ROW LEVEL SECURITY;

-- Public landing page: anyone can submit a request (INSERT only)
CREATE POLICY "anon_insert_solar_requests"
  ON public.solar_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Backend (service_role) has full access for admin CRM workflows
CREATE POLICY "service_role_all_solar_requests"
  ON public.solar_requests
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- ============================================================================
-- 5. DEMO SEED ROW
-- A sample lead so the admin panel is never empty on first launch.
-- ============================================================================

INSERT INTO public.solar_requests (
  full_name, email, phone, address,
  request_type, monthly_steg_bill, monthly_consumption_kwh,
  panels_estimate, estimated_cost, message, status
) VALUES (
  'Dr. Mehdi Elloumi',
  'mehdi.elloumi@polyclinique-alhayat.tn',
  '+216 74 123 456',
  'Avenue Taïeb Mhiri, Sfax',
  'hospital',
  4200,
  22100,
  369,
  477000,
  'Installation pour 4 200 m² — toiture plate, besoin d''autonomie partielle HVAC.',
  'contacted'
) ON CONFLICT DO NOTHING;


-- ============================================================================
-- DONE — 1 table, 1 trigger, 4 indexes, 2 RLS policies, 1 demo row
-- ============================================================================
