import 'server-only';

import { config } from '@/lib/config';
import { createPgDb } from '@/lib/db/pg';
import type { Db } from '@/lib/db/types';

export type { Db } from '@/lib/db/types';

const globalForDb = globalThis as unknown as { db?: Db };

export function db(): Db {
  if (!globalForDb.db) {
    globalForDb.db = createPgDb(config.databaseUrl);
  }
  return globalForDb.db;
}
