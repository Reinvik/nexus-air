-- ==============================================================================
-- NEXUS AIR: Add timing & persistence columns to air.settings (NK-038)
-- ==============================================================================

ALTER TABLE air.settings 
ADD COLUMN IF NOT EXISTS maintenance_interval_months INTEGER DEFAULT 6,
ADD COLUMN IF NOT EXISTS quality_control_days INTEGER DEFAULT 7,
ADD COLUMN IF NOT EXISTS inactive_recovery_months INTEGER DEFAULT 9,
ADD COLUMN IF NOT EXISTS pre_expiration_warning_days INTEGER DEFAULT 15,
ADD COLUMN IF NOT EXISTS company_slogan TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS default_apply_tax BOOLEAN DEFAULT true;
