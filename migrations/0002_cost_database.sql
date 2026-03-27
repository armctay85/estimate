-- Elemental Cost Database Migration
-- NRM1/AIQS Aligned Construction Cost Database

-- ============================================
-- ELEMENT CATEGORIES (NRM1 Structure)
-- ============================================
CREATE TABLE IF NOT EXISTS element_categories (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  nrm1_reference TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- ELEMENTS MASTER LIST
-- ============================================
CREATE TABLE IF NOT EXISTS elements (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  subcategory TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL,
  measurement_rules TEXT,
  exclusions TEXT,
  include_sub_elements BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- COST RATES - THE GOLD
-- ============================================
CREATE TABLE IF NOT EXISTS cost_rates (
  id SERIAL PRIMARY KEY,
  element_id INTEGER NOT NULL REFERENCES elements(id),
  region TEXT NOT NULL,
  building_type TEXT NOT NULL,
  quality TEXT NOT NULL,
  
  -- Rate ranges (percentiles)
  low_rate DECIMAL(12, 2),
  median_rate DECIMAL(12, 2) NOT NULL,
  high_rate DECIMAL(12, 2),
  
  -- Component rates
  base_rate DECIMAL(12, 2),
  material_rate DECIMAL(12, 2),
  labor_rate DECIMAL(12, 2),
  equipment_rate DECIMAL(12, 2),
  
  -- Metadata
  sample_size INTEGER DEFAULT 0,
  source TEXT NOT NULL,
  data_quality TEXT DEFAULT 'medium',
  confidence_score DECIMAL(3, 2),
  
  -- Effective date range
  effective_from TIMESTAMP DEFAULT NOW(),
  effective_to TIMESTAMP,
  
  -- Index tracking
  cost_index DECIMAL(8, 4) DEFAULT 100,
  index_date TIMESTAMP,
  
  -- Audit fields
  created_by INTEGER REFERENCES users(id),
  last_updated_by INTEGER REFERENCES users(id),
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Unique constraint for element + region + type + quality
  CONSTRAINT unique_cost_rate UNIQUE (element_id, region, building_type, quality)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_cost_rates_lookup ON cost_rates(element_id, region, building_type, quality);
CREATE INDEX IF NOT EXISTS idx_cost_rates_region ON cost_rates(region);
CREATE INDEX IF NOT EXISTS idx_cost_rates_building_type ON cost_rates(building_type);

-- ============================================
-- COST SUBMISSIONS - CROWDSOURCING
-- ============================================
CREATE TABLE IF NOT EXISTS cost_submissions (
  id SERIAL PRIMARY KEY,
  element_id INTEGER NOT NULL REFERENCES elements(id),
  project_id INTEGER REFERENCES projects(id),
  
  -- Location & Context
  region TEXT NOT NULL,
  building_type TEXT NOT NULL,
  quality TEXT NOT NULL,
  
  -- Submitted rate
  rate DECIMAL(12, 2) NOT NULL,
  quantity DECIMAL(12, 4),
  total_cost DECIMAL(14, 2),
  
  -- Project context
  project_name TEXT,
  project_value DECIMAL(14, 2),
  project_date TIMESTAMP,
  contractor_name TEXT,
  project_description TEXT,
  
  -- Submission metadata
  submitted_by INTEGER NOT NULL REFERENCES users(id),
  submitted_at TIMESTAMP DEFAULT NOW(),
  
  -- Verification workflow
  status TEXT DEFAULT 'pending',
  verified BOOLEAN DEFAULT false,
  verified_by INTEGER REFERENCES users(id),
  verified_at TIMESTAMP,
  verification_notes TEXT,
  
  -- Quality indicators
  has_documentation BOOLEAN DEFAULT false,
  documentation_url TEXT,
  is_qs_submitted BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cost_submissions_status ON cost_submissions(status);
CREATE INDEX IF NOT EXISTS idx_cost_submissions_element ON cost_submissions(element_id);
CREATE INDEX IF NOT EXISTS idx_cost_submissions_submitted_by ON cost_submissions(submitted_by);

-- ============================================
-- REGIONAL FACTORS
-- ============================================
CREATE TABLE IF NOT EXISTS regional_factors (
  id SERIAL PRIMARY KEY,
  region TEXT NOT NULL UNIQUE,
  region_code TEXT,
  state TEXT NOT NULL,
  
  -- Base comparison (Sydney = 1.0)
  base_region TEXT DEFAULT 'Sydney',
  overall_factor DECIMAL(5, 3) NOT NULL,
  
  -- Component factors
  labor_factor DECIMAL(5, 3) DEFAULT 1.0,
  material_factor DECIMAL(5, 3) DEFAULT 1.0,
  equipment_factor DECIMAL(5, 3) DEFAULT 1.0,
  transport_factor DECIMAL(5, 3) DEFAULT 1.0,
  
  -- Regional metadata
  cost_index DECIMAL(8, 4) DEFAULT 100,
  index_date TIMESTAMP,
  
  -- Market conditions
  market_condition TEXT DEFAULT 'stable',
  availability_notes TEXT,
  
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- COST INDEX HISTORY
-- ============================================
CREATE TABLE IF NOT EXISTS cost_index_history (
  id SERIAL PRIMARY KEY,
  region TEXT NOT NULL,
  building_type TEXT,
  category TEXT,
  
  index_value DECIMAL(8, 4) NOT NULL,
  base_date TIMESTAMP,
  index_date TIMESTAMP NOT NULL,
  
  -- Change tracking
  monthly_change DECIMAL(6, 3),
  annual_change DECIMAL(6, 3),
  
  -- Source
  source TEXT,
  source_url TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cost_index_lookup ON cost_index_history(region, index_date);

-- ============================================
-- BUILDING TYPES REFERENCE
-- ============================================
CREATE TABLE IF NOT EXISTS building_types (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  typical_height TEXT,
  typical_complexity TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- QUALITY LEVELS REFERENCE
-- ============================================
CREATE TABLE IF NOT EXISTS quality_levels (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  typical_specifications TEXT,
  cost_multiplier DECIMAL(5, 3) DEFAULT 1.0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- COST RATE AUDIT LOG
-- ============================================
CREATE TABLE IF NOT EXISTS cost_rate_audits (
  id SERIAL PRIMARY KEY,
  cost_rate_id INTEGER NOT NULL,
  element_id INTEGER NOT NULL,
  
  action TEXT NOT NULL,
  field_changed TEXT,
  old_value TEXT,
  new_value TEXT,
  
  changed_by INTEGER REFERENCES users(id),
  changed_at TIMESTAMP DEFAULT NOW(),
  reason TEXT,
  
  rate_snapshot JSONB
);

CREATE INDEX IF NOT EXISTS idx_cost_rate_audits_rate ON cost_rate_audits(cost_rate_id);

-- ============================================
-- USER EXTENSIONS (Add QS verification fields)
-- ============================================
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS is_verified_qs BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS qs_license_number TEXT;

-- ============================================
-- PROJECT EXTENSIONS (Add elemental estimation)
-- ============================================
ALTER TABLE projects 
  ADD COLUMN IF NOT EXISTS building_type TEXT,
  ADD COLUMN IF NOT EXISTS quality_level TEXT DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS region TEXT,
  ADD COLUMN IF NOT EXISTS elemental_estimate JSONB;

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_elements_updated_at ON elements;
DROP TRIGGER IF EXISTS update_cost_rates_updated_at ON cost_rates;
DROP TRIGGER IF EXISTS update_regional_factors_updated_at ON regional_factors;

-- Create triggers
CREATE TRIGGER update_elements_updated_at 
  BEFORE UPDATE ON elements 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cost_rates_updated_at 
  BEFORE UPDATE ON cost_rates 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_regional_factors_updated_at 
  BEFORE UPDATE ON regional_factors 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
