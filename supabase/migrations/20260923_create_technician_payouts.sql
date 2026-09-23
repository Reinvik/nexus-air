-- ==============================================================================
-- NEXUS AIR: Add technician payouts (NK-043) and bank details (NK-044)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS air.technician_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    payout_number TEXT NOT NULL,
    technician_id UUID REFERENCES air.technicians(id) ON DELETE SET NULL,
    technician_name TEXT NOT NULL,
    technician_role TEXT NOT NULL DEFAULT 'tecnico',
    period_month TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT NOT NULL DEFAULT 'transferencia',
    payment_reference TEXT,
    notes TEXT,
    order_ids JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

GRANT ALL ON air.technician_payouts TO anon, authenticated, service_role;

ALTER TABLE air.settings
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS bank_account_type TEXT,
ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
ADD COLUMN IF NOT EXISTS bank_account_rut TEXT,
ADD COLUMN IF NOT EXISTS bank_account_email TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_template_cobro TEXT;
