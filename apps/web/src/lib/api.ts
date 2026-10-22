import { auth } from './firebase';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1';

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

  const res = await fetch(`${API_BASE}${path}`, {
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
