use axum::{
    async_trait,
    extract::FromRequestParts,
    http::request::Parts,
    Extension,
    RequestPartsExt,
};
use crate::error::AppError;
use crate::state::AppState;
use crate::models::user::User;
use uuid::Uuid;

pub struct AuthenticatedUser(pub User);

#[async_trait]
impl<S> FromRequestParts<S> for AuthenticatedUser
where
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let Extension(state) = parts
            .extract::<Extension<AppState>>()
            .await
            .map_err(|_| AppError::Internal("AppState extension not found".to_string()))?;

        let auth_header = parts
            .headers
            .get("Authorization")
            .and_then(|value| value.to_str().ok())
            .ok_or_else(|| AppError::Unauthorized("Missing Authorization header".to_string()))?;

        if !auth_header.starts_with("Bearer ") {
            return Err(AppError::Unauthorized("Authorization header must start with Bearer".to_string()));
        }

        let token = &auth_header[7..];

        let user_service = crate::services::user_service::UserService::new(
            crate::repositories::user_repository::UserRepository::new(state.db.clone()),
            state.config.jwt_access_secret.clone(),
            state.config.jwt_refresh_secret.clone(),
            state.config.access_token_expiry_minutes,
            state.config.refresh_token_expiry_days,
        );

        let claims = user_service.verify_token(token, false)?;

        let user_id = Uuid::parse_str(&claims.sub)
            .map_err(|_| AppError::Unauthorized("Invalid token subject".to_string()))?;

        let user = user_service
            .get_user_by_id(user_id)
            .await?
            .ok_or_else(|| AppError::Unauthorized("User not found".to_string()))?;

        Ok(AuthenticatedUser(user))
    }
}
