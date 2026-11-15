import 'server-only';

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

import { config } from '@/lib/config';

const VERSION = 'v1';

function key() {
  const raw = Buffer.from(config.tokenEncryptionKey, 'base64');
  if (raw.length !== 32) {
    throw new Error('TOKEN_ENCRYPTION_KEY must be 32 bytes, base64 encoded');
  }
  return raw;
}

export function encrypt(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString('base64url'), tag.toString('base64url'), ciphertext.toString('base64url')].join(':');
}

export function decrypt(value: string): string {
  const [version, iv, tag, ciphertext] = value.split(':');
  if (version !== VERSION || !iv || !tag || !ciphertext) {
    throw new Error('unsupported encrypted value');
  }
  const decipher = createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(ciphertext, 'base64url')), decipher.final()]).toString('utf8');
}
