package service

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"log"
	"math/big"
	"queue-care-backend/repository"
	"time"

	"github.com/google/uuid"
)

type OtpService struct {
	repo           *repository.OtpRepository
	otpExpiryMin   int
	otpMaxAttempts int
	appEnv         string
}

func NewOtpService(repo *repository.OtpRepository, otpExpiryMin, otpMaxAttempts int, appEnv string) *OtpService {
	return &OtpService{
		repo:           repo,
		otpExpiryMin:   otpExpiryMin,
		otpMaxAttempts: otpMaxAttempts,
		appEnv:         appEnv,
	}
}

func (s *OtpService) HashSha256(data string) string {
	hash := sha256.Sum256([]byte(data))
	return hex.EncodeToString(hash[:])
}

func (s *OtpService) GenerateAndSendOtp(phone string) error {
	if err := s.repo.InvalidatePreviousOtps(phone); err != nil {
		return err
	}

	var otp string
	for i := 0; i < 6; i++ {
		num, err := rand.Int(rand.Reader, big.NewInt(10))
		if err != nil {
			return err
		}
		otp += num.String()
	}

	otpHash := s.HashSha256(otp)

	expiresAt := time.Now().Add(time.Duration(s.otpExpiryMin) * time.Minute)
	_, err := s.repo.StoreOtp(phone, otpHash, expiresAt, s.otpMaxAttempts)
	if err != nil {
		return err
	}

	if s.appEnv == "development" {
		log.Printf("[DEV ONLY] OTP generated for %s: %s", phone, otp)
		fmt.Printf("[DEV ONLY] OTP generated for %s: %s\n", phone, otp)
	} else {
		log.Printf("Production SMS trigger placeholder for %s", phone)
	}

	return nil
}

func (s *OtpService) VerifyOtp(phone, otp string) (string, error) {
	otpRecord, err := s.repo.FindActiveOtp(phone)
	if err != nil {
		return "", err
	}
	if otpRecord == nil {
		return "", errors.New("OTP_EXPIRED")
	}

	if otpRecord.Attempts >= otpRecord.MaxAttempts {
		return "", errors.New("OTP_MAX_ATTEMPTS_EXCEEDED")
	}

	enteredHash := s.HashSha256(otp)
	if otpRecord.OtpHash != enteredHash {
		_ = s.repo.IncrementAttempts(otpRecord.ID)
		
		if otpRecord.Attempts+1 >= otpRecord.MaxAttempts {
			return "", errors.New("OTP_MAX_ATTEMPTS_EXCEEDED")
		}
		return "", errors.New("INVALID_OTP")
	}

	if otpRecord.ExpiresAt.Before(time.Now()) {
		return "", errors.New("OTP_EXPIRED")
	}

	if err := s.repo.MarkOtpVerified(otpRecord.ID); err != nil {
		return "", err
	}

	tempToken := uuid.NewString()
	tokenHash := s.HashSha256(tempToken)

	sessionExpiresAt := time.Now().Add(10 * time.Minute)
	_, err = s.repo.StoreSession(phone, tokenHash, sessionExpiresAt)
	if err != nil {
		return "", err
	}

	return tempToken, nil
}

func (s *OtpService) ValidateVerificationToken(token string) (string, error) {
	tokenHash := s.HashSha256(token)

	session, err := s.repo.FindActiveSession(tokenHash)
	if err != nil {
		return "", err
	}
	if session == nil {
		return "", errors.New("VERIFICATION_SESSION_EXPIRED")
	}

	if session.Used {
		return "", errors.New("VERIFICATION_SESSION_ALREADY_USED")
	}

	if session.ExpiresAt.Before(time.Now()) {
		return "", errors.New("VERIFICATION_SESSION_EXPIRED")
	}

	if err := s.repo.MarkSessionUsed(session.ID); err != nil {
		return "", err
	}

	return session.Phone, nil
}
