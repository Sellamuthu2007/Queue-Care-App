package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL            string
	ApiPort                int
	AppEnv                 string
	JwtAccessSecret        string
	JwtRefreshSecret       string
	AccessTokenExpiryMin   int
	RefreshTokenExpiryDays int
	OtpExpiryMin           int
	OtpResendCooldownSec   int
	OtpMaxAttempts         int
}

var AppConfig *Config

func LoadConfig() {
	_ = godotenv.Load()

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL is not set in the environment")
	}

	apiPort, err := strconv.Atoi(getEnv("API_PORT", "8080"))
	if err != nil {
		apiPort = 8080
	}

	accessTokenExpiryMin, _ := strconv.Atoi(getEnv("ACCESS_TOKEN_EXPIRY_MINUTES", "15"))
	refreshTokenExpiryDays, _ := strconv.Atoi(getEnv("REFRESH_TOKEN_EXPIRY_DAYS", "30"))
	otpExpiryMin, _ := strconv.Atoi(getEnv("OTP_EXPIRY_MINUTES", "5"))
	otpResendCooldownSec, _ := strconv.Atoi(getEnv("OTP_RESEND_COOLDOWN_SECONDS", "60"))
	otpMaxAttempts, _ := strconv.Atoi(getEnv("OTP_MAX_ATTEMPTS", "5"))

	AppConfig = &Config{
		DatabaseURL:            dbURL,
		ApiPort:                apiPort,
		AppEnv:                 getEnv("APP_ENV", "development"),
		JwtAccessSecret:        getEnv("JWT_ACCESS_SECRET", "default_access_secret_for_dev_only_change_in_prod"),
		JwtRefreshSecret:       getEnv("JWT_REFRESH_SECRET", "default_refresh_secret_for_dev_only_change_in_prod"),
		AccessTokenExpiryMin:   accessTokenExpiryMin,
		RefreshTokenExpiryDays: refreshTokenExpiryDays,
		OtpExpiryMin:           otpExpiryMin,
		OtpResendCooldownSec:   otpResendCooldownSec,
		OtpMaxAttempts:         otpMaxAttempts,
	}
}

func getEnv(key, defaultValue string) string {
	val := os.Getenv(key)
	if val == "" {
		return defaultValue
	}
	return val
}
