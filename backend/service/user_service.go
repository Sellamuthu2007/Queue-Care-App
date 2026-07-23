package service

import (
	"errors"
	"queue-care-backend/models"
	"queue-care-backend/repository"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type UserService struct {
	repo              *repository.UserRepository
	jwtAccessSecret   string
	jwtRefreshSecret  string
	accessExpiryMin   int
	refreshExpiryDays int
}

func NewUserService(
	repo *repository.UserRepository,
	jwtAccessSecret, jwtRefreshSecret string,
	accessExpiryMin, refreshExpiryDays int,
) *UserService {
	return &UserService{
		repo:              repo,
		jwtAccessSecret:   jwtAccessSecret,
		jwtRefreshSecret:  jwtRefreshSecret,
		accessExpiryMin:   accessExpiryMin,
		refreshExpiryDays: refreshExpiryDays,
	}
}

func (s *UserService) GetUserByID(id string) (*models.User, error) {
	return s.repo.FindByID(id)
}

func (s *UserService) GetUserByPhone(phone string) (*models.User, error) {
	return s.repo.FindByPhone(phone)
}

func (s *UserService) CreateUser(phone, passwordHash string) (*models.User, error) {
	existing, err := s.repo.FindByPhone(phone)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return nil, errors.New("USER_ALREADY_EXISTS")
	}
	return s.repo.CreateUser(phone, passwordHash)
}

func (s *UserService) GenerateAccessToken(userID string, role string) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":  userID,
		"role": role,
		"type": "access",
		"iat":  time.Now().Unix(),
		"exp":  time.Now().Add(time.Duration(s.accessExpiryMin) * time.Minute).Unix(),
	})
	return token.SignedString([]byte(s.jwtAccessSecret))
}

func (s *UserService) GenerateRefreshToken(userID string, role string) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":  userID,
		"role": role,
		"type": "refresh",
		"iat":  time.Now().Unix(),
		"exp":  time.Now().Add(time.Duration(s.refreshExpiryDays) * 24 * time.Hour).Unix(),
	})
	return token.SignedString([]byte(s.jwtRefreshSecret))
}

func (s *UserService) VerifyToken(tokenString string, isRefresh bool) (jwt.MapClaims, error) {
	secret := s.jwtAccessSecret
	if isRefresh {
		secret = s.jwtRefreshSecret
	}

	token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secret), nil
	})

	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}

	if expFloat, ok := claims["exp"].(float64); ok {
		if time.Unix(int64(expFloat), 0).Before(time.Now()) {
			return nil, errors.New("token expired")
		}
	} else {
		return nil, errors.New("missing exp claim")
	}

	expectedType := "access"
	if isRefresh {
		expectedType = "refresh"
	}
	if claims["type"] != expectedType {
		return nil, errors.New("invalid token type")
	}

	return claims, nil
}

func (s *UserService) RefreshTokens(refreshToken string) (string, string, error) {
	claims, err := s.VerifyToken(refreshToken, true)
	if err != nil {
		return "", "", err
	}

	subStr, ok := claims["sub"].(string)
	if !ok {
		return "", "", errors.New("missing sub claim")
	}

	user, err := s.repo.FindByID(subStr)
	if err != nil {
		return "", "", err
	}
	if user == nil {
		return "", "", errors.New("user not found")
	}

	newAccess, err := s.GenerateAccessToken(user.ID, user.Role)
	if err != nil {
		return "", "", err
	}

	newRefresh, err := s.GenerateRefreshToken(user.ID, user.Role)
	if err != nil {
		return "", "", err
	}

	return newAccess, newRefresh, nil
}
