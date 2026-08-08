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
)

func validateSupabaseConfig() (string, string, error) {
	supabaseURL := config.AppConfig.SupabaseURL
	supabaseAnonKey := config.AppConfig.SupabaseAnonKey

	if supabaseURL == "" || supabaseAnonKey == "" {
		return "", "", fmt.Errorf("supabase URL or Anon Key is not configured on the backend")
	}

	return supabaseURL, supabaseAnonKey, nil
}

func fetchSupabaseUser(ctx context.Context, supabaseAccessToken string) (*SupabaseUser, error) {
	supabaseURL, supabaseAnonKey, err := validateSupabaseConfig()
	if err != nil {
		return nil, err
	}

	url := fmt.Sprintf("%s/auth/v1/user", supabaseURL)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
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

	return &supabaseUser, nil
}

func updateSupabasePassword(ctx context.Context, supabaseAccessToken, password string) error {
	if password == "" {
		return nil
	}

	supabaseURL, supabaseAnonKey, err := validateSupabaseConfig()
	if err != nil {
		return err
	}

	updateURL := fmt.Sprintf("%s/auth/v1/user", supabaseURL)
	type PasswordUpdateRequest struct {
		Password string `json:"password"`
	}
	reqBody, err := json.Marshal(PasswordUpdateRequest{Password: password})
	if err != nil {
		return fmt.Errorf("failed to marshal password update request: %v", err)
	}

	updateReq, err := http.NewRequestWithContext(ctx, http.MethodPut, updateURL, bytes.NewBuffer(reqBody))
	if err != nil {
		return fmt.Errorf("failed to create password update request: %v", err)
	}

	updateReq.Header.Set("apikey", supabaseAnonKey)
	updateReq.Header.Set("Authorization", fmt.Sprintf("Bearer %s", supabaseAccessToken))
	updateReq.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	updateResp, err := client.Do(updateReq)
	if err != nil {
		return fmt.Errorf("failed to call supabase password update API: %v", err)
	}
	defer updateResp.Body.Close()

	if updateResp.StatusCode != http.StatusOK {
		var errorBody map[string]interface{}
		_ = json.NewDecoder(updateResp.Body).Decode(&errorBody)
		msg := "failed to update password in Supabase"
		if errorBody != nil && errorBody["msg"] != nil {
			msg = fmt.Sprintf("Supabase password error: %v", errorBody["msg"])
		}
		return fmt.Errorf(msg)
	}

	return nil
}

func loginSupabaseWithEmailPassword(ctx context.Context, email, password string) (*SupabaseUser, error) {
	supabaseURL, supabaseAnonKey, err := validateSupabaseConfig()
	if err != nil {
		return nil, err
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

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewBuffer(reqBody))
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

	return fetchSupabaseUser(ctx, tokenResp.AccessToken)
}

func normalizeSupabaseUser(user *SupabaseUser, fallbackEmail string) (googleID, email, name, avatarURL string) {
	googleID = user.ID
	email = user.Email
	name = user.UserMetadata.FullName
	if name == "" {
		name = user.UserMetadata.Name
	}
	if name == "" {
		parts := strings.Split(fallbackEmail, "@")
		name = parts[0]
	}
	avatarURL = user.UserMetadata.Picture
	if avatarURL == "" {
		avatarURL = user.UserMetadata.AvatarURL
	}
	return googleID, email, name, avatarURL
}