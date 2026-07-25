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

export const sendOtp = async (phone: string) => {
  // First attempt: try logging in/sending OTP to see if user already exists (shouldCreateUser: false)
  const { error } = await supabase.auth.signInWithOtp({
    phone,
    options: {
      shouldCreateUser: false,
    },
  });

  if (!error) {
    return { exists: true };
  }

  // If error indicates user is not found, we should sign them up (shouldCreateUser: true)
  const isUserNotFoundError = 
    error.message.toLowerCase().includes('not found') || 
    error.message.toLowerCase().includes('sign up') ||
    error.message.toLowerCase().includes('invalid') ||
    error.status === 400 || 
    error.status === 422;

  if (isUserNotFoundError) {
    const { error: signUpError } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        shouldCreateUser: true,
      },
    });

    if (signUpError) {
      throw { code: 'AUTH_ERROR', message: signUpError.message };
    }

    return { exists: false };
  }

  throw { code: 'AUTH_ERROR', message: error.message };
};

export const verifyOtp = async (phone: string, token: string) => {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  });

  if (error) throw { code: 'AUTH_ERROR', message: error.message };
  if (!data.session) throw { code: 'AUTH_ERROR', message: 'Verification failed' };

  return {
    verification_token: data.session.access_token,
  };
};

export const setPassword = async (verificationToken: string, password: string) => {
  // Authenticate the supabase instance using the verification access token
  const { error: sessionError } = await supabase.auth.setSession({
    access_token: verificationToken,
    refresh_token: '',
  });
  if (sessionError) throw { code: 'AUTH_ERROR', message: sessionError.message };

  // Set the password on the current authenticated user
  const { data, error } = await supabase.auth.updateUser({
    password,
  });

  if (error) throw { code: 'AUTH_ERROR', message: error.message };
  if (!data.user) throw { code: 'AUTH_ERROR', message: 'Password update failed' };

  // Retrieve the updated session
  const { data: sessionData, error: getSessionError } = await supabase.auth.getSession();
  if (getSessionError) throw { code: 'AUTH_ERROR', message: getSessionError.message };

  const session = sessionData.session;
  if (!session) throw { code: 'AUTH_ERROR', message: 'Failed to retrieve active session after password update' };

  const user: User = {
    id: data.user.id,
    email: data.user.email || data.user.phone || '',
    phone: data.user.phone,
    role: (data.user.user_metadata?.role as User['role']) || 'patient',
  };

  return {
    user,
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  };
};
