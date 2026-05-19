-- ============================================================================
-- 002_finance_and_savings.sql
-- Creates the monthly_savings table, enables RLS, and seeds data for
-- Polyclinique Errachid including zones, devices, and historical savings.
-- ============================================================================

-- ============================================================================
-- 1. TABLE CREATION & RLS POLICIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS monthly_savings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id     UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  month_name    VARCHAR(20) NOT NULL, -- 'Jan', 'Fév', etc.
  month_order   INTEGER NOT NULL,     -- 1 for Jan, 12 for Dec
  baseline_kwh  NUMERIC(12,2) NOT NULL,
  optimized_kwh NUMERIC(12,2) NOT NULL,
  saving_kwh    NUMERIC(12,2) NOT NULL,
  saving_percent NUMERIC(5,2) NOT NULL,
  bill_millimes BIGINT NOT NULL,      -- Financial tracking in millimes
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE monthly_savings IS 'Tracks historical monthly billing, baseline vs optimized consumption, and actual financial savings';

-- Enable RLS for monthly_savings
ALTER TABLE monthly_savings ENABLE ROW LEVEL SECURITY;

-- SELECT is public (anon/authenticated) so the dashboard can load charts
CREATE POLICY "public_read_monthly_savings"
  ON monthly_savings
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ALL other actions require service_role
CREATE POLICY "service_role_all_monthly_savings"
  ON monthly_savings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- ============================================================================
-- 2. SEED DATA FOR POLYCLINIQUE ERRACHID
-- ============================================================================

-- Clinic row
INSERT INTO clinics (id, name, address, city, country, subscribed_power_kw, m2_surface_area)
VALUES (
  'e74f1d2e-bb28-4c9f-863a-23910c224f8d',
  'Polyclinique Errachid',
  'Avenue El Hédi Chaker',
  'Sfax',
  'Tunisie',
  260.00,
  4200.00
) ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name,
    subscribed_power_kw = EXCLUDED.subscribed_power_kw,
    m2_surface_area = EXCLUDED.m2_surface_area;


-- Zones rows (matching exact IDs from Node-RED where possible or using deterministic UUIDs)
INSERT INTO zones (id, clinic_id, name, type, priority, operating_mode, target_temp_c, target_humidity_percent)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'e74f1d2e-bb28-4c9f-863a-23910c224f8d', 'Bloc Opératoire 1', 'medical', 1, 'normal', 21.0, 55.0),
  ('22222222-2222-2222-2222-222222222222', 'e74f1d2e-bb28-4c9f-863a-23910c224f8d', 'Bloc Opératoire 2', 'medical', 1, 'normal', 20.0, 58.0),
  ('33333333-3333-3333-3333-333333333333', 'e74f1d2e-bb28-4c9f-863a-23910c224f8d', 'Unité de Soins Intensifs', 'medical', 1, 'normal', 22.0, 50.0),
  ('44444444-4444-4444-4444-444444444444', 'e74f1d2e-bb28-4c9f-863a-23910c224f8d', 'Salle de Réveil', 'medical', 2, 'normal', 23.0, 52.0),
  ('55555555-5555-5555-5555-555555555555', 'e74f1d2e-bb28-4c9f-863a-23910c224f8d', 'Consultations Ext. — RDC', 'admin', 3, 'eco', 25.0, 60.0),
  ('66666666-6666-6666-6666-666666666666', 'e74f1d2e-bb28-4c9f-863a-23910c224f8d', 'Administration', 'admin', 4, 'off', 28.0, 65.0),
  ('77777777-7777-7777-7777-777777777777', 'e74f1d2e-bb28-4c9f-863a-23910c224f8d', 'Pharmacie', 'support', 2, 'normal', 20.0, 45.0),
  ('88888888-8888-8888-8888-888888888888', 'e74f1d2e-bb28-4c9f-863a-23910c224f8d', 'Laboratoire', 'support', 2, 'normal', 21.0, 50.0),
  ('99999999-9999-9999-9999-999999999999', 'e74f1d2e-bb28-4c9f-863a-23910c224f8d', 'Hall Principal', 'common', 4, 'eco', 26.0, 62.0),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'e74f1d2e-bb28-4c9f-863a-23910c224f8d', 'Parking / Extérieur', 'external', 5, 'auto', null, null)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    type = EXCLUDED.type,
    priority = EXCLUDED.priority,
    operating_mode = EXCLUDED.operating_mode;


