import 'server-only';

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { TokenSet } from '@/lib/jubelio';

export type Install = {
  merchantId: string;
  accessToken: string;
  accessTokenExpiresAt: number;
  refreshToken: string | null;
  scopes: string[];
  installedAt: number;
  updatedAt: number;
};

const DATA_DIR = path.join(process.cwd(), '.data');
const STORE_FILE = path.join(DATA_DIR, 'installs.json');

async function readAll(): Promise<Record<string, Install>> {
  try {
    return JSON.parse(await readFile(STORE_FILE, 'utf8'));
  } catch {
    return {};
  }
}

async function writeAll(installs: Record<string, Install>) {
  await mkdir(DATA_DIR, { recursive: true });
  const tmp = `${STORE_FILE}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(installs, null, 2), { mode: 0o600 });
  await rename(tmp, STORE_FILE);
}

export async function getInstall(merchantId: string): Promise<Install | null> {
  const installs = await readAll();
  return installs[merchantId] ?? null;
}

export async function saveTokens(set: TokenSet): Promise<Install> {
  const installs = await readAll();
  const now = Date.now();
  const existing = installs[set.merchant_id];
  const install: Install = {
    merchantId: set.merchant_id,
    accessToken: set.access_token,
    accessTokenExpiresAt: now + set.expires_in * 1000,
    refreshToken: set.refresh_token ?? existing?.refreshToken ?? null,
    scopes: set.scopes ?? [],
    installedAt: existing?.installedAt ?? now,
    updatedAt: now,
  };
  installs[set.merchant_id] = install;
  await writeAll(installs);
  return install;
}
