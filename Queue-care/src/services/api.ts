import { API_URL } from '../constants/api';
import * as secureStorage from '../storage/secureStorage';
import { isJwtExpired } from '../utils/jwt';

interface RequestOptions extends RequestInit {
  useAuth?: boolean;
}

let isRefreshing = false;
let authSessionVersion = 0;
let refreshSubscribers: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

export const invalidateAuthSession = () => {
  authSessionVersion += 1;
  isRefreshing = false;
  refreshSubscribers = [];
};

const subscribeTokenRefresh = (resolve: (token: string) => void, reject: (error: unknown) => void) => {
  refreshSubscribers.push({ resolve, reject });
};

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((subscriber) => subscriber.resolve(token));
  refreshSubscribers = [];
};

const onRefreshFailed = (error: unknown) => {
  refreshSubscribers.forEach((subscriber) => subscriber.reject(error));
  refreshSubscribers = [];
};

type RefreshSessionResult = {
  accessToken: string;
  refreshToken: string;
};

export const refreshSession = async (): Promise<RefreshSessionResult> => {
  const refreshToken = await secureStorage.getRefreshToken();

  if (!refreshToken) {
    throw { code: 'UNAUTHORIZED', message: 'Session expired' };
  }

  const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!refreshResponse.ok) {
    let errorPayload: any = null;
    try {
      errorPayload = await refreshResponse.json();
    } catch {
      errorPayload = null;
    }

    const message = errorPayload?.error?.message || errorPayload?.message || 'Session expired';
    throw { code: 'UNAUTHORIZED', message };
  }

  const refreshData = (await refreshResponse.json()) as {
    access_token: string;
    refresh_token: string;
  };

  await secureStorage.saveAccessToken(refreshData.access_token);
  await secureStorage.saveRefreshToken(refreshData.refresh_token);

  return {
    accessToken: refreshData.access_token,
    refreshToken: refreshData.refresh_token,
  };
};

export const isAccessTokenExpired = isJwtExpired;

export const apiRequest = async (
  endpoint: string,
  options: RequestOptions = {}
): Promise<any> => {
  const { useAuth = true, headers: customHeaders, ...restOptions } = options;
  const url = `${API_URL}${endpoint}`;

  const headers = new Headers(customHeaders);
  headers.set('Content-Type', 'application/json');
  headers.set('Bypass-Tunnel-Reminder', 'true');

  if (useAuth) {
    const token = await secureStorage.getAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const fetchOptions: RequestInit = {
    headers,
    ...restOptions,
  };

  try {
    const response = await fetch(url, fetchOptions);

    if (response.status === 401 && useAuth && !endpoint.includes('/auth/refresh')) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh(
            async (token) => {
              headers.set('Authorization', `Bearer ${token}`);
              const retryResponse = await fetch(url, { ...fetchOptions, headers });
              resolve(await handleResponse(retryResponse));
            },
            reject
          );
        });
      }

      isRefreshing = true;
      const sessionVersionAtRefreshStart = authSessionVersion;

      try {
        const { accessToken } = await refreshSession();

        if (sessionVersionAtRefreshStart !== authSessionVersion) {
          throw { code: 'UNAUTHORIZED', message: 'Session changed during refresh' };
        }

        isRefreshing = false;
        onRefreshed(accessToken);

        headers.set('Authorization', `Bearer ${accessToken}`);
        const retryResponse = await fetch(url, { ...fetchOptions, headers });
        return await handleResponse(retryResponse);
      } catch (error) {
        isRefreshing = false;
        await secureStorage.clearTokens();
        onRefreshFailed(error);
        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
          window.dispatchEvent(new Event('auth-logout'));
        }
        throw { code: 'UNAUTHORIZED', message: 'Session expired' };
      }
    }

    return await handleResponse(response);
  } catch (error) {
    if (error && ((error as any).code || (error as any).error?.code)) {
      throw error;
    }
    throw { code: 'NETWORK_ERROR', message: 'Unable to connect to the server.' };
  }
};

const handleResponse = async (response: Response): Promise<any> => {
  const contentType = response.headers.get('content-type');
  let data;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (response.ok) {
    return data;
  }

  throw data;
};