-- Devices rows (detailed equipment count with "best guess" load ratings per zone)
INSERT INTO devices (id, zone_id, name, type, protocol, status, load_rating_kw, ip_address, port)
VALUES
  -- Bloc Opératoire 1 (z1)
  ('d1010000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'CTA Bloc Principal', 'hvac', 'BACnet', 'online', 18.4, '192.168.10.101', 47808),
  ('d1010000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Éclairage Scialytique Bloc 1', 'lighting', 'Modbus', 'online', 2.50, '192.168.10.20', 502),
  ('d1010000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Moniteurs Patient Bloc 1', 'safety', 'Modbus', 'online', 1.20, '192.168.10.21', 502),
  ('d1010000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'Traitement Air HEPA Bloc 1', 'hvac', 'BACnet', 'online', 4.50, '192.168.10.102', 47808),

  -- Bloc Opératoire 2 (z2)
  ('d1020000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'CTA Bloc Secondaire', 'hvac', 'BACnet', 'online', 16.1, '192.168.10.103', 47808),
  ('d1020000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Éclairage Scialytique Bloc 2', 'lighting', 'Modbus', 'online', 2.20, '192.168.10.22', 502),
  ('d1020000-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'Console Anesthésie Bloc 2', 'safety', 'Modbus', 'online', 1.50, '192.168.10.23', 502),

  -- Unité de Soins Intensifs (z3)
  ('d1030000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'Chiller Principal #1', 'hvac', 'BACnet', 'online', 120.0, '192.168.10.201', 47808),
  ('d1030000-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', 'Centrale Monitoring USI', 'safety', 'BACnet', 'online', 3.50, '192.168.10.202', 47808),

  -- Salle de Réveil (z4)
  ('d1040000-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', 'Chiller Secours #2', 'hvac', 'BACnet', 'offline', 120.0, '192.168.10.203', 47808),
  ('d1040000-0000-0000-0000-000000000002', '44444444-4444-4444-4444-444444444444', 'Rampe Oxygène & Monitor', 'safety', 'Modbus', 'online', 1.80, '192.168.10.24', 502),

  -- Consultations Ext. — RDC (z5)
  ('d1050000-0000-0000-0000-000000000001', '55555555-5555-5555-5555-555555555555', 'Tableau Éclairage RDC', 'lighting', 'Modbus', 'online', 8.00, '192.168.10.10', 502),
  ('d1050000-0000-0000-0000-000000000002', '55555555-5555-5555-5555-555555555555', 'Ventilo-convecteur Hall RDC', 'hvac', 'BACnet', 'online', 2.80, '192.168.10.104', 47808),

  -- Administration (z6)
  ('d1060000-0000-0000-0000-000000000001', '66666666-6666-6666-6666-666666666666', 'Contrôle Accès — 6 Portes', 'access', 'Wiegand/RS485', 'online', 0.80, '192.168.10.40', null),
  ('d1060000-0000-0000-0000-000000000002', '66666666-6666-6666-6666-666666666666', 'Climatiseur Split Bureau 1', 'hvac', 'Modbus', 'offline', 1.50, '192.168.10.41', 502),

  -- Pharmacie (z7)
  ('d1070000-0000-0000-0000-000000000001', '77777777-7777-7777-7777-777777777777', 'Détection Incendie Centrale', 'safety', 'LonWorks', 'online', 0.50, '192.168.10.50', null),
  ('d1070000-0000-0000-0000-000000000002', '77777777-7777-7777-7777-777777777777', 'Réfrigérateur Vaccins Pharmacie', 'safety', 'Modbus', 'online', 2.00, '192.168.10.51', 502),

  -- Laboratoire (z8)
  ('d1080000-0000-0000-0000-000000000001', '88888888-8888-8888-8888-888888888888', 'Ascenseurs Principal x4', 'transport', 'Modbus', 'online', 30.00, '192.168.10.30', 502),
  ('d1080000-0000-0000-0000-000000000002', '88888888-8888-8888-8888-888888888888', 'Hotte Biosécurité Labo', 'safety', 'Modbus', 'online', 3.20, '192.168.10.31', 502),

  -- Hall Principal (z9)
  ('d1090000-0000-0000-0000-000000000001', '99999999-9999-9999-9999-999999999999', 'Compteur STEG Entrée', 'meter', 'Modbus', 'online', 0.10, '192.168.10.1', 502),
  ('d1090000-0000-0000-0000-000000000002', '99999999-9999-9999-9999-999999999999', 'Éclairage Façade & Enseigne', 'lighting', 'Modbus', 'online', 4.50, '192.168.10.11', 502),

  -- Parking / Extérieur (z10)
  ('d1100000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Projecteurs LED Parking', 'lighting', 'Modbus', 'online', 5.00, '192.168.10.12', 502),
  ('d1100000-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Borne Recharge Véhicule Élec', 'transport', 'Modbus', 'offline', 22.0, '192.168.10.13', 502)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    type = EXCLUDED.type,
    protocol = EXCLUDED.protocol,
    status = EXCLUDED.status,
    load_rating_kw = EXCLUDED.load_rating_kw;


-- Historical monthly values for Polyclinique Errachid
INSERT INTO monthly_savings (clinic_id, month_name, month_order, baseline_kwh, optimized_kwh, saving_kwh, saving_percent, bill_millimes)
VALUES
  ('e74f1d2e-bb28-4c9f-863a-23910c224f8d', 'Jan', 1, 84425, 74294, 10131, 12.0, 31756213),
  ('e74f1d2e-bb28-4c9f-863a-23910c224f8d', 'Fév', 2, 87454, 76960, 10494, 12.0, 32201289),
  ('e74f1d2e-bb28-4c9f-863a-23910c224f8d', 'Mar', 3, 81614, 71820, 9794, 12.0, 30306276),
  ('e74f1d2e-bb28-4c9f-863a-23910c224f8d', 'Avr', 4, 89483, 78745, 10738, 12.0, 32957503),
  ('e74f1d2e-bb28-4c9f-863a-23910c224f8d', 'Mai', 5, 105275, 84220, 21055, 20.0, 37954195),
  ('e74f1d2e-bb28-4c9f-863a-23910c224f8d', 'Juin', 6, 151480, 121184, 30296, 20.0, 58471677),
  ('e74f1d2e-bb28-4c9f-863a-23910c224f8d', 'Juil', 7, 191916, 153533, 38383, 20.0, 75315763),
  ('e74f1d2e-bb28-4c9f-863a-23910c224f8d', 'Août', 8, 171312, 137050, 34262, 20.0, 62680412),
  ('e74f1d2e-bb28-4c9f-863a-23910c224f8d', 'Sep', 9, 120251, 96201, 24050, 20.0, 43292035),
  ('e74f1d2e-bb28-4c9f-863a-23910c224f8d', 'Oct', 10, 106225, 93478, 12747, 12.0, 52680412),
  ('e74f1d2e-bb28-4c9f-863a-23910c224f8d', 'Nov', 11, 99644, 87687, 11957, 12.0, 43292035),
  ('e74f1d2e-bb28-4c9f-863a-23910c224f8d', 'Déc', 12, 93063, 81895, 11168, 12.0, 38286092)
ON CONFLICT DO NOTHING;
