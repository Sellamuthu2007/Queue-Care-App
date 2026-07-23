import { apiRequest } from './api';
import { SendOtpResponse, VerifyOtpResponse, AuthResponse, LogoutResponse } from '../types/auth';

export const sendOtp = async (phone: string): Promise<SendOtpResponse> => {
  return await apiRequest('/auth/send-otp', {
    method: 'POST',
    useAuth: false,
    body: JSON.stringify({ phone }),
  });
};

export const verifyOtp = async (phone: string, otp: string): Promise<VerifyOtpResponse> => {
  return await apiRequest('/auth/verify-otp', {
    method: 'POST',
    useAuth: false,
    body: JSON.stringify({ phone, otp }),
  });
};

export const setPassword = async (verificationToken: string, password: string): Promise<AuthResponse> => {
  return await apiRequest('/auth/set-password', {
    method: 'POST',
    useAuth: false,
    headers: {
      Authorization: `Bearer ${verificationToken}`,
    },
    body: JSON.stringify({ password }),
  });
};

export const login = async (phone: string, password: string): Promise<AuthResponse> => {
  return await apiRequest('/auth/login', {
    method: 'POST',
    useAuth: false,
    body: JSON.stringify({ phone, password }),
  });
};

export const logout = async (refreshToken: string): Promise<LogoutResponse> => {
  return await apiRequest('/auth/logout', {
    method: 'POST',
    useAuth: true,
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
};
