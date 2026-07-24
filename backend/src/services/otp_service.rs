use crate::error::AppError;
use crate::repositories::otp_repository::OtpRepository;
use chrono::{Duration as ChronoDuration, Utc};
use rand::Rng;
use sha2::{Digest, Sha256};
use uuid::Uuid;

#[derive(Clone)]
pub struct OtpService {
    repo: OtpRepository,
    otp_expiry_minutes: i64,
    otp_max_attempts: i32,
    app_env: String,
}

impl OtpService {
    pub fn new(repo: OtpRepository, otp_expiry_minutes: i64, otp_max_attempts: i32, app_env: String) -> Self {
        Self {
            repo,
            otp_expiry_minutes,
            otp_max_attempts,
            app_env,
        }
    }

    pub fn hash_sha256(data: &str) -> String {
        let mut hasher = Sha256::new();
        hasher.update(data.as_bytes());
        hex::encode(hasher.finalize())
    }

    pub async fn generate_and_send_otp(&self, phone: &str) -> Result<(), AppError> {
        // 1. Invalidate previous OTPs for this phone number
        self.repo.invalidate_previous_otps(phone).await?;

        // 2. Generate a secure 6-digit OTP
        let otp: String = {
            let mut rng = rand::thread_rng();
            let num: u32 = rng.gen_range(100000..1000000);
            num.to_string()
        };

        // 3. Hash the OTP
        let otp_hash = Self::hash_sha256(&otp);

        // 4. Save to database
        let expires_at = Utc::now() + ChronoDuration::minutes(self.otp_expiry_minutes);
        self.repo.store_otp(phone, &otp_hash, expires_at, self.otp_max_attempts).await?;

        // 5. Send OTP via SMS provider (or log in dev mode)
        if self.app_env == "development" {
            tracing::info!("[DEV ONLY] OTP generated for {}: {}", phone, otp);
            println!("[DEV ONLY] OTP generated for {}: {}", phone, otp);
        } else {
            // In production, we'd trigger the SMS provider API here
            tracing::info!("Production SMS trigger placeholder for {}", phone);
        }

        Ok(())
    }

    pub async fn verify_otp(&self, phone: &str, otp: &str) -> Result<String, AppError> {
        // 1. Find active OTP record
        let otp_record = match self.repo.find_active_otp(phone).await? {
            Some(record) => record,
            None => return Err(AppError::OtpExpired),
        };

        // 2. Check if attempts exceeded
        if otp_record.attempts >= otp_record.max_attempts {
            return Err(AppError::OtpMaxAttemptsExceeded);
        }

        // 3. Hash entered OTP and compare
        let entered_hash = Self::hash_sha256(otp);
        if otp_record.otp_hash != entered_hash {
            // Increment attempts in database
            self.repo.increment_attempts(otp_record.id).await?;
            
            // Check if we hit the limit now
            if otp_record.attempts + 1 >= otp_record.max_attempts {
                return Err(AppError::OtpMaxAttemptsExceeded);
            }
            return Err(AppError::InvalidOtp);
        }

        // 4. Check if expired
        if otp_record.expires_at < Utc::now() {
            return Err(AppError::OtpExpired);
        }

        // 5. Mark verified
        self.repo.mark_otp_verified(otp_record.id).await?;

        // 6. Generate temporary verification session
        let temp_token = Uuid::new_v4().to_string();
        let token_hash = Self::hash_sha256(&temp_token);
        
        // Verification session valid for 10 minutes
        let session_expires_at = Utc::now() + ChronoDuration::minutes(10);
        self.repo.store_session(phone, &token_hash, session_expires_at).await?;

        Ok(temp_token)
    }

    pub async fn validate_verification_token(&self, token: &str) -> Result<String, AppError> {
        let token_hash = Self::hash_sha256(token);
        
        let session = match self.repo.find_active_session(&token_hash).await? {
            Some(s) => s,
            None => return Err(AppError::VerificationSessionExpired),
        };

        if session.used {
            return Err(AppError::VerificationSessionAlreadyUsed);
        }

        if session.expires_at < Utc::now() {
            return Err(AppError::VerificationSessionExpired);
        }

        // Mark session as used
        self.repo.mark_session_used(session.id).await?;

        Ok(session.phone)
    }
}
