use crate::error::AppError;
use crate::repositories::user_repository::UserRepository;
use crate::models::user::User;
use jsonwebtoken::{encode, Header, EncodingKey, DecodingKey, Validation};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{Utc, Duration as ChronoDuration};

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub role: String,
    pub r#type: String,
    pub iat: usize,
    pub exp: usize,
}

#[derive(Clone)]
pub struct UserService {
    repo: UserRepository,
    jwt_access_secret: String,
    jwt_refresh_secret: String,
    access_expiry_minutes: i64,
    refresh_expiry_days: i64,
}

impl UserService {
    pub fn new(
        repo: UserRepository,
        jwt_access_secret: String,
        jwt_refresh_secret: String,
        access_expiry_minutes: i64,
        refresh_expiry_days: i64,
    ) -> Self {
        Self {
            repo,
            jwt_access_secret,
            jwt_refresh_secret,
            access_expiry_minutes,
            refresh_expiry_days,
        }
    }

    pub async fn get_user_by_id(&self, id: Uuid) -> Result<Option<User>, AppError> {
        Ok(self.repo.find_by_id(id).await?)
    }

    pub async fn get_user_by_phone(&self, phone: &str) -> Result<Option<User>, AppError> {
        Ok(self.repo.find_by_phone(phone).await?)
    }

    pub async fn create_user(&self, phone: &str, password_hash: &str) -> Result<User, AppError> {
        if self.repo.find_by_phone(phone).await?.is_some() {
            return Err(AppError::UserAlreadyExists);
        }
        Ok(self.repo.create_user(phone, password_hash).await?)
    }

    pub fn generate_access_token(&self, user_id: Uuid, role: &str) -> Result<String, AppError> {
        let iat = Utc::now();
        let exp = iat + ChronoDuration::minutes(self.access_expiry_minutes);

        let claims = Claims {
            sub: user_id.to_string(),
            role: role.to_string(),
            r#type: "access".to_string(),
            iat: iat.timestamp() as usize,
            exp: exp.timestamp() as usize,
        };

        encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(self.jwt_access_secret.as_bytes()),
        )
        .map_err(|e| AppError::Internal(format!("Access token generation failed: {:?}", e)))
    }

    pub fn generate_refresh_token(&self, user_id: Uuid, role: &str) -> Result<String, AppError> {
        let iat = Utc::now();
        let exp = iat + ChronoDuration::days(self.refresh_expiry_days);

        let claims = Claims {
            sub: user_id.to_string(),
            role: role.to_string(),
            r#type: "refresh".to_string(),
            iat: iat.timestamp() as usize,
            exp: exp.timestamp() as usize,
        };

        encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(self.jwt_refresh_secret.as_bytes()),
        )
        .map_err(|e| AppError::Internal(format!("Refresh token generation failed: {:?}", e)))
    }

    pub fn verify_token(&self, token: &str, is_refresh: bool) -> Result<Claims, AppError> {
        let secret = if is_refresh {
            &self.jwt_refresh_secret
        } else {
            &self.jwt_access_secret
        };

        let mut val = Validation::default();
        val.validate_exp = true;

        let token_data = jsonwebtoken::decode::<Claims>(
            token,
            &DecodingKey::from_secret(secret.as_bytes()),
            &val,
        )
        .map_err(|_| AppError::Unauthorized("Invalid token".to_string()))?;

        let expected_type = if is_refresh { "refresh" } else { "access" };
        if token_data.claims.r#type != expected_type {
            return Err(AppError::Unauthorized("Invalid token type".to_string()));
        }

        Ok(token_data.claims)
    }

    pub async fn refresh_tokens(&self, refresh_token: &str) -> Result<(String, String), AppError> {
        let claims = self.verify_token(refresh_token, true)?;
        
        let user_id = Uuid::parse_str(&claims.sub)
            .map_err(|_| AppError::Unauthorized("Invalid user sub in token".to_string()))?;

        let user = match self.repo.find_by_id(user_id).await? {
            Some(u) => u,
            None => return Err(AppError::Unauthorized("User not found".to_string())),
        };

        let new_access = self.generate_access_token(user.id, &user.role)?;
        let new_refresh = self.generate_refresh_token(user.id, &user.role)?;

        Ok((new_access, new_refresh))
    }
}
