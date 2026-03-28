import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = 'https://duzofvlrhoewqopollca.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1em9mdmxyaG9ld3FvcG9sbGNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzE4NjM2NSwiZXhwIjoyMDU4NzYyMzY1fQ.YOUR_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigrations() {
  try {
    // Read migration file
    const sql = readFileSync(join(__dirname, 'migrations', '0002_cost_database.sql'), 'utf8');
    
    // Split into statements
    const statements = sql.split(';').filter(s => s.trim());
    
    console.log(`Found ${statements.length} SQL statements`);
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (!stmt) continue;
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: stmt });
        
        if (error) {
          if (error.message.includes('already exists')) {
            console.log(`⚠️  Statement ${i + 1}: Already exists`);
          } else {
            console.error(`❌ Statement ${i + 1} failed:`, error.message);
          }
        } else {
          console.log(`✅ Statement ${i + 1} applied`);
        }
      } catch (err) {
        console.error(`❌ Statement ${i + 1} error:`, err.message);
      }
    }
    
    console.log('\n✅ Migrations complete');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

runMigrations();
