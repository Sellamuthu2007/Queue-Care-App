package models

import (
	"database/sql"
	"time"
)

type User struct {
	ID           string    `db:"id" json:"id"`
	Phone        string    `db:"phone" json:"phone"`
	PasswordHash string    `db:"password_hash" json:"-"`
	IsVerified   bool      `db:"is_verified" json:"is_verified"`
	Role         string    `db:"role" json:"role"`
	CreatedAt    time.Time `db:"created_at" json:"created_at"`
	UpdatedAt    time.Time `db:"updated_at" json:"updated_at"`
}

type OtpVerification struct {
	ID          string       `db:"id"`
	Phone       string       `db:"phone"`
	OtpHash     string       `db:"otp_hash"`
	ExpiresAt   time.Time    `db:"expires_at"`
	Attempts    int          `db:"attempts"`
	MaxAttempts int          `db:"max_attempts"`
	Verified    bool         `db:"verified"`
	CreatedAt   time.Time    `db:"created_at"`
	VerifiedAt  sql.NullTime `db:"verified_at"`
}

type OtpVerificationSession struct {
	ID        string    `db:"id"`
	Phone     string    `db:"phone"`
	TokenHash string    `db:"token_hash"`
	ExpiresAt time.Time `db:"expires_at"`
	Used      bool      `db:"used"`
	CreatedAt time.Time `db:"created_at"`
}
