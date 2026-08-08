import { Platform } from 'react-native';

import Constants from 'expo-constants';

const getDevApiUrl = () => {
  // On Web, always connect to 127.0.0.1 to avoid localtunnel landing page blocks and CORS warnings
  if (Platform.OS === 'web') {
    return 'http://127.0.0.1:8080';
  }
  // On mobile, use your active localtunnel address
  return 'https://light-wolves-fold.loca.lt';
};

const DEV_API_URL = getDevApiUrl();
const PROD_API_URL = 'https://api.queuecare.com';

export const API_URL = `${(__DEV__ ? DEV_API_URL : PROD_API_URL)}/api/v1`;
console.log('[Queue Care Backend API URL]:', API_URL);

export const API_TIMEOUT = 10000;

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'qc_access_token',
  REFRESH_TOKEN: 'qc_refresh_token',
  USER: 'qc_user',
};
