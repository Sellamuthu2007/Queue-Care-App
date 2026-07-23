package router

import (
	"queue-care-backend/handler"
	"queue-care-backend/middleware"

	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App) {
	api := app.Group("/api/v1")

	authHandler := handler.NewAuthHandler()
	auth := api.Group("/auth")

	auth.Post("/send-otp", authHandler.SendOtp)
	auth.Post("/verify-otp", authHandler.VerifyOtp)
	auth.Post("/set-password", authHandler.SetPassword)
	auth.Post("/login", authHandler.Login)
	auth.Post("/refresh", authHandler.Refresh)
	auth.Post("/logout", authHandler.Logout)

	protected := api.Group("/protected", middleware.AuthRequired())
	protected.Get("/me", func(c *fiber.Ctx) error {
		user := c.Locals("user")
		return c.JSON(fiber.Map{
			"user": user,
		})
	})
}
