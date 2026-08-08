package service

import (
	"context"
	"fmt"
	"strings"

	"queue-care-backend/config"
	"queue-care-backend/models"
	"queue-care-backend/repository"

	"github.com/golang-jwt/jwt/v5"
)

type TokenClaims struct {
	UserID string `json:"user_id"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

type SupabaseUserMetadata struct {
	Name      string `json:"name"`
	AvatarURL string `json:"avatar_url"`
	Picture   string `json:"picture"`
	FullName  string `json:"full_name"`
}

type SupabaseUser struct {
	ID           string               `json:"id"`
	Email        string               `json:"email"`
	UserMetadata SupabaseUserMetadata `json:"user_metadata"`
}

func VerifyGoogleAndLogin(ctx context.Context, supabaseAccessToken string, reqEmail string, password string) (*models.AuthResponse, error) {
	supabaseUser, err := fetchSupabaseUser(ctx, supabaseAccessToken)
	if err != nil {
		return nil, err
	}

	// Verify Google email matches user input email (case-insensitive)
	if reqEmail != "" && !strings.EqualFold(supabaseUser.Email, reqEmail) {
		return nil, fmt.Errorf("the Google account email (%s) does not match the entered email (%s)", supabaseUser.Email, reqEmail)
	}

	// Update the user's password in Supabase if a password was provided
	if err := updateSupabasePassword(ctx, supabaseAccessToken, password); err != nil {
		return nil, err
	}

	user, err := syncSupabaseUser(supabaseUser, supabaseUser.Email)
	if err != nil {
		return nil, err
	}

	return buildAuthResponse(user)
}

func LoginWithEmailPassword(ctx context.Context, email, password string) (*models.AuthResponse, error) {
	supabaseUser, err := loginSupabaseWithEmailPassword(ctx, email, password)
	if err != nil {
		return nil, err
	}

	user, err := syncSupabaseUser(supabaseUser, email)
	if err != nil {
		return nil, err
	}

	return buildAuthResponse(user)
}

func RefreshTokens(refreshTokenStr string) (*models.RefreshTokenResponse, error) {
	claims := &jwt.RegisteredClaims{}
	token, err := jwt.ParseWithClaims(refreshTokenStr, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(config.AppConfig.JwtRefreshSecret), nil
	})

	if err != nil || !token.Valid {
		return nil, fmt.Errorf("invalid or expired refresh token")
	}

	userID := claims.Subject
	user, err := repository.GetUserByID(userID)
	if err != nil {
		return nil, fmt.Errorf("user not found")
	}

	accessToken, refreshToken, err := GenerateTokens(user)
	if err != nil {
		return nil, fmt.Errorf("failed to generate tokens: %v", err)
	}

	return &models.RefreshTokenResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}
