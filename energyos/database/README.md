# EnergyOS — Database Migrations

All SQL scripts for the EnergyOS Supabase/PostgreSQL database live here.

## Naming Convention

```
NNN_description.sql
```

- `NNN` — zero-padded sequential number (001, 002, 003…)
- `description` — short snake_case summary of what the migration does

## How to Run

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**
2. Paste the contents of the migration file
3. Click **Run**
4. Migrations should be run **in order** (001 first, then 002, etc.)

## Current Migrations

| File | Description |
|------|-------------|
| `001_initial_schema.sql` | Creates all 8 tables, indexes, and RLS policies |
| `002_finance_and_savings.sql` | Creates `monthly_savings` table, RLS, and seeds real Polyclinique Errachid data (10 zones, 20 devices, historical records) |

## Notes

- All tables use `UUID` primary keys (via `pgcrypto`)
- `energy_metrics` uses `BIGINT GENERATED ALWAYS AS IDENTITY` for high-volume telemetry
- RLS is enabled on **all tables** — `anon` can only INSERT into `access_requests` and SELECT from `access_codes`
- Everything else requires `service_role` (used by the Express backend)
