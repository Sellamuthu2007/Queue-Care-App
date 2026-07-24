package middleware

import (
	"queue-care-backend/config"
	"queue-care-backend/errors"
	"queue-care-backend/repository"
	"queue-care-backend/service"
	"strings"

	"github.com/gofiber/fiber/v2"
)

func AuthRequired() fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return errors.SendError(c, fiber.StatusUnauthorized, "UNAUTHORIZED", "Missing authorization header")
		}

		if !strings.HasPrefix(authHeader, "Bearer ") {
			return errors.SendError(c, fiber.StatusUnauthorized, "UNAUTHORIZED", "Invalid token format")
		}

		token := authHeader[7:]

		userRepo := repository.NewUserRepository()
		userService := service.NewUserService(
			userRepo,
			config.AppConfig.JwtAccessSecret,
			config.AppConfig.JwtRefreshSecret,
			config.AppConfig.AccessTokenExpiryMin,
			config.AppConfig.RefreshTokenExpiryDays,
		)

		claims, err := userService.VerifyToken(token, false)
		if err != nil {
			return errors.SendError(c, fiber.StatusUnauthorized, "UNAUTHORIZED", "Invalid or expired token")
		}

		subStr, _ := claims["sub"].(string)
		if subStr == "" {
			return errors.SendError(c, fiber.StatusUnauthorized, "UNAUTHORIZED", "Invalid token claims")
		}

		user, err := userService.GetUserByID(subStr)
		if err != nil || user == nil {
			return errors.SendError(c, fiber.StatusUnauthorized, "UNAUTHORIZED", "User not found")
		}

		c.Locals("user", user)
		return c.Next()
	}
}
