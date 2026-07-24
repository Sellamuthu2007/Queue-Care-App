package handler

import (
	"log"
	"regexp"
	"strings"
	"queue-care-backend/config"
	"queue-care-backend/errors"
	"queue-care-backend/repository"
	"queue-care-backend/service"

	"github.com/gofiber/fiber/v2"
)

type AuthHandler struct{}

func NewAuthHandler() *AuthHandler {
	return &AuthHandler{}
}

func NormalizePhone(phone string) (string, error) {
	reg := regexp.MustCompile(`[^0-9+]`)
	clean := reg.ReplaceAllString(phone, "")
	
	if clean == "" {
		return "", fiber.NewError(fiber.StatusBadRequest, "Phone number cannot be empty")
	}

	if strings.HasPrefix(clean, "+91") {
		digits := clean[3:]
		if len(digits) == 10 && isDigits(digits) {
			return clean, nil
		}
		return "", fiber.NewError(fiber.StatusBadRequest, "Please enter a valid phone number.")
	}

	if strings.HasPrefix(clean, "91") && len(clean) == 12 {
		return "+" + clean, nil
	}

	if len(clean) == 10 && isDigits(clean) {
		return "+91" + clean, nil
	}

	return "", fiber.NewError(fiber.StatusBadRequest, "Please enter a valid 10-digit phone number.")
}

func isDigits(s string) bool {
	for _, c := range s {
		if c < '0' || c > '9' {
			return false
		}
	}
	return true
}

func (h *AuthHandler) SendOtp(c *fiber.Ctx) error {
	type Request struct {
		Phone string `json:"phone"`
	}

	var req Request
	if err := c.BodyParser(&req); err != nil {
		return errors.SendError(c, fiber.StatusBadRequest, "INVALID_REQUEST", "Invalid request body")
	}

	normalized, err := NormalizePhone(req.Phone)
	if err != nil {
		return errors.SendError(c, fiber.StatusBadRequest, "INVALID_PHONE", err.Error())
	}

	userRepo := repository.NewUserRepository()
	userService := service.NewUserService(
		userRepo,
		config.AppConfig.JwtAccessSecret,
		config.AppConfig.JwtRefreshSecret,
		config.AppConfig.AccessTokenExpiryMin,
		config.AppConfig.RefreshTokenExpiryDays,
	)

	existing, err := userService.GetUserByPhone(normalized)
	if err != nil {
		log.Printf("[SendOtp] Database Error checking user: %v", err)
		return errors.SendError(c, fiber.StatusInternalServerError, "INTERNAL_SERVER_ERROR", err.Error())
	}
	if existing != nil {
		return c.JSON(fiber.Map{
			"message": "User exists, proceed to login",
			"exists":  true,
		})
	}

	otpRepo := repository.NewOtpRepository()
	otpService := service.NewOtpService(
		otpRepo,
		config.AppConfig.OtpExpiryMin,
		config.AppConfig.OtpMaxAttempts,
		config.AppConfig.AppEnv,
	)

	if err := otpService.GenerateAndSendOtp(normalized); err != nil {
		log.Printf("[SendOtp] OTP Generate/Send Error: %v", err)
		return errors.SendError(c, fiber.StatusInternalServerError, "OTP_SEND_FAILED", "Failed to send OTP")
	}

	return c.JSON(fiber.Map{
		"message": "OTP sent successfully",
		"exists":  false,
	})
}

