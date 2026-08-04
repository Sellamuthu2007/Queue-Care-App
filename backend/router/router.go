package router

import (
	"queue-care-backend/handler"

	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App) {
	api := app.Group("/api/v1")

	api.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "healthy",
			"message": "Queue Care Go Backend is running",
		})
	})

	auth := api.Group("/auth")
	auth.Post("/google", handler.GoogleSignIn)
	auth.Post("/refresh", handler.RefreshToken)
	auth.Post("/login", handler.EmailPasswordLogin)
}

