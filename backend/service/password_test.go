package service

import (
	"testing"
)

func TestArgon2PasswordHashing(t *testing.T) {
	s := NewPasswordService()
	password := "SecurePassword123"

	hash, err := s.HashPassword(password)
	if err != nil {
		t.Fatalf("Failed to hash password: %v", err)
	}

	if hash == "" {
		t.Fatal("Expected non-empty hash string")
	}

	valid, err := s.VerifyPassword(password, hash)
	if err != nil {
		t.Fatalf("Failed to verify password: %v", err)
	}

	if !valid {
		t.Fatal("Expected password verification to succeed")
	}

	wrongValid, err := s.VerifyPassword("wrong_password", hash)
	if err != nil {
		t.Fatalf("Failed to verify password: %v", err)
	}

	if wrongValid {
		t.Fatal("Expected password verification to fail for incorrect password")
	}
}
