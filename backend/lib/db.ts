import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

let cached: NeonQueryFunction<false, false> | undefined;

function getClient(): NeonQueryFunction<false, false> {
  if (!cached) {
    const connectionString =
      process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? process.env.POSTGRES_URL_NON_POOLING;
    if (!connectionString) {
      throw new Error(
        'No database connection string found. Set DATABASE_URL (or POSTGRES_URL) in your environment.'
      );
    }
    cached = neon(connectionString);
  }
  return cached;
}

// Lazily resolves the connection so importing this module (e.g. during
// `next build`'s page-data collection) never requires env vars to be set —
// only actually running a query does.
export function sql(strings: TemplateStringsArray, ...values: unknown[]) {
  return getClient()(strings, ...values);
}
