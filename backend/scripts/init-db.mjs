import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schema = readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8');

const connectionString =
  process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? process.env.POSTGRES_URL_NON_POOLING;

if (!connectionString) {
  console.error(
    'No database connection string found. Set DATABASE_URL (or POSTGRES_URL) in backend/.env.local.'
  );
  process.exit(1);
}

const sql = neon(connectionString);

// The Neon HTTP driver runs one statement per request, so split schema.sql on ';'.
const statements = schema
  .split(';')
  .map((statement) => statement.trim())
  .filter(Boolean);

async function main() {
  console.log(`Applying schema.sql (${statements.length} statement(s))...`);
  for (const statement of statements) {
    await sql.query(statement);
  }
  console.log('Done — the "scans" table is ready.');
}

main().catch((err) => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
