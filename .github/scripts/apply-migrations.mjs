import pg from 'pg';
import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runMigrations() {
  const client = await pool.connect();
  let applied = 0;
  let failed = 0;
  
  try {
    // Create migrations tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        filename TEXT UNIQUE NOT NULL,
        applied_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Get list of applied migrations
    const { rows: appliedMigrations } = await client.query(
      'SELECT filename FROM _migrations'
    );
    const appliedSet = new Set(appliedMigrations.map(r => r.filename));
    
    // Get all migration files
    const migrationsDir = join(__dirname, '..', '..', 'migrations');
    const files = readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    console.log(`Found ${files.length} migration files`);
    
    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`⏭️  Skipping ${file} (already applied)`);
        continue;
      }
      
      console.log(`🔄 Applying ${file}...`);
      const sql = readFileSync(join(migrationsDir, file), 'utf8');
      
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');
        
        // Record migration
        await client.query(
          'INSERT INTO _migrations (filename) VALUES ($1)',
          [file]
        );
        
        console.log(`✅ Applied ${file}`);
        applied++;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`❌ Failed ${file}: ${err.message}`);
        failed++;
        throw err; // Stop on failure
      }
    }
    
    console.log(`\n✅ Complete: ${applied} applied, ${failed} failed`);
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
