package repository

import (
	"database/sql"
	"errors"
	"queue-care-backend/db"
	"queue-care-backend/models"
	"time"
)

type OtpRepository struct{}

func NewOtpRepository() *OtpRepository {
	return &OtpRepository{}
}

func (r *OtpRepository) InvalidatePreviousOtps(phone string) error {
	_, err := db.DB.Exec(
		"UPDATE otp_verifications SET expires_at = CURRENT_TIMESTAMP WHERE phone = $1 AND verified = FALSE AND expires_at > CURRENT_TIMESTAMP",
		phone,
	)
	return err
}

func (r *OtpRepository) StoreOtp(phone, otpHash string, expiresAt time.Time, maxAttempts int) (*models.OtpVerification, error) {
	var otp models.OtpVerification
	err := db.DB.Get(&otp,
		"INSERT INTO otp_verifications (phone, otp_hash, expires_at, max_attempts) VALUES ($1, $2, $3, $4) RETURNING *",
		phone, otpHash, expiresAt, maxAttempts,
	)
	if err != nil {
		return nil, err
	}
	return &otp, nil
}

func (r *OtpRepository) FindActiveOtp(phone string) (*models.OtpVerification, error) {
	var otp models.OtpVerification
	err := db.DB.Get(&otp,
		"SELECT * FROM otp_verifications WHERE phone = $1 AND verified = FALSE AND expires_at > CURRENT_TIMESTAMP AND attempts < max_attempts ORDER BY created_at DESC LIMIT 1",
		phone,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &otp, nil
}

func (r *OtpRepository) IncrementAttempts(id string) error {
	_, err := db.DB.Exec("UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = $1", id)
	return err
}

func (r *OtpRepository) MarkOtpVerified(id string) error {
	_, err := db.DB.Exec("UPDATE otp_verifications SET verified = TRUE, verified_at = CURRENT_TIMESTAMP WHERE id = $1", id)
	return err
}

func (r *OtpRepository) StoreSession(phone, tokenHash string, expiresAt time.Time) (*models.OtpVerificationSession, error) {
	var session models.OtpVerificationSession
	err := db.DB.Get(&session,
		"INSERT INTO otp_verification_sessions (phone, token_hash, expires_at) VALUES ($1, $2, $3) RETURNING *",
		phone, tokenHash, expiresAt,
	)
	if err != nil {
		return nil, err
	}
	return &session, nil
}

func (r *OtpRepository) FindActiveSession(tokenHash string) (*models.OtpVerificationSession, error) {
	var session models.OtpVerificationSession
	err := db.DB.Get(&session,
		"SELECT * FROM otp_verification_sessions WHERE token_hash = $1 AND used = FALSE AND expires_at > CURRENT_TIMESTAMP",
		tokenHash,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &session, nil
}

func (r *OtpRepository) MarkSessionUsed(id string) error {
	_, err := db.DB.Exec("UPDATE otp_verification_sessions SET used = TRUE WHERE id = $1", id)
	return err
}
