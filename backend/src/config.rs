use std::env;

#[derive(Clone, Debug)]
pub struct Config {
    pub database_url: String,
    pub api_port: u16,
    pub app_env: String,
    pub jwt_access_secret: String,
    pub jwt_refresh_secret: String,
    pub access_token_expiry_minutes: i64,
    pub refresh_token_expiry_days: i64,
    pub otp_expiry_minutes: i64,
    pub otp_resend_cooldown_seconds: i64,
    pub otp_max_attempts: i32,
    pub sms_provider_api_key: Option<String>,
    pub sms_provider_url: Option<String>,
}

impl Config {
    pub fn from_env() -> Self {
        dotenvy::dotenv().ok(); // Load .env file if it exists

        let database_url = env::var("DATABASE_URL")
            .expect("DATABASE_URL environment variable must be set");

        let api_port = env::var("API_PORT")
            .unwrap_or_else(|_| "8080".to_string())
            .parse::<u16>()
            .expect("API_PORT must be a valid port number");

        let app_env = env::var("APP_ENV")
            .unwrap_or_else(|_| "development".to_string());

        let jwt_access_secret = env::var("JWT_ACCESS_SECRET")
            .unwrap_or_else(|_| "default_access_secret_for_dev_only_change_in_prod".to_string());

        let jwt_refresh_secret = env::var("JWT_REFRESH_SECRET")
            .unwrap_or_else(|_| "default_refresh_secret_for_dev_only_change_in_prod".to_string());

        let access_token_expiry_minutes = env::var("ACCESS_TOKEN_EXPIRY_MINUTES")
            .unwrap_or_else(|_| "15".to_string())
            .parse::<i64>()
            .unwrap_or(15);

        let refresh_token_expiry_days = env::var("REFRESH_TOKEN_EXPIRY_DAYS")
            .unwrap_or_else(|_| "30".to_string())
            .parse::<i64>()
            .unwrap_or(30);

        let otp_expiry_minutes = env::var("OTP_EXPIRY_MINUTES")
            .unwrap_or_else(|_| "5".to_string())
            .parse::<i64>()
            .unwrap_or(5);

        let otp_resend_cooldown_seconds = env::var("OTP_RESEND_COOLDOWN_SECONDS")
            .unwrap_or_else(|_| "60".to_string())
            .parse::<i64>()
            .unwrap_or(60);

        let otp_max_attempts = env::var("OTP_MAX_ATTEMPTS")
            .unwrap_or_else(|_| "5".to_string())
            .parse::<i32>()
            .unwrap_or(5);

        let sms_provider_api_key = env::var("SMS_PROVIDER_API_KEY").ok().filter(|s| !s.is_empty());
        let sms_provider_url = env::var("SMS_PROVIDER_URL").ok().filter(|s| !s.is_empty());

        Self {
            database_url,
            api_port,
            app_env,
            jwt_access_secret,
            jwt_refresh_secret,
            access_token_expiry_minutes,
            refresh_token_expiry_days,
            otp_expiry_minutes,
            otp_resend_cooldown_seconds,
            otp_max_attempts,
            sms_provider_api_key,
            sms_provider_url,
        }
    }
}
