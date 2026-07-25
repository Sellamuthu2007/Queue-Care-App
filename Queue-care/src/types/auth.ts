import { User } from './user';

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginResponse {
  message: string;
  user: User;
  access_token: string;
  refresh_token: string;
}

export interface GoogleLoginResponse {
  message: string;
  user: User;
  access_token: string;
  refresh_token: string;
}

export interface RegisterResponse {
  message: string;
  user: User;
  access_token: string;
  refresh_token: string;
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
