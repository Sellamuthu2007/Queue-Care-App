use crate::models::otp_verification::{OtpVerification, OtpVerificationSession};
use sqlx::{PgPool, Result};
use chrono::{DateTime, Utc};
use uuid::Uuid;

#[derive(Clone, Debug)]
pub struct OtpRepository {
    db: PgPool,
}

impl OtpRepository {
    pub fn new(db: PgPool) -> Self {
        Self { db }
    }

    pub async fn invalidate_previous_otps(&self, phone: &str) -> Result<()> {
        sqlx::query(
            "UPDATE otp_verifications 
             SET expires_at = CURRENT_TIMESTAMP 
             WHERE phone = $1 AND verified = FALSE AND expires_at > CURRENT_TIMESTAMP"
        )
        .bind(phone)
        .execute(&self.db)
        .await
        .map(|_| ())
    }

    pub async fn store_otp(&self, phone: &str, otp_hash: &str, expires_at: DateTime<Utc>, max_attempts: i32) -> Result<OtpVerification> {
        sqlx::query_as::<_, OtpVerification>(
            "INSERT INTO otp_verifications (phone, otp_hash, expires_at, max_attempts) 
             VALUES ($1, $2, $3, $4) 
             RETURNING *"
        )
        .bind(phone)
        .bind(otp_hash)
        .bind(expires_at)
        .bind(max_attempts)
        .fetch_one(&self.db)
        .await
    }

    pub async fn find_active_otp(&self, phone: &str) -> Result<Option<OtpVerification>> {
        sqlx::query_as::<_, OtpVerification>(
            "SELECT * FROM otp_verifications 
             WHERE phone = $1 AND verified = FALSE AND expires_at > CURRENT_TIMESTAMP AND attempts < max_attempts 
             ORDER BY created_at DESC LIMIT 1"
        )
        .bind(phone)
        .fetch_optional(&self.db)
        .await
    }

    pub async fn increment_attempts(&self, id: Uuid) -> Result<()> {
        sqlx::query("UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = $1")
            .bind(id)
            .execute(&self.db)
            .await
            .map(|_| ())
    }

    pub async fn mark_otp_verified(&self, id: Uuid) -> Result<()> {
        sqlx::query("UPDATE otp_verifications SET verified = TRUE, verified_at = CURRENT_TIMESTAMP WHERE id = $1")
            .bind(id)
            .execute(&self.db)
            .await
            .map(|_| ())
    }

    pub async fn store_session(&self, phone: &str, token_hash: &str, expires_at: DateTime<Utc>) -> Result<OtpVerificationSession> {
        sqlx::query_as::<_, OtpVerificationSession>(
            "INSERT INTO otp_verification_sessions (phone, token_hash, expires_at) 
             VALUES ($1, $2, $3) 
             RETURNING *"
        )
        .bind(phone)
        .bind(token_hash)
        .bind(expires_at)
        .fetch_one(&self.db)
        .await
    }

    pub async fn find_active_session(&self, token_hash: &str) -> Result<Option<OtpVerificationSession>> {
        sqlx::query_as::<_, OtpVerificationSession>(
            "SELECT * FROM otp_verification_sessions 
             WHERE token_hash = $1 AND used = FALSE AND expires_at > CURRENT_TIMESTAMP"
        )
        .bind(token_hash)
        .fetch_optional(&self.db)
        .await
    }

    pub async fn mark_session_used(&self, id: Uuid) -> Result<()> {
        sqlx::query("UPDATE otp_verification_sessions SET used = TRUE WHERE id = $1")
            .bind(id)
            .execute(&self.db)
            .await
            .map(|_| ())
    }
}
