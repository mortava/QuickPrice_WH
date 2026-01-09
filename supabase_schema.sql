-- QuickPrice Rate Sheets Table
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)

-- Create the rate_sheets table
CREATE TABLE IF NOT EXISTS rate_sheets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  program_type TEXT DEFAULT 'NonQM',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  margin_holdback DECIMAL(10,4) DEFAULT -1.625,
  ltv_buckets JSONB DEFAULT '["≤50","50.01-55","55.01-60","60.01-65","65.01-70","70.01-75","75.01-80","80.01-85","85.01-90"]'::jsonb,
  base_rates JSONB DEFAULT '[]'::jsonb,
  llpa_overrides JSONB DEFAULT '{}'::jsonb,
  na_overrides JSONB DEFAULT '{}'::jsonb,
  settings JSONB DEFAULT '{}'::jsonb
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_rate_sheets_published ON rate_sheets(is_published);
CREATE INDEX IF NOT EXISTS idx_rate_sheets_active ON rate_sheets(is_active);
CREATE INDEX IF NOT EXISTS idx_rate_sheets_updated ON rate_sheets(updated_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE rate_sheets ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read published rate sheets
CREATE POLICY "Anyone can read published rate sheets"
  ON rate_sheets
  FOR SELECT
  USING (is_published = true);

-- Policy: Allow all operations for now (you can restrict this later with auth)
CREATE POLICY "Allow all operations for authenticated or anon"
  ON rate_sheets
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grant access to anon and authenticated users
GRANT ALL ON rate_sheets TO anon;
GRANT ALL ON rate_sheets TO authenticated;

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_rate_sheets_updated_at ON rate_sheets;
CREATE TRIGGER update_rate_sheets_updated_at
  BEFORE UPDATE ON rate_sheets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Verify table was created
SELECT 'rate_sheets table created successfully!' as status;
