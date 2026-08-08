type JwtPayload = {
  exp?: number;
  iat?: number;
  [key: string]: unknown;
};

const base64UrlDecode = (input: string): string => {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');

  if (typeof globalThis.atob === 'function') {
    return globalThis.atob(padded);
  }

  if (typeof Buffer !== 'undefined') {
    return Buffer.from(padded, 'base64').toString('utf8');
  }

  throw new Error('No base64 decoder available');
};

export const decodeJwtPayload = (token: string): JwtPayload | null => {
  try {
    const parts = token.split('.');
    if (parts.length < 2) {
      return null;
    }

    const payload = base64UrlDecode(parts[1]);
    return JSON.parse(payload) as JwtPayload;
  } catch {
    return null;
  }
};

export const getJwtExpiryMs = (token: string): number | null => {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) {
    return null;
  }

  return payload.exp * 1000;
};

export const isJwtExpired = (token: string, skewMs = 30_000): boolean => {
  const expiryMs = getJwtExpiryMs(token);
  if (expiryMs === null) {
    return true;
  }

  return Date.now() >= expiryMs - skewMs;
};