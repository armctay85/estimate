#!/bin/bash
# One-time database setup script
# Run this once to apply all migrations

echo "🗄️  EstiMate Database Setup"
echo "=========================="
echo ""
echo "This will apply all database migrations to your Supabase project."
echo ""

# Check if npx is available
if ! command -v npx &> /dev/null; then
    echo "❌ npx not found. Please install Node.js first."
    exit 1
fi

echo "📦 Installing Supabase CLI..."
npm install -g supabase

echo ""
echo "🔌 Connecting to database..."
echo "When prompted, enter your database password: upNCchvzTbMy0Ghw"
echo ""

# Create temporary SQL file
SQL_FILE=$(mktemp)
cat > "$SQL_FILE" << 'SQLEOF'
-- Core tables
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  email TEXT UNIQUE,
  role TEXT DEFAULT 'user',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'inactive',
  plan TEXT DEFAULT 'free',
  is_verified_qs BOOLEAN DEFAULT false,
  qs_license_number TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT,
  building_type TEXT,
  quality_level TEXT DEFAULT 'standard',
  region TEXT,
  status TEXT DEFAULT 'draft',
  elemental_estimate JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cost_estimates (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id),
  total_cost DECIMAL(12,2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_sessions (
  sid VARCHAR NOT NULL PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL
);

-- Cost database tables
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

CREATE TABLE IF NOT EXISTS cost_rates (
  id SERIAL PRIMARY KEY,
  element_id INTEGER NOT NULL REFERENCES elements(id),
  region TEXT NOT NULL,
  building_type TEXT NOT NULL,
  quality TEXT NOT NULL,
  low_rate DECIMAL(12, 2),
  median_rate DECIMAL(12, 2) NOT NULL,
  high_rate DECIMAL(12, 2),
  base_rate DECIMAL(12, 2),
  material_rate DECIMAL(12, 2),
  labor_rate DECIMAL(12, 2),
  equipment_rate DECIMAL(12, 2),
  sample_size INTEGER DEFAULT 0,
  source TEXT NOT NULL,
  data_quality TEXT DEFAULT 'medium',
  confidence_score DECIMAL(3, 2),
  effective_from TIMESTAMP DEFAULT NOW(),
  effective_to TIMESTAMP,
  cost_index DECIMAL(8, 4) DEFAULT 100,
  index_date TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  last_updated_by INTEGER REFERENCES users(id),
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_cost_rate UNIQUE (element_id, region, building_type, quality)
);

CREATE INDEX IF NOT EXISTS idx_cost_rates_lookup ON cost_rates(element_id, region, building_type, quality);

-- Migration tracking
CREATE TABLE IF NOT EXISTS _migrations (
  id SERIAL PRIMARY KEY,
  filename TEXT UNIQUE NOT NULL,
  applied_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO _migrations (filename) VALUES 
  ('0001_initial.sql'),
  ('0002_cost_database.sql')
ON CONFLICT DO NOTHING;

SQLEOF

echo "🚀 Applying migrations..."
psql "postgresql://postgres:upNCchvzTbMy0Ghw@db.duzofvlrhoewqopollca.supabase.co:5432/postgres" -f "$SQL_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database migrations applied successfully!"
    echo ""
    echo "Your EstiMate app is now ready to use."
else
    echo ""
    echo "❌ Migration failed. Trying alternative method..."
    echo ""
    echo "Please run this SQL manually in Supabase Dashboard:"
    echo "https://supabase.com/dashboard/project/duzofvlrhoewqopollca/sql/new"
    echo ""
    echo "SQL file location: $SQL_FILE"
fi

rm -f "$SQL_FILE"
