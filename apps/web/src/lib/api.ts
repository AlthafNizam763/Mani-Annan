import { auth } from './firebase';

export function resolveApiUrl(rawBase: string | undefined, path: string): string {
  const base = (rawBase || 'http://localhost:8001/api/v1').trim().replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // If base already ends with /api/v1
  if (base.endsWith('/api/v1')) {
    if (cleanPath === '/api/v1') {
      return base;
    }
    if (cleanPath.startsWith('/api/v1/')) {
      return `${base}${cleanPath.slice(7)}`;
    }
    return `${base}${cleanPath}`;
  }

  // If base does not end with /api/v1
  if (cleanPath.startsWith('/api/v1')) {
    return `${base}${cleanPath}`;
  }
  return `${base}/api/v1${cleanPath}`;
}

export async function apiRequest<T = any>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: any;
    token?: string;
  } = {}
): Promise<T> {
  const { method = 'GET', body, token } = options;

  let activeToken = token;
  // If no token explicitly provided, automatically fetch fresh Firebase ID Token from currentUser
  if (!activeToken && auth.currentUser) {
    try {
      activeToken = await auth.currentUser.getIdToken();
    } catch {
      // Token retrieval failed
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (activeToken) {
    headers['Authorization'] = `Bearer ${activeToken}`;
  }

  const fullUrl = resolveApiUrl(process.env.NEXT_PUBLIC_API_URL, path);
  const res = await fetch(fullUrl, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let errMessage = `HTTP ${res.status}`;
    let errData: any = {};
    try {
      errData = await res.json();
      errMessage = errData.message || errData.error || errMessage;
    } catch {}
    const error: any = new Error(errMessage);
    error.statusCode = res.status;
    error.status = errData.status || (errData.error === 'ProviderNotConfigured' ? 'not_configured' : 'error');
    error.error = errData.error;
    throw error;
  }

  return res.json();
}
