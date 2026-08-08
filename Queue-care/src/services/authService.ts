import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { apiRequest } from './api';
import { AuthResponse } from '../types/auth';

WebBrowser.maybeCompleteAuthSession();

export const signInWithGoogle = async (email?: string, password?: string): Promise<AuthResponse> => {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://rsuvywcjejuzkjvwknqe.supabase.co';
  
  // Use Linking to create a deep link pointing back to the app's redirect/login handler.
  // In development/Expo Go, this resolves to something like exp://10.208.36.174:8081/--/redirect
  // In standard builds, this resolves to queuecare://redirect
  const redirectUrl = Linking.createURL('redirect');
  console.log('[Google Sign-In Redirect URL]:', redirectUrl);
  
  // Construct the Supabase OAuth URL
  const authUrl = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUrl)}`;

  let authResult;
  try {
    if (Platform.OS === 'web') {
      authResult = await WebBrowser.openAuthSessionAsync(authUrl, window.location.origin);
    } else {
      authResult = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
    }
  } catch (error: any) {
    throw { code: 'AUTH_ERROR', message: error.message || 'Failed to open authentication session' };
  }

  if (authResult.type !== 'success' || !authResult.url) {
    throw { code: 'AUTH_ERROR', message: 'Google Sign-In was cancelled or failed' };
  }

  // Parse the redirect URL containing Supabase tokens (usually in the URL fragment '#access_token=...&refresh_token=...')
  const urlString = authResult.url;
  console.log('[Supabase Redirect URL Received]:', urlString);

  const hashIndex = urlString.indexOf('#');
  const queryIndex = urlString.indexOf('?');
  const searchPart = hashIndex !== -1 ? urlString.slice(hashIndex + 1) : (queryIndex !== -1 ? urlString.slice(queryIndex + 1) : '');

  if (!searchPart) {
    throw { code: 'AUTH_ERROR', message: 'No authentication tokens or parameters found in redirect URL' };
  }

  // Parse the parameters manually to handle hash query fragment styles
  const params: Record<string, string> = {};
  searchPart.split('&').forEach((part) => {
    const [key, val] = part.split('=');
    if (key && val) {
      params[decodeURIComponent(key)] = decodeURIComponent(val);
    }
  });

  // Check if Supabase returned an OAuth error
  if (params['error'] || params['error_description']) {
    const errMsg = params['error_description'] || params['error'];
    throw { code: 'AUTH_ERROR', message: `Auth Server Error: ${errMsg}` };
  }

  const supabaseAccessToken = params['access_token'];
  if (!supabaseAccessToken) {
    throw { code: 'AUTH_ERROR', message: 'Failed to retrieve access token from redirect URL' };
  }

  // Call our Go backend to exchange the Supabase access token for the backend JWT
  const response = await apiRequest('/auth/google', {
    method: 'POST',
    useAuth: false,
    body: JSON.stringify({ 
      access_token: supabaseAccessToken,
      email,
      password
    }),
  });

  return response as AuthResponse;
};

export const signInWithEmailPassword = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await apiRequest('/auth/login', {
    method: 'POST',
    useAuth: false,
    body: JSON.stringify({ email, password }),
  });

  return response as AuthResponse;
};

export const logout = async (): Promise<void> => {
  // No-op since local session tokens are cleared from secure storage inside AuthContext
};