func (h *AuthHandler) Login(c *fiber.Ctx) error {
	type Request struct {
		Phone    string `json:"phone"`
		Password string `json:"password"`
	}

	var req Request
	if err := c.BodyParser(&req); err != nil {
		return errors.SendError(c, fiber.StatusBadRequest, "INVALID_REQUEST", "Invalid request body")
	}

	normalized, err := NormalizePhone(req.Phone)
	if err != nil {
		return errors.SendError(c, fiber.StatusBadRequest, "INVALID_PHONE", err.Error())
	}

	userRepo := repository.NewUserRepository()
	userService := service.NewUserService(
		userRepo,
		config.AppConfig.JwtAccessSecret,
		config.AppConfig.JwtRefreshSecret,
		config.AppConfig.AccessTokenExpiryMin,
		config.AppConfig.RefreshTokenExpiryDays,
	)

	user, err := userService.GetUserByPhone(normalized)
	if err != nil {
		log.Printf("[Login] Database Error getting user: %v", err)
		return errors.SendError(c, fiber.StatusInternalServerError, "INTERNAL_SERVER_ERROR", err.Error())
	}
	if user == nil {
		return errors.SendError(c, fiber.StatusNotFound, "USER_NOT_FOUND", "User does not exist")
	}

	passwordService := service.NewPasswordService()
	valid, err := passwordService.VerifyPassword(req.Password, user.PasswordHash)
	if err != nil || !valid {
		return errors.SendError(c, fiber.StatusUnauthorized, "INVALID_CREDENTIALS", "Invalid phone number or password")
	}

	accessToken, err := userService.GenerateAccessToken(user.ID, user.Role)
	if err != nil {
		return errors.SendError(c, fiber.StatusInternalServerError, "INTERNAL_SERVER_ERROR", "Token generation failed")
	}

	refreshToken, err := userService.GenerateRefreshToken(user.ID, user.Role)
	if err != nil {
		return errors.SendError(c, fiber.StatusInternalServerError, "INTERNAL_SERVER_ERROR", "Token generation failed")
	}

	return c.JSON(fiber.Map{
		"message": "Logged in successfully",
		"user": fiber.Map{
			"id":    user.ID,
			"phone": user.Phone,
			"role":  user.Role,
		},
		"access_token":  accessToken,
		"refresh_token": refreshToken,
	})
}

func (h *AuthHandler) VerifyOtp(c *fiber.Ctx) error {
	type Request struct {
		Phone string `json:"phone"`
		Otp   string `json:"otp"`
	}

	var req Request
	if err := c.BodyParser(&req); err != nil {
		return errors.SendError(c, fiber.StatusBadRequest, "INVALID_REQUEST", "Invalid request body")
	}

	normalized, err := NormalizePhone(req.Phone)
	if err != nil {
		return errors.SendError(c, fiber.StatusBadRequest, "INVALID_PHONE", err.Error())
	}

	if len(req.Otp) != 6 || !isDigits(req.Otp) {
		return errors.SendError(c, fiber.StatusBadRequest, "INVALID_OTP", "Invalid OTP format")
	}

	otpRepo := repository.NewOtpRepository()
	otpService := service.NewOtpService(
		otpRepo,
		config.AppConfig.OtpExpiryMin,
		config.AppConfig.OtpMaxAttempts,
		config.AppConfig.AppEnv,
	)

	verificationToken, err := otpService.VerifyOtp(normalized, req.Otp)
	if err != nil {
		switch err.Error() {
		case "OTP_EXPIRED":
			return errors.SendError(c, fiber.StatusBadRequest, "OTP_EXPIRED", "OTP expired. Please request a new OTP.")
		case "OTP_MAX_ATTEMPTS_EXCEEDED":
			return errors.SendError(c, fiber.StatusBadRequest, "OTP_MAX_ATTEMPTS_EXCEEDED", "Too many incorrect attempts. Please request a new OTP.")
		default:
			return errors.SendError(c, fiber.StatusBadRequest, "INVALID_OTP", "Invalid OTP. Please try again.")
		}
	}

	return c.JSON(fiber.Map{
		"message":            "OTP verified successfully",
		"verification_token": verificationToken,
	})
}

