import 'server-only';

import { db } from '@/lib/db';
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

type InstallRow = {
  merchant_id: string;
  access_token: string;
  access_token_expires_at: Date;
  refresh_token: string | null;
  scopes: string[];
  installed_at: Date;
  updated_at: Date;
};

const SELECT_INSTALL = `
  select
    merchant_id,
    access_token,
    access_token_expires_at,
    refresh_token,
    scopes,
    installed_at,
    updated_at
  from installs
  where merchant_id = $1
`;

const UPSERT_INSTALL = `
  insert into installs (
    merchant_id,
    access_token,
    access_token_expires_at,
    refresh_token,
    scopes
  ) values (
    $1,
    $2,
    $3,
    $4,
    $5
  )
  on conflict (merchant_id) do update set
    access_token = excluded.access_token,
    access_token_expires_at = excluded.access_token_expires_at,
    refresh_token = coalesce(excluded.refresh_token, installs.refresh_token),
    scopes = excluded.scopes,
    updated_at = now()
  returning
    merchant_id,
    access_token,
    access_token_expires_at,
    refresh_token,
    scopes,
    installed_at,
    updated_at
`;

const DELETE_EXPIRED_SESSION_TOKENS = `
  delete from used_session_tokens
  where expires_at < now() - interval '1 minute'
`;

const INSERT_SESSION_TOKEN = `
  insert into used_session_tokens (
    jti,
    expires_at
  ) values (
    $1,
    $2
  )
  on conflict (jti) do nothing
`;

function toInstall(row: InstallRow): Install {
  return {
    merchantId: row.merchant_id,
    accessToken: row.access_token,
    accessTokenExpiresAt: row.access_token_expires_at.getTime(),
    refreshToken: row.refresh_token,
    scopes: row.scopes,
    installedAt: row.installed_at.getTime(),
    updatedAt: row.updated_at.getTime(),
  };
}

export async function getInstall(merchantId: string): Promise<Install | null> {
  const [row] = await db().query<InstallRow>(SELECT_INSTALL, [merchantId]);
  return row ? toInstall(row) : null;
}

export async function saveTokens(set: TokenSet): Promise<Install> {
  const [row] = await db().query<InstallRow>(UPSERT_INSTALL, [
    set.merchant_id,
    set.access_token,
    new Date(Date.now() + set.expires_in * 1000),
    set.refresh_token ?? null,
    set.scopes ?? [],
  ]);
  return toInstall(row);
}

export async function markSessionTokenUsed(jti: string, expiresAtSeconds: number): Promise<boolean> {
  await db().execute(DELETE_EXPIRED_SESSION_TOKENS);
  const inserted = await db().execute(INSERT_SESSION_TOKEN, [
    jti,
    new Date(expiresAtSeconds * 1000),
  ]);
  return inserted === 1;
}
