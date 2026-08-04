package middleware

import (
	"strings"

	"queue-care-backend/config"
	"queue-care-backend/errors"
	"queue-care-backend/service"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

func AuthRequired(c *fiber.Ctx) error {
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return errors.SendError(c, fiber.StatusUnauthorized, "UNAUTHORIZED", "Missing authorization header")
	}

	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		return errors.SendError(c, fiber.StatusUnauthorized, "UNAUTHORIZED", "Invalid authorization header format")
	}

	tokenStr := parts[1]
	claims := &service.TokenClaims{}
	token, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(config.AppConfig.JwtAccessSecret), nil
	})

	if err != nil || !token.Valid {
		return errors.SendError(c, fiber.StatusUnauthorized, "UNAUTHORIZED", "Invalid or expired access token")
	}

	c.Locals("userID", claims.UserID)
	c.Locals("email", claims.Email)
	c.Locals("role", claims.Role)

	return c.Next()
}
