package handler

import (
	"queue-care-backend/errors"
	"queue-care-backend/service"

	"github.com/gofiber/fiber/v2"
)

type GoogleSignInRequest struct {
	AccessToken string `json:"access_token"`
	Email       string `json:"email"`
	Password    string `json:"password"`
}

func GoogleSignIn(c *fiber.Ctx) error {
	var req GoogleSignInRequest
	if err := c.BodyParser(&req); err != nil {
		return errors.SendError(c, fiber.StatusBadRequest, "INVALID_REQUEST", "Failed to parse request body")
	}

	if req.AccessToken == "" {
		return errors.SendError(c, fiber.StatusBadRequest, "INVALID_TOKEN", "Supabase access token is required")
	}

	resp, err := service.VerifyGoogleAndLogin(c.Context(), req.AccessToken, req.Email, req.Password)
	if err != nil {
		return errors.SendError(c, fiber.StatusUnauthorized, "AUTH_FAILED", err.Error())
	}

	return c.JSON(resp)
}

type EmailPasswordLoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func EmailPasswordLogin(c *fiber.Ctx) error {
	var req EmailPasswordLoginRequest
	if err := c.BodyParser(&req); err != nil {
		return errors.SendError(c, fiber.StatusBadRequest, "INVALID_REQUEST", "Failed to parse request body")
	}

	if req.Email == "" || req.Password == "" {
		return errors.SendError(c, fiber.StatusBadRequest, "INVALID_CREDENTIALS", "Email and password are required")
	}

	resp, err := service.LoginWithEmailPassword(c.Context(), req.Email, req.Password)
	if err != nil {
		return errors.SendError(c, fiber.StatusUnauthorized, "AUTH_FAILED", err.Error())
	}

	return c.JSON(resp)
}

type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token"`
}

func RefreshToken(c *fiber.Ctx) error {
	var req RefreshTokenRequest
	if err := c.BodyParser(&req); err != nil {
		return errors.SendError(c, fiber.StatusBadRequest, "INVALID_REQUEST", "Failed to parse request body")
	}

	if req.RefreshToken == "" {
		return errors.SendError(c, fiber.StatusBadRequest, "INVALID_TOKEN", "Refresh token is required")
	}

	resp, err := service.RefreshTokens(req.RefreshToken)
	if err != nil {
		return errors.SendError(c, fiber.StatusUnauthorized, "REFRESH_FAILED", err.Error())
	}

	return c.JSON(resp)
}
