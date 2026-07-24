import { User } from './user';

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface SendOtpResponse {
  message: string;
  exists: boolean;
}

export interface VerifyOtpResponse {
  message: string;
  verification_token: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  access_token: string;
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
}

export interface LogoutResponse {
  message: string;
}
