// lib/apiFetch.ts
export async function apiFetch(input: RequestInfo, init: RequestInit  = {}) {
  const res = await fetch(input, init);

  if (res.status === 401) {
    window.dispatchEvent(new Event('auth:logout'));
    throw new Error('Unauthorized');
  }

  return res;
}