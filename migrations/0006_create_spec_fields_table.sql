-- Create spec_fields table for customizable product specification fields
CREATE TABLE IF NOT EXISTS spec_fields (
  id SERIAL PRIMARY KEY,
  field_name TEXT NOT NULL UNIQUE,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text', -- text, number, select
  options TEXT, -- JSON array for select type options
  display_order INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spec_fields_display_order ON spec_fields(display_order);
