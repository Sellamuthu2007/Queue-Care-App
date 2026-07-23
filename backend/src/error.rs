use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;
use std::fmt;

#[derive(Debug, Clone)]
pub enum AppError {
    InvalidPhone(String),
    OtpSendFailed(String),
    OtpRateLimited(String),
    OtpExpired,
    InvalidOtp,
    OtpMaxAttemptsExceeded,
    OtpAlreadyVerified,
    VerificationSessionExpired,
    VerificationSessionAlreadyUsed,
    InvalidPassword(String),
    PasswordMismatch,
    UserAlreadyExists,
    Unauthorized(String),
    Internal(String),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AppError::InvalidPhone(msg) => write!(f, "Invalid Phone: {}", msg),
            AppError::OtpSendFailed(msg) => write!(f, "OTP Send Failed: {}", msg),
            AppError::OtpRateLimited(msg) => write!(f, "OTP Rate Limited: {}", msg),
            AppError::OtpExpired => write!(f, "OTP has expired"),
            AppError::InvalidOtp => write!(f, "Invalid OTP"),
            AppError::OtpMaxAttemptsExceeded => write!(f, "Too many incorrect OTP attempts"),
            AppError::OtpAlreadyVerified => write!(f, "OTP has already been verified"),
            AppError::VerificationSessionExpired => write!(f, "Verification session expired"),
            AppError::VerificationSessionAlreadyUsed => write!(f, "Verification session already used"),
            AppError::InvalidPassword(msg) => write!(f, "Invalid Password: {}", msg),
            AppError::PasswordMismatch => write!(f, "Passwords do not match"),
            AppError::UserAlreadyExists => write!(f, "A user with this phone number already exists"),
            AppError::Unauthorized(msg) => write!(f, "Unauthorized: {}", msg),
            AppError::Internal(msg) => write!(f, "Internal error: {}", msg),
        }
    }
}

impl std::error::Error for AppError {}

#[derive(Serialize)]
struct ErrorDetail {
    code: &'static str,
    message: String,
}

#[derive(Serialize)]
struct ErrorResponse {
    error: ErrorDetail,
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, code, message) = match self {
            AppError::InvalidPhone(msg) => (StatusCode::BAD_REQUEST, "INVALID_PHONE", msg),
            AppError::OtpSendFailed(msg) => (StatusCode::INTERNAL_SERVER_ERROR, "OTP_SEND_FAILED", msg),
            AppError::OtpRateLimited(msg) => (StatusCode::TOO_MANY_REQUESTS, "OTP_RATE_LIMITED", msg),
            AppError::OtpExpired => (
                StatusCode::BAD_REQUEST,
                "OTP_EXPIRED",
                "OTP expired. Please request a new OTP.".to_string(),
            ),
            AppError::InvalidOtp => (
                StatusCode::BAD_REQUEST,
                "INVALID_OTP",
                "Invalid OTP. Please try again.".to_string(),
            ),
            AppError::OtpMaxAttemptsExceeded => (
                StatusCode::BAD_REQUEST,
                "OTP_MAX_ATTEMPTS_EXCEEDED",
                "Too many incorrect attempts. Please request a new OTP.".to_string(),
            ),
            AppError::OtpAlreadyVerified => (
                StatusCode::BAD_REQUEST,
                "OTP_ALREADY_VERIFIED",
                "OTP is already verified.".to_string(),
            ),
            AppError::VerificationSessionExpired => (
                StatusCode::BAD_REQUEST,
                "VERIFICATION_SESSION_EXPIRED",
                "Verification session has expired. Please try again.".to_string(),
            ),
            AppError::VerificationSessionAlreadyUsed => (
                StatusCode::BAD_REQUEST,
                "VERIFICATION_SESSION_ALREADY_USED",
                "Verification session has already been completed.".to_string(),
            ),
            AppError::InvalidPassword(msg) => (StatusCode::BAD_REQUEST, "INVALID_PASSWORD", msg),
            AppError::PasswordMismatch => (
                StatusCode::BAD_REQUEST,
                "PASSWORD_MISMATCH",
                "Password and confirm password do not match.".to_string(),
            ),
            AppError::UserAlreadyExists => (
                StatusCode::CONFLICT,
                "USER_ALREADY_EXISTS",
                "User with this phone number already exists.".to_string(),
            ),
            AppError::Unauthorized(msg) => (StatusCode::UNAUTHORIZED, "UNAUTHORIZED", msg),
            AppError::Internal(msg) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "INTERNAL_SERVER_ERROR",
                if cfg!(debug_assertions) { msg } else { "Something went wrong. Please try again.".to_string() },
            ),
        };

        let body = Json(ErrorResponse {
            error: ErrorDetail { code, message },
        });

        (status, body).into_response()
    }
}

// Implement converters from other error types (like sqlx::Error, jsonwebtoken::errors::Error)
impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        tracing::error!("Database error: {:?}", err);
        AppError::Internal(err.to_string())
    }
}

impl From<jsonwebtoken::errors::Error> for AppError {
    fn from(err: jsonwebtoken::errors::Error) -> Self {
        AppError::Unauthorized(format!("Invalid token: {:?}", err))
    }
}
