-- ============================================================
-- EnergyOS Solar Requests Table
-- Run this in your Supabase SQL editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.solar_requests (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name              TEXT NOT NULL,
  email                  TEXT NOT NULL,
  phone                  TEXT,
  address                TEXT,
  request_type           TEXT CHECK (request_type IN ('home', 'hospital', 'agriculture', 'commercial', 'other')),
  monthly_steg_bill      NUMERIC,          -- TND / month
  monthly_consumption_kwh NUMERIC,         -- kWh / month
  panels_estimate        INTEGER,          -- number of panels calculated
  estimated_cost         NUMERIC,          -- TND installed
  message                TEXT,
  status                 TEXT NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'contacted', 'quoted', 'installed', 'cancelled')),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger: keep updated_at current
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

-- ──────────────────────────────────────────────────────────
-- Row Level Security
-- ──────────────────────────────────────────────────────────
ALTER TABLE public.solar_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a request (public landing page form)
CREATE POLICY "anon can insert solar_requests"
  ON public.solar_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only service_role (backend) can read / update / delete
CREATE POLICY "service_role full access solar_requests"
  ON public.solar_requests
  USING (auth.role() = 'service_role');
