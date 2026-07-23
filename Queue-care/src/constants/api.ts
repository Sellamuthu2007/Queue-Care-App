import { Platform } from 'react-native';

import Constants from 'expo-constants';

const getDevApiUrl = () => {
  // Extract host IP from Metro bundler hostUri (e.g. "192.168.1.100:8081")
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
  if (!hostUri) {
    // Web environment or direct fallback
    return 'http://localhost:8080';
  }

  const host = hostUri.split(':')[0];
  return `http://${host}:8080`;
};

const DEFAULT_API_URL = 'https://silver-impalas-juggle.loca.lt';

export const API_URL = `${DEFAULT_API_URL}/api/v1`;
console.log('[Queue Care Backend API URL]:', API_URL);

export const API_TIMEOUT = 10000;

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'qc_access_token',
  REFRESH_TOKEN: 'qc_refresh_token',
  USER: 'qc_user',
};
