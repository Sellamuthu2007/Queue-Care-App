import { API_URL } from '../constants/api';
import * as secureStorage from '../storage/secureStorage';

interface RequestOptions extends RequestInit {
  useAuth?: boolean;
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

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
        return new Promise((resolve) => {
          subscribeTokenRefresh(async (token) => {
            headers.set('Authorization', `Bearer ${token}`);
            const retryResponse = await fetch(url, { ...fetchOptions, headers });
            resolve(await handleResponse(retryResponse));
          });
        });
      }

      isRefreshing = true;
      const refreshToken = await secureStorage.getRefreshToken();
      
      if (!refreshToken) {
        isRefreshing = false;
        await secureStorage.clearTokens();
        throw { code: 'UNAUTHORIZED', message: 'Session expired' };
      }

      try {
        const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (refreshResponse.status !== 200) {
          throw new Error('Refresh failed');
        }

        const refreshData = await refreshResponse.json();
        await secureStorage.saveAccessToken(refreshData.access_token);
        await secureStorage.saveRefreshToken(refreshData.refresh_token);

        isRefreshing = false;
        onRefreshed(refreshData.access_token);

        headers.set('Authorization', `Bearer ${refreshData.access_token}`);
        const retryResponse = await fetch(url, { ...fetchOptions, headers });
        return await handleResponse(retryResponse);
      } catch (error) {
        isRefreshing = false;
        refreshSubscribers = [];
        await secureStorage.clearTokens();
        // Throw special event for context to capture
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
