export const API_BASE_URL = import.meta.env.VITE_BASE_URL as string;

export function getToken(): string | null {
  try {
    return localStorage.getItem('auth_token');
  } catch {
    return null;
  }
}

export function setToken(token: string) {
  try {
    localStorage.setItem('auth_token', token);
  } catch {
    // ignore storage errors
  }
}

export type ApiError = {
  status: number;
  message: string;
};

export async function apiFetch<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const base = API_BASE_URL?.replace(/\/$/, '') || '';
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;

  const headers = new Headers(init.headers || {});
  if (!headers.has('Content-Type') && init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(url, { ...init, headers });

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // non-JSON response
  }

  if (!res.ok) {
    const err: ApiError = {
      status: res.status,
      message: (data && (data.message || data.error)) || res.statusText || 'Request failed',
    };
    throw err;
  }
  return (data ?? ({} as any)) as T;
}
