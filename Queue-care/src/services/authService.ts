import { Platform } from 'react-native';
import { supabase } from './supabase';

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: Platform.OS === 'web' ? window.location.origin : undefined,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
  if (error) throw { code: 'AUTH_ERROR', message: error.message };
  return data;
};

export const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw { code: 'AUTH_ERROR', message: error.message };
};

export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw { code: 'AUTH_ERROR', message: error.message };
  return data.session;
};

export const onAuthStateChange = (callback: (session: any) => void) => {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
};
