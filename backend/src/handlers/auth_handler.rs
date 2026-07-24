use axum::{
    extract::State,
    http::header,
    Json,
};
use crate::error::AppError;
use crate::state::AppState;
use crate::schemas::auth_schema::{
    SendOtpRequest, SendOtpResponse, VerifyOtpRequest, VerifyOtpResponse,
    SetPasswordRequest, AuthResponse, UserPayload, RefreshTokenRequest,
    RefreshTokenResponse, LogoutRequest, LogoutResponse,
};
use crate::services::otp_service::OtpService;
use crate::services::password_service::PasswordService;
use crate::services::user_service::UserService;
use crate::repositories::otp_repository::OtpRepository;
use crate::repositories::user_repository::UserRepository;
use axum::http::Request;

pub fn normalize_phone(phone: &str) -> Result<String, AppError> {
    let clean: String = phone.chars().filter(|c| c.is_digit(10) || *c == '+').collect();
    if clean.is_empty() {
        return Err(AppError::InvalidPhone("Phone number cannot be empty".to_string()));
    }

    if clean.starts_with("+91") {
        let digits = &clean[3..];
        if digits.len() == 10 && digits.chars().all(|c| c.is_digit(10)) {
            return Ok(clean);
        }
        return Err(AppError::InvalidPhone("Please enter a valid phone number.".to_string()));
    }

    if clean.starts_with("91") && clean.len() == 12 {
        return Ok(format!("+{}", clean));
    }

    if clean.len() == 10 && clean.chars().all(|c| c.is_digit(10)) {
        return Ok(format!("+91{}", clean));
    }

    Err(AppError::InvalidPhone("Please enter a valid 10-digit phone number.".to_string()))
}

pub async fn send_otp(
    State(state): State<AppState>,
    Json(payload): Json<SendOtpRequest>,
) -> Result<Json<SendOtpResponse>, AppError> {
    let normalized = normalize_phone(&payload.phone)?;

    let otp_repo = OtpRepository::new(state.db.clone());
    let otp_service = OtpService::new(
        otp_repo,
        state.config.otp_expiry_minutes,
        state.config.otp_max_attempts,
        state.config.app_env.clone(),
    );

    otp_service.generate_and_send_otp(&normalized).await?;

    Ok(Json(SendOtpResponse {
        message: "OTP sent successfully".to_string(),
    }))
}

pub async fn verify_otp(
    State(state): State<AppState>,
    Json(payload): Json<VerifyOtpRequest>,
) -> Result<Json<VerifyOtpResponse>, AppError> {
    let normalized = normalize_phone(&payload.phone)?;
    
    if payload.otp.len() != 6 || !payload.otp.chars().all(|c| c.is_digit(10)) {
        return Err(AppError::InvalidOtp);
    }

    let otp_repo = OtpRepository::new(state.db.clone());
    let otp_service = OtpService::new(
        otp_repo,
        state.config.otp_expiry_minutes,
        state.config.otp_max_attempts,
        state.config.app_env.clone(),
    );

    let verification_token = otp_service.verify_otp(&normalized, &payload.otp).await?;

    Ok(Json(VerifyOtpResponse {
        message: "OTP verified successfully".to_string(),
        verification_token,
    }))
}

