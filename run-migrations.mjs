import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pool = new Pool({
  connectionString: 'postgresql://postgres:upNCchvzTbMy0Ghw@db.duzofvlrhoewqopollca.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function runMigrations() {
  const client = await pool.connect();
  try {
    console.log('Connected to database');
    
    // Read and execute migration
    const sql = readFileSync(join(__dirname, 'migrations', '0002_cost_database.sql'), 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter(s => s.trim());
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (!stmt) continue;
      
      try {
        await client.query(stmt);
        process.stdout.write(`✅ Statement ${i + 1}/${statements.length}\n`);
      } catch (err) {
        if (err.message.includes('already exists')) {
          process.stdout.write(`⚠️  Statement ${i + 1} already exists\n`);
        } else {
          process.stdout.write(`❌ Statement ${i + 1} failed: ${err.message}\n`);
        }
      }
    }
    
    console.log('\n✅ Migrations complete');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