func (h *AuthHandler) SetPassword(c *fiber.Ctx) error {
	authHeader := c.Get("Authorization")
	if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
		return errors.SendError(c, fiber.StatusUnauthorized, "UNAUTHORIZED", "Missing verification token")
	}
	token := authHeader[7:]

	type Request struct {
		Password string `json:"password"`
	}

	var req Request
	if err := c.BodyParser(&req); err != nil {
		return errors.SendError(c, fiber.StatusBadRequest, "INVALID_REQUEST", "Invalid request body")
	}

	if len(req.Password) < 8 {
		return errors.SendError(c, fiber.StatusBadRequest, "INVALID_PASSWORD", "Password must be at least 8 characters long.")
	}
	hasUpper, _ := regexp.MatchString(`[A-Z]`, req.Password)
	hasLower, _ := regexp.MatchString(`[a-z]`, req.Password)
	hasDigit, _ := regexp.MatchString(`[0-9]`, req.Password)

	if !hasUpper {
		return errors.SendError(c, fiber.StatusBadRequest, "INVALID_PASSWORD", "Password must contain at least one uppercase letter.")
	}
	if !hasLower {
		return errors.SendError(c, fiber.StatusBadRequest, "INVALID_PASSWORD", "Password must contain at least one lowercase letter.")
	}
	if !hasDigit {
		return errors.SendError(c, fiber.StatusBadRequest, "INVALID_PASSWORD", "Password must contain at least one number.")
	}

	otpRepo := repository.NewOtpRepository()
	otpService := service.NewOtpService(
		otpRepo,
		config.AppConfig.OtpExpiryMin,
		config.AppConfig.OtpMaxAttempts,
		config.AppConfig.AppEnv,
	)

	phone, err := otpService.ValidateVerificationToken(token)
	if err != nil {
		return errors.SendError(c, fiber.StatusBadRequest, "VERIFICATION_SESSION_EXPIRED", "Verification session expired. Please verify your OTP again.")
	}

	userRepo := repository.NewUserRepository()
	userService := service.NewUserService(
		userRepo,
		config.AppConfig.JwtAccessSecret,
		config.AppConfig.JwtRefreshSecret,
		config.AppConfig.AccessTokenExpiryMin,
		config.AppConfig.RefreshTokenExpiryDays,
	)

	existing, err := userService.GetUserByPhone(phone)
	if err != nil {
		return errors.SendError(c, fiber.StatusInternalServerError, "INTERNAL_SERVER_ERROR", err.Error())
	}
	if existing != nil {
		return errors.SendError(c, fiber.StatusConflict, "USER_ALREADY_EXISTS", "User already exists")
	}

	passwordService := service.NewPasswordService()
	passwordHash, err := passwordService.HashPassword(req.Password)
	if err != nil {
		return errors.SendError(c, fiber.StatusInternalServerError, "INTERNAL_SERVER_ERROR", "Password hashing failed")
	}

	user, err := userService.CreateUser(phone, passwordHash)
	if err != nil {
		return errors.SendError(c, fiber.StatusInternalServerError, "INTERNAL_SERVER_ERROR", "User creation failed")
	}

	accessToken, err := userService.GenerateAccessToken(user.ID, user.Role)
	if err != nil {
		return errors.SendError(c, fiber.StatusInternalServerError, "INTERNAL_SERVER_ERROR", "Token generation failed")
	}

	refreshToken, err := userService.GenerateRefreshToken(user.ID, user.Role)
	if err != nil {
		return errors.SendError(c, fiber.StatusInternalServerError, "INTERNAL_SERVER_ERROR", "Token generation failed")
	}

	return c.JSON(fiber.Map{
		"message": "Account created successfully",
		"user": fiber.Map{
			"id":    user.ID,
			"phone": user.Phone,
			"role":  user.Role,
		},
		"access_token":  accessToken,
		"refresh_token": refreshToken,
	})
}

func (h *AuthHandler) Refresh(c *fiber.Ctx) error {
	type Request struct {
		RefreshToken string `json:"refresh_token"`
	}

	var req Request
	if err := c.BodyParser(&req); err != nil {
		return errors.SendError(c, fiber.StatusBadRequest, "INVALID_REQUEST", "Invalid request body")
	}

	userRepo := repository.NewUserRepository()
	userService := service.NewUserService(
		userRepo,
		config.AppConfig.JwtAccessSecret,
		config.AppConfig.JwtRefreshSecret,
		config.AppConfig.AccessTokenExpiryMin,
		config.AppConfig.RefreshTokenExpiryDays,
	)

	newAccess, newRefresh, err := userService.RefreshTokens(req.RefreshToken)
	if err != nil {
		return errors.SendError(c, fiber.StatusUnauthorized, "UNAUTHORIZED", "Invalid or expired refresh token")
	}

	return c.JSON(fiber.Map{
		"access_token":  newAccess,
		"refresh_token": newRefresh,
	})
}

func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"message": "Logged out successfully",
	})
}
