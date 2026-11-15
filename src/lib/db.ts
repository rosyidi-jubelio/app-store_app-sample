import 'server-only';

import postgres from 'postgres';

import { config } from '@/lib/config';

const globalForDb = globalThis as unknown as { sql?: postgres.Sql };

export function db(): postgres.Sql {
  if (!globalForDb.sql) {
    globalForDb.sql = postgres(config.databaseUrl, {
      max: 5,
      prepare: false,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }
  return globalForDb.sql;
}
