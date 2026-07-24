use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Deserialize, Clone)]
pub struct SendOtpRequest {
    pub phone: String,
}

#[derive(Debug, Serialize)]
pub struct SendOtpResponse {
    pub message: String,
}

#[derive(Debug, Deserialize, Clone)]
pub struct VerifyOtpRequest {
    pub phone: String,
    pub otp: String,
}

#[derive(Debug, Serialize)]
pub struct VerifyOtpResponse {
    pub message: String,
    pub verification_token: String,
}

#[derive(Debug, Deserialize, Clone)]
pub struct SetPasswordRequest {
    pub password: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct UserPayload {
    pub id: Uuid,
    pub phone: String,
    pub role: String,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub message: String,
    pub user: UserPayload,
    pub access_token: String,
    pub refresh_token: String,
}

#[derive(Debug, Deserialize, Clone)]
pub struct RefreshTokenRequest {
    pub refresh_token: String,
}

#[derive(Debug, Serialize)]
pub struct RefreshTokenResponse {
    pub access_token: String,
    pub refresh_token: String,
}

#[derive(Debug, Deserialize, Clone)]
pub struct LogoutRequest {
    pub refresh_token: String,
}

#[derive(Debug, Serialize)]
pub struct LogoutResponse {
    pub message: String,
}
