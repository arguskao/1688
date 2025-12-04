-- Create company_settings table for quote configuration
CREATE TABLE IF NOT EXISTS company_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    company_name TEXT NOT NULL DEFAULT '',
    company_phone TEXT NOT NULL DEFAULT '',
    company_fax TEXT,
    company_address TEXT,
    company_email TEXT,
    tax_id TEXT,
    quote_validity_days INTEGER NOT NULL DEFAULT 15,
    payment_terms TEXT,
    quote_notes TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT single_row CHECK (id = 1)
);

-- Insert default settings
INSERT INTO company_settings (id, company_name, company_phone, quote_validity_days, payment_terms, quote_notes)
VALUES (1, '', '', 15, '簽約金 30%，進場 30%，完工驗收 40%', '本報價單經簽認後即視為正式合約的一部分。')
ON CONFLICT (id) DO NOTHING;

-- Add project_name column to quotes table for quote document
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS project_name TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS project_address TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS customer_tax_id TEXT;

-- Add unit column to quote_items for pricing
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT '式';
