-- ============================================================================
-- EnergyOS — Initial Database Schema
-- Run this in Supabase SQL Editor (or any PostgreSQL 15+ instance)
-- Generated from: docs/diagrams/database_schema.puml
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================================
-- 1. CLINICS (root entity — no dependencies)
-- ============================================================================
CREATE TABLE IF NOT EXISTS clinics (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                VARCHAR(255) NOT NULL,
  address             TEXT,
  city                VARCHAR(100),
  country             VARCHAR(100) NOT NULL DEFAULT 'Tunisie',
  subscribed_power_kw NUMERIC(10,2) NOT NULL DEFAULT 0,
  m2_surface_area     NUMERIC(10,2),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE clinics IS 'Registered medical clinics using EnergyOS';


-- ============================================================================
-- 2. ACCESS REQUESTS (depends on clinics)
-- ============================================================================
CREATE TABLE IF NOT EXISTS access_requests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id   UUID REFERENCES clinics(id) ON DELETE SET NULL,
  full_name   VARCHAR(255) NOT NULL,
  clinic_name VARCHAR(255) NOT NULL,
  email       VARCHAR(255) NOT NULL,
  phone       VARCHAR(50),
  country     VARCHAR(100) DEFAULT 'Tunisie',
  message     TEXT,
  status      VARCHAR(50) NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE access_requests IS 'Incoming access requests from the landing page form';

CREATE INDEX idx_access_requests_status ON access_requests (status);
CREATE INDEX idx_access_requests_email  ON access_requests (email);


-- ============================================================================
-- 3. ACCESS CODES (depends on access_requests)
-- ============================================================================
CREATE TABLE IF NOT EXISTS access_codes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code         VARCHAR(100) NOT NULL UNIQUE,
  request_id   UUID REFERENCES access_requests(id) ON DELETE SET NULL,
  email        VARCHAR(255) NOT NULL,
  clinic_name  VARCHAR(255),
  access_level VARCHAR(50) NOT NULL DEFAULT 'standard'
                 CHECK (access_level IN ('standard', 'admin')),
  active       BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at   TIMESTAMPTZ
);

COMMENT ON TABLE access_codes IS 'Issued access codes tied to approved requests';

CREATE INDEX idx_access_codes_code   ON access_codes (code);
CREATE INDEX idx_access_codes_active ON access_codes (active);


-- ============================================================================
-- 4. ZONES (depends on clinics)
-- ============================================================================
CREATE TABLE IF NOT EXISTS zones (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id               UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name                    VARCHAR(255) NOT NULL,
  type                    VARCHAR(50) NOT NULL
                            CHECK (type IN ('medical', 'admin', 'support', 'common', 'external')),
  priority                INTEGER NOT NULL DEFAULT 3
                            CHECK (priority BETWEEN 1 AND 5),
  operating_mode          VARCHAR(50) NOT NULL DEFAULT 'normal'
                            CHECK (operating_mode IN ('normal', 'eco', 'off', 'auto')),
  target_temp_c           NUMERIC(4,1),
  target_humidity_percent NUMERIC(4,1),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE zones IS 'Functional zones within a clinic (Bloc Op, Admin, etc.)';
COMMENT ON COLUMN zones.priority IS '1 = Critical (never shed), 5 = Sheddable first';

CREATE INDEX idx_zones_clinic ON zones (clinic_id);


-- ============================================================================
-- 5. DEVICES (depends on zones)
-- ============================================================================
CREATE TABLE IF NOT EXISTS devices (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id        UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  name           VARCHAR(255) NOT NULL,
  type           VARCHAR(50) NOT NULL
                   CHECK (type IN ('hvac', 'meter', 'lighting', 'access', 'safety', 'transport')),
  protocol       VARCHAR(50) NOT NULL
                   CHECK (protocol IN ('BACnet', 'Modbus', 'LonWorks', 'RS485', 'Wiegand/RS485')),
  status         VARCHAR(50) NOT NULL DEFAULT 'offline'
                   CHECK (status IN ('online', 'offline')),
  load_rating_kw NUMERIC(8,2),
  ip_address     VARCHAR(45),
  port           INTEGER,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE devices IS 'Physical hardware devices connected via GTB protocols';

CREATE INDEX idx_devices_zone   ON devices (zone_id);
CREATE INDEX idx_devices_status ON devices (status);


-- ============================================================================
-- 6. ENERGY METRICS (depends on clinics)
-- ============================================================================
CREATE TABLE IF NOT EXISTS energy_metrics (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  clinic_id      UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  timestamp      TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_power_kw NUMERIC(10,2) NOT NULL,
  today_kwh      NUMERIC(12,2) NOT NULL,
  cos_phi        NUMERIC(4,2) NOT NULL,
  peak_kw_today  NUMERIC(10,2) NOT NULL,
  is_optimized   BOOLEAN NOT NULL DEFAULT false
);

COMMENT ON TABLE energy_metrics IS 'Time-series telemetry snapshots from clinic meters';

CREATE INDEX idx_metrics_clinic_ts ON energy_metrics (clinic_id, timestamp DESC);


-- ============================================================================
-- 7. ALERTS LOG (depends on zones)
-- ============================================================================
CREATE TABLE IF NOT EXISTS alerts_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id         UUID REFERENCES zones(id) ON DELETE SET NULL,
  severity        VARCHAR(50) NOT NULL
                    CHECK (severity IN ('info', 'warning', 'critical')),
  message         TEXT NOT NULL,
  timestamp       TIMESTAMPTZ NOT NULL DEFAULT now(),
  acknowledged    BOOLEAN NOT NULL DEFAULT false,
  acknowledged_at TIMESTAMPTZ
);

COMMENT ON TABLE alerts_log IS 'System alerts raised by zone monitoring rules';

CREATE INDEX idx_alerts_zone     ON alerts_log (zone_id);
CREATE INDEX idx_alerts_severity ON alerts_log (severity);
CREATE INDEX idx_alerts_unacked  ON alerts_log (acknowledged) WHERE acknowledged = false;


-- ============================================================================
-- 8. AI OPTIMIZATIONS (depends on clinics)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_optimizations (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id                 UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  config_json               JSONB NOT NULL DEFAULT '{}'::jsonb,
  savings_projected_percent NUMERIC(4,1) NOT NULL DEFAULT 0,
  summary                   TEXT NOT NULL,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  applied_at                TIMESTAMPTZ
);

COMMENT ON TABLE ai_optimizations IS 'Groq AI-generated optimization profiles per clinic';

CREATE INDEX idx_ai_opt_clinic ON ai_optimizations (clinic_id);


-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- access_requests: anon can INSERT only, service_role has full access
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_insert_requests"
  ON access_requests
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "service_role_all_requests"
  ON access_requests
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- access_codes: anon/authenticated can SELECT (for code validation), service_role has full access
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_codes"
  ON access_codes
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "service_role_all_codes"
  ON access_codes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- clinics: service_role only
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_clinics"
  ON clinics
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- zones: service_role only
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_zones"
  ON zones
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- devices: service_role only
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_devices"
  ON devices
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- energy_metrics: service_role only
ALTER TABLE energy_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_metrics"
  ON energy_metrics
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- alerts_log: service_role only
ALTER TABLE alerts_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_alerts"
  ON alerts_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- ai_optimizations: service_role only
ALTER TABLE ai_optimizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_ai_opt"
  ON ai_optimizations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- ============================================================================
-- DONE — 8 tables, 13 indexes, 10 RLS policies
-- ============================================================================
