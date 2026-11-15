import { Pool } from 'pg';

import type { Db } from '@/lib/db/types';

export function createPgDb(connectionString: string): Db {
  const pool = new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 10_000,
  });

  return {
    async query<T>(text: string, params: unknown[] = []) {
      const result = await pool.query(text, params);
      return result.rows as T[];
    },
    async execute(text: string, params: unknown[] = []) {
      const result = await pool.query(text, params);
      return result.rowCount ?? 0;
    },
  };
}
