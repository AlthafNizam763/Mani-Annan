import { auth } from './firebase';

export const PRODUCTION_API_URL = 'https://mani-annan.onrender.com/api/v1';
export const LOCAL_DEV_API_URL = 'http://localhost:8001/api/v1';

/**
 * Checks if a given URL or hostname points to a local address (localhost / loopback).
 */
export function isLocalAddress(urlOrHost?: string): boolean {
  if (!urlOrHost) return false;
  return /^(https?:\/\/)?(localhost|127\.0\.0\.1|0\.0\.0\.0|::1)(:\d+)?(\/.*)?$/i.test(urlOrHost.trim());
}

/**
 * Determines the appropriate API base URL with fail-safe remote production protection.
 *
 * Rules:
 * 1. If running in a browser on a remote host (e.g. https://mani-annan.vercel.app or preview):
 *    - Any accidental localhost base URL (e.g. http://localhost:8001) is strictly rejected.
 *    - Defaults to the live production Render backend: https://mani-annan.onrender.com/api/v1.
 *    - If rawBase is provided and is a valid remote URL, it is used.
 * 2. If running locally (localhost / 127.0.0.1):
 *    - Honors rawBase if provided, otherwise defaults to http://localhost:8001/api/v1.
 * 3. If running in Node / SSR in production mode:
 *    - Rejects localhost, defaults to https://mani-annan.onrender.com/api/v1.
 */
export function getEffectiveApiBase(rawBase?: string, mockHostname?: string): string {
  const trimmed = rawBase?.trim();

  // Determine current hostname (supporting test mocks and runtime browser window)
  let hostname: string | null = null;
  if (mockHostname) {
    hostname = mockHostname;
  } else if (typeof window !== 'undefined' && window.location) {
    hostname = window.location.hostname;
  }

  // Scenario 1: Running in a browser environment
  if (hostname) {
    const isLocalBrowser = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
    if (!isLocalBrowser) {
      if (trimmed && isLocalAddress(trimmed)) {
        console.warn(
          `[Mani API Client] Rejecting unsafe localhost API base ("${trimmed}") on remote domain "${hostname}". Routing to production Render backend: ${PRODUCTION_API_URL}`
        );
        return PRODUCTION_API_URL;
      }
      if (trimmed && trimmed.length > 0) {
        return trimmed;
      }
      return PRODUCTION_API_URL;
    }

    // Local browser environment (localhost / 127.0.0.1)
    if (trimmed && trimmed.length > 0) {
      return trimmed;
    }
    return LOCAL_DEV_API_URL;
  }

  // Scenario 2: Server-side rendering / build-time in production
  if (process.env.NODE_ENV === 'production') {
    if (trimmed && isLocalAddress(trimmed)) {
      console.warn(
        `[Mani API Client] Rejecting unsafe localhost API base ("${trimmed}") in production SSR/build environment. Routing to production Render backend: ${PRODUCTION_API_URL}`
      );
      return PRODUCTION_API_URL;
    }
    if (trimmed && trimmed.length > 0) {
      return trimmed;
    }
    return PRODUCTION_API_URL;
  }

  // Scenario 3: Local Node development / test
  if (trimmed && trimmed.length > 0) {
    return trimmed;
  }
  return LOCAL_DEV_API_URL;
}

export function resolveApiUrl(rawBase: string | undefined, path: string, mockHostname?: string): string {
  const effectiveBase = getEffectiveApiBase(rawBase, mockHostname);
  const base = effectiveBase.replace(/\/+$/, '');
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
  let res: Response;
  try {
    res = await fetch(fullUrl, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (netErr: any) {
    const error: any = new Error(`Network failure calling ${method} ${fullUrl}: ${netErr.message || 'Failed to fetch'}`);
    error.isNetworkError = true;
    error.targetUrl = fullUrl;
    error.originalError = netErr;
    throw error;
  }

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
    error.targetUrl = fullUrl;
    throw error;
  }

  return res.json();
}