pub async fn set_password(
    State(state): State<AppState>,
    req: Request<axum::body::Body>,
) -> Result<Json<AuthResponse>, AppError> {
    // 1. Get auth header token
    let auth_header = req.headers()
        .get(header::AUTHORIZATION)
        .and_then(|v| v.to_str().ok())
        .ok_or_else(|| AppError::Unauthorized("Missing verification token".to_string()))?;

    if !auth_header.starts_with("Bearer ") {
        return Err(AppError::Unauthorized("Invalid verification token format".to_string()));
    }
    let token = &auth_header[7..];

    // Decode request body manually since we read the request above
    let body_bytes = axum::body::to_bytes(req.into_body(), usize::MAX)
        .await
        .map_err(|e| AppError::Internal(e.to_string()))?;
    let payload: SetPasswordRequest = serde_json::from_slice(&body_bytes)
        .map_err(|e| AppError::Internal(format!("Invalid request body: {}", e)))?;

    // 2. Validate password strength
    if payload.password.len() < 8 {
        return Err(AppError::InvalidPassword("Password must be at least 8 characters long.".to_string()));
    }
    if !payload.password.chars().any(|c| c.is_uppercase()) {
        return Err(AppError::InvalidPassword("Password must contain at least one uppercase letter.".to_string()));
    }
    if !payload.password.chars().any(|c| c.is_lowercase()) {
        return Err(AppError::InvalidPassword("Password must contain at least one lowercase letter.".to_string()));
    }
    if !payload.password.chars().any(|c| c.is_digit(10)) {
        return Err(AppError::InvalidPassword("Password must contain at least one number.".to_string()));
    }

    // 3. Verify temporary session token
    let otp_repo = OtpRepository::new(state.db.clone());
    let otp_service = OtpService::new(
        otp_repo,
        state.config.otp_expiry_minutes,
        state.config.otp_max_attempts,
        state.config.app_env.clone(),
    );

    let phone = otp_service.validate_verification_token(token).await?;

    // 4. Check user conflict
    let user_repo = UserRepository::new(state.db.clone());
    let user_service = UserService::new(
        user_repo,
        state.config.jwt_access_secret.clone(),
        state.config.jwt_refresh_secret.clone(),
        state.config.access_token_expiry_minutes,
        state.config.refresh_token_expiry_days,
    );

    if user_service.get_user_by_phone(&phone).await?.is_some() {
        return Err(AppError::UserAlreadyExists);
    }

    // 5. Hash password and insert user
    let password_hash = PasswordService::hash_password(&payload.password)?;
    let user = user_service.create_user(&phone, &password_hash).await?;

    // 6. Issue access and refresh tokens
    let access_token = user_service.generate_access_token(user.id, &user.role)?;
    let refresh_token = user_service.generate_refresh_token(user.id, &user.role)?;

    Ok(Json(AuthResponse {
        message: "Account created successfully".to_string(),
        user: UserPayload {
            id: user.id,
            phone: user.phone,
            role: user.role,
        },
        access_token,
        refresh_token,
    }))
}

pub async fn refresh(
    State(state): State<AppState>,
    Json(payload): Json<RefreshTokenRequest>,
) -> Result<Json<RefreshTokenResponse>, AppError> {
    let user_repo = UserRepository::new(state.db.clone());
    let user_service = UserService::new(
        user_repo,
        state.config.jwt_access_secret.clone(),
        state.config.jwt_refresh_secret.clone(),
        state.config.access_token_expiry_minutes,
        state.config.refresh_token_expiry_days,
    );

    let (access_token, refresh_token) = user_service.refresh_tokens(&payload.refresh_token).await?;

    Ok(Json(RefreshTokenResponse {
        access_token,
        refresh_token,
    }))
}

pub async fn logout(
    State(_state): State<AppState>,
    Json(_payload): Json<LogoutRequest>,
) -> Result<Json<LogoutResponse>, AppError> {
    // Revocation would happen here in stateful tracking.
    // For stateless JWT sessions, returning success and removing tokens client-side completes logout.
    Ok(Json(LogoutResponse {
        message: "Logged out successfully".to_string(),
    }))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_phone_normalization() {
        assert_eq!(normalize_phone("9876543210").unwrap(), "+919876543210");
        assert_eq!(normalize_phone("+919876543210").unwrap(), "+919876543210");
        assert_eq!(normalize_phone("919876543210").unwrap(), "+919876543210");
        assert_eq!(normalize_phone(" 9876543210 ").unwrap(), "+919876543210");
        assert_eq!(normalize_phone("987-654-3210").unwrap(), "+919876543210");
        assert!(normalize_phone("1234").is_err());
        assert!(normalize_phone("").is_err());
    }
}
