package service

import (
	"time"

	"queue-care-backend/config"
	"queue-care-backend/models"

	"github.com/golang-jwt/jwt/v5"
)

func GenerateTokens(user *models.User) (string, string, error) {
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

func buildAuthResponse(user *models.User) (*models.AuthResponse, error) {
	accessToken, refreshToken, err := GenerateTokens(user)
	if err != nil {
		return nil, err
	}

	return &models.AuthResponse{
		Message:      "Login successful",
		User:         *user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}