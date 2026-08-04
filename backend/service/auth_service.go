package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

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
	supabaseURL := config.AppConfig.SupabaseURL
	supabaseAnonKey := config.AppConfig.SupabaseAnonKey

	if supabaseURL == "" || supabaseAnonKey == "" {
		return nil, fmt.Errorf("supabase URL or Anon Key is not configured on the backend")
	}

	url := fmt.Sprintf("%s/auth/v1/user", supabaseURL)
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create http request: %v", err)
	}

	req.Header.Set("apikey", supabaseAnonKey)
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", supabaseAccessToken))

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to call supabase auth API: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("invalid supabase access token, status code: %d", resp.StatusCode)
	}

	var supabaseUser SupabaseUser
	if err := json.NewDecoder(resp.Body).Decode(&supabaseUser); err != nil {
		return nil, fmt.Errorf("failed to decode user details: %v", err)
	}

	// Verify Google email matches user input email (case-insensitive)
	if reqEmail != "" && !strings.EqualFold(supabaseUser.Email, reqEmail) {
		return nil, fmt.Errorf("the Google account email (%s) does not match the entered email (%s)", supabaseUser.Email, reqEmail)
	}

	// Update the user's password in Supabase if a password was provided
	if password != "" {
		updateURL := fmt.Sprintf("%s/auth/v1/user", supabaseURL)
		type PasswordUpdateRequest struct {
			Password string `json:"password"`
		}
		reqBody, err := json.Marshal(PasswordUpdateRequest{Password: password})
		if err != nil {
			return nil, fmt.Errorf("failed to marshal password update request: %v", err)
		}

		updateReq, err := http.NewRequestWithContext(ctx, "PUT", updateURL, bytes.NewBuffer(reqBody))
		if err != nil {
			return nil, fmt.Errorf("failed to create password update request: %v", err)
		}

		updateReq.Header.Set("apikey", supabaseAnonKey)
		updateReq.Header.Set("Authorization", fmt.Sprintf("Bearer %s", supabaseAccessToken))
		updateReq.Header.Set("Content-Type", "application/json")

		updateResp, err := client.Do(updateReq)
		if err != nil {
			return nil, fmt.Errorf("failed to call supabase password update API: %v", err)
		}
		defer updateResp.Body.Close()

		if updateResp.StatusCode != http.StatusOK {
			var errorBody map[string]interface{}
			_ = json.NewDecoder(updateResp.Body).Decode(&errorBody)
			msg := "failed to update password in Supabase"
			if errorBody != nil && errorBody["msg"] != nil {
				msg = fmt.Sprintf("Supabase password error: %v", errorBody["msg"])
			}
			return nil, fmt.Errorf(msg)
		}
	}

	// Sync User in database
	googleID := supabaseUser.ID
	email := supabaseUser.Email
	name := supabaseUser.UserMetadata.FullName
	if name == "" {
		name = supabaseUser.UserMetadata.Name
	}
	avatarURL := supabaseUser.UserMetadata.Picture
	if avatarURL == "" {
		avatarURL = supabaseUser.UserMetadata.AvatarURL
	}

	user, err := repository.GetOrCreateUserByGoogleID(googleID, email, name, avatarURL)
	if err != nil {
		return nil, fmt.Errorf("failed to sync user in database: %v", err)
	}

	// Generate Go JWT tokens
	accessToken, refreshToken, err := GenerateTokens(user)
	if err != nil {
		return nil, fmt.Errorf("failed to generate app tokens: %v", err)
	}

	return &models.AuthResponse{
		Message:      "Login successful",
		User:         *user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}

func LoginWithEmailPassword(ctx context.Context, email, password string) (*models.AuthResponse, error) {
	supabaseURL := config.AppConfig.SupabaseURL
	supabaseAnonKey := config.AppConfig.SupabaseAnonKey

	if supabaseURL == "" || supabaseAnonKey == "" {
		return nil, fmt.Errorf("supabase URL or Anon Key is not configured on the backend")
	}

	url := fmt.Sprintf("%s/auth/v1/token?grant_type=password", supabaseURL)

	type LoginRequest struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	reqBody, err := json.Marshal(LoginRequest{Email: email, Password: password})
	if err != nil {
		return nil, fmt.Errorf("failed to marshal login request: %v", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(reqBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create login request: %v", err)
	}

	req.Header.Set("apikey", supabaseAnonKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to call supabase login API: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var errorBody map[string]interface{}
		_ = json.NewDecoder(resp.Body).Decode(&errorBody)
		msg := "invalid email or password"
		if errorBody != nil && errorBody["error_description"] != nil {
			msg = fmt.Sprintf("%v", errorBody["error_description"])
		} else if errorBody != nil && errorBody["msg"] != nil {
			msg = fmt.Sprintf("%v", errorBody["msg"])
		}
		return nil, fmt.Errorf(msg)
	}

	type SupabaseTokenResponse struct {
		AccessToken string `json:"access_token"`
	}
	var tokenResp SupabaseTokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return nil, fmt.Errorf("failed to decode login token: %v", err)
	}

	// Fetch user details from Supabase using the access token
	userURL := fmt.Sprintf("%s/auth/v1/user", supabaseURL)
	userReq, err := http.NewRequestWithContext(ctx, "GET", userURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create user request: %v", err)
	}

	userReq.Header.Set("apikey", supabaseAnonKey)
	userReq.Header.Set("Authorization", fmt.Sprintf("Bearer %s", tokenResp.AccessToken))

	userResp, err := client.Do(userReq)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch user details: %v", err)
	}
	defer userResp.Body.Close()

	if userResp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to retrieve user details from Supabase")
	}

	var supabaseUser SupabaseUser
	if err := json.NewDecoder(userResp.Body).Decode(&supabaseUser); err != nil {
		return nil, fmt.Errorf("failed to decode user details: %v", err)
	}

	// Sync User in database
	googleID := supabaseUser.ID
	name := supabaseUser.UserMetadata.FullName
	if name == "" {
		name = supabaseUser.UserMetadata.Name
	}
	if name == "" {
		parts := strings.Split(email, "@")
		name = parts[0]
	}
	avatarURL := supabaseUser.UserMetadata.Picture
	if avatarURL == "" {
		avatarURL = supabaseUser.UserMetadata.AvatarURL
	}

	user, err := repository.GetOrCreateUserByGoogleID(googleID, email, name, avatarURL)
	if err != nil {
		return nil, fmt.Errorf("failed to sync user in database: %v", err)
	}

	// Generate Go JWT tokens
	accessToken, refreshToken, err := GenerateTokens(user)
	if err != nil {
		return nil, fmt.Errorf("failed to generate app tokens: %v", err)
	}

	return &models.AuthResponse{
		Message:      "Login successful",
		User:         *user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
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

func GenerateTokens(user *models.User) (string, string, error) {
	// Access Token (short-lived)
	accessClaims := TokenClaims{
		UserID: user.ID,
		Email:  user.Email,
		Role:   user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(config.AppConfig.AccessTokenExpiryMin) * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	accessTokenObj := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	accessToken, err := accessTokenObj.SignedString([]byte(config.AppConfig.JwtAccessSecret))
	if err != nil {
		return "", "", err
	}

	// Refresh Token (long-lived)
	refreshClaims := jwt.RegisteredClaims{
		Subject:   user.ID,
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(config.AppConfig.RefreshTokenExpiryDays) * 24 * time.Hour)),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
	}
	refreshTokenObj := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshToken, err := refreshTokenObj.SignedString([]byte(config.AppConfig.JwtRefreshSecret))
	if err != nil {
		return "", "", err
	}

	return accessToken, refreshToken, nil
}
