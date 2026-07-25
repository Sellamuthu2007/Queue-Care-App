import { Platform } from 'react-native';
import { supabase } from './supabase';
import { User } from '../types/user';

export const login = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw { code: 'AUTH_ERROR', message: error.message };
  if (!data.user || !data.session) throw { code: 'AUTH_ERROR', message: 'Login failed' };

  const user: User = {
    id: data.user.id,
    email: data.user.email || email,
    role: (data.user.user_metadata?.role as User['role']) || 'patient',
  };

  return {
    user,
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  };
};

export const signUp = async (email: string, password: string, name: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, role: 'patient' } },
  });
  if (error) throw { code: 'AUTH_ERROR', message: error.message };
  if (!data.user) throw { code: 'AUTH_ERROR', message: 'Sign up failed' };

  const user: User = {
    id: data.user.id,
    email: data.user.email || email,
    role: (data.user.user_metadata?.role as User['role']) || 'patient',
  };

  const access_token = data.session?.access_token || '';
  const refresh_token = data.session?.refresh_token || '';

  return { user, access_token, refresh_token };
};

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
