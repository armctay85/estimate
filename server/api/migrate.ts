import { Pool } from 'pg';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  // Security check
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.MIGRATE_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const results = [];
  const client = await pool.connect();
  
  try {
    // Create migrations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        filename TEXT UNIQUE NOT NULL,
        applied_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Get applied migrations
    const { rows: appliedRows } = await client.query('SELECT filename FROM _migrations');
    const applied = new Set(appliedRows.map(r => r.filename));

    // Get migration files
    const migrationsDir = join(process.cwd(), 'migrations');
    let files = [];
    try {
      files = readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
    } catch (e) {
      return res.json({ message: 'No migrations directory', applied: 0 });
    }

    for (const file of files) {
      if (applied.has(file)) {
        results.push({ file, status: 'skipped', reason: 'already applied' });
        continue;
      }

      try {
        const sql = readFileSync(join(migrationsDir, file), 'utf8');
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');
        await client.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
        results.push({ file, status: 'applied' });
      } catch (err) {
        await client.query('ROLLBACK');
        results.push({ file, status: 'failed', error: err.message });
        break;
      }
    }

    res.json({ 
      success: true, 
      applied: results.filter(r => r.status === 'applied').length,
      skipped: results.filter(r => r.status === 'skipped').length,
      failed: results.filter(r => r.status === 'failed').length,
      results 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
}
