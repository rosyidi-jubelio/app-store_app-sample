'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const REQUEST_TIMEOUT_MS = 5000;

type Status = 'checking' | 'standalone' | 'failed';

function requestSessionToken(appStoreOrigin: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (window.parent === window) {
      reject(new Error('standalone'));
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

export function SessionRecovery({ appStoreOrigin }: { appStoreOrigin: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('checking');
  const [reason, setReason] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    requestSessionToken(appStoreOrigin)
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
  }, [appStoreOrigin, router]);

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
