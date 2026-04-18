// lib/apiFetch.ts
import { getSystemToken } from '@/lib/system-user';

export async function apiFetch(input: RequestInfo, init: RequestInit  = {}) {
  const res = await fetch(input, init);

  if (res.status !== 401 || typeof window === 'undefined') {
    return res;
  }

  const headers = new Headers(init.headers ?? {});
  headers.set('Authorization', `Bearer ${getSystemToken()}`);

  return fetch(input, {
    ...init,
    headers,
  });
}