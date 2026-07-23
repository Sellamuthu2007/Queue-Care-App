import { Platform } from 'react-native';
import { STORAGE_KEYS } from '../constants/api';
import { User } from '../types/user';

const nodeMemoryStore: Record<string, string> = {};
const isServer = typeof window === 'undefined';

const getClientStore = () => {
  if (isServer) {
    return {
      getItem: (key: string) => nodeMemoryStore[key] || null,
      setItem: (key: string, val: string) => { nodeMemoryStore[key] = val; },
      removeItem: (key: string) => { delete nodeMemoryStore[key]; },
    };
  }
  
  if (Platform.OS === 'web') {
    return localStorage;
  }
  
  return require('expo-secure-store');
};

const store = getClientStore();

export const saveAccessToken = async (token: string): Promise<void> => {
  if (Platform.OS === 'web' || isServer) {
    store.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  } else {
    await store.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, token);
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web' || isServer) {
    return store.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  } else {
    return await store.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
  }
};

export const removeAccessToken = async (): Promise<void> => {
  if (Platform.OS === 'web' || isServer) {
    store.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  } else {
    await store.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
  }
};

export const saveRefreshToken = async (token: string): Promise<void> => {
  if (Platform.OS === 'web' || isServer) {
    store.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  } else {
    await store.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, token);
  }
};

export const getRefreshToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web' || isServer) {
    return store.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  } else {
    return await store.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
  }
};

export const removeRefreshToken = async (): Promise<void> => {
  if (Platform.OS === 'web' || isServer) {
    store.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  } else {
    await store.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
  }
};

export const saveUser = async (user: User): Promise<void> => {
  const data = JSON.stringify(user);
  if (Platform.OS === 'web' || isServer) {
    store.setItem(STORAGE_KEYS.USER, data);
  } else {
    await store.setItemAsync(STORAGE_KEYS.USER, data);
  }
};

export const getUser = async (): Promise<User | null> => {
  let userJson: string | null;
  if (Platform.OS === 'web' || isServer) {
    userJson = store.getItem(STORAGE_KEYS.USER);
  } else {
    userJson = await store.getItemAsync(STORAGE_KEYS.USER);
  }

  if (!userJson) return null;
  try {
    return JSON.parse(userJson) as User;
  } catch {
    return null;
  }
};

export const removeUser = async (): Promise<void> => {
  if (Platform.OS === 'web' || isServer) {
    store.removeItem(STORAGE_KEYS.USER);
  } else {
    await store.deleteItemAsync(STORAGE_KEYS.USER);
  }
};

export const clearTokens = async (): Promise<void> => {
  await Promise.all([
    removeAccessToken(),
    removeRefreshToken(),
    removeUser(),
  ]);
};
