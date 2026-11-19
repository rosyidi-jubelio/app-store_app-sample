'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const REQUEST_TIMEOUT_MS = 5000;

type Status = 'checking' | 'standalone' | 'failed';

function parentOrigin(): string | null {
  const ancestor = window.location.ancestorOrigins?.[0];
  if (ancestor) return ancestor;
  try {
    return new URL(document.referrer).origin;
  } catch {
    return null;
  }
}

function isAllowedOrigin(origin: string, allowed: string[]): boolean {
  const url = new URL(origin);
  return allowed.some((pattern) => {
    if (!pattern.includes('://*.')) return pattern === origin;
    const [scheme, host] = pattern.split('://*.');
    return url.protocol === `${scheme}:` && url.hostname.endsWith(`.${host}`);
  });
}

function requestSessionToken(appStoreOrigins: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    if (window.parent === window) {
      reject(new Error('standalone'));
      return;
    }

    const appStoreOrigin = parentOrigin();
    if (!appStoreOrigin || !isAllowedOrigin(appStoreOrigin, appStoreOrigins)) {
      reject(new Error('unknown_parent'));
      return;
    }

    const timer = window.setTimeout(() => {
      window.removeEventListener('message', onMessage);
      reject(new Error('timeout'));
    }, REQUEST_TIMEOUT_MS);

    function onMessage(event: MessageEvent) {
      if (event.origin !== appStoreOrigin || event.source !== window.parent) return;
      const data = event.data;
      if (data?.type === 'jubelio.session_token' && typeof data.session_token === 'string') {
        window.clearTimeout(timer);
        window.removeEventListener('message', onMessage);
        resolve(data.session_token);
      }
      if (data?.type === 'jubelio.session_token.error') {
        window.clearTimeout(timer);
        window.removeEventListener('message', onMessage);
        reject(new Error(String(data.error)));
      }
    }

    window.addEventListener('message', onMessage);
    window.parent.postMessage({ type: 'jubelio.session_token.request' }, appStoreOrigin);
  });
}

export function SessionRecovery({ appStoreOrigins }: { appStoreOrigins: string[] }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('checking');
  const [reason, setReason] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    requestSessionToken(appStoreOrigins)
      .then((sessionToken) => {
        if (cancelled) return null;
        return fetch('/api/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_token: sessionToken }),
        });
      })
      .then(async (res) => {
        if (!res) return;
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error ?? `HTTP ${res.status}`);
        }
        if (!cancelled) router.refresh();
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setReason(err.message);
        setStatus(err.message === 'standalone' ? 'standalone' : 'failed');
      });

    return () => {
      cancelled = true;
    };
  }, [appStoreOrigins, router]);

  if (status === 'checking') {
    return <p>Meminta session token ke Jubelio App Store...</p>;
  }

  if (status === 'failed') {
    return (
      <p className="text-destructive">
        Tidak bisa mendapatkan session token dari Jubelio App Store ({reason}). Tutup lalu buka app
        lagi dari Jubelio.
      </p>
    );
  }

  return (
    <p>
      Buka app ini dari Jubelio App Store. App berjalan di dalam iframe App Store dan mengenali
      siapa yang membukanya lewat session token.
    </p>
  );
}
