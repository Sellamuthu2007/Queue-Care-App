package main

import (
	"fmt"
	"log"
	"queue-care-backend/config"
	"queue-care-backend/db"
	"queue-care-backend/router"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func main() {
	log.Println("Starting Queue Care backend in Go...")

	config.LoadConfig()

	db.InitDB(config.AppConfig.DatabaseURL)

	app := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}
			log.Printf("Internal Handler Error: %v", err)
			return c.Status(code).JSON(fiber.Map{
				"error": fiber.Map{
					"code":    "INTERNAL_SERVER_ERROR",
					"message": err.Error(),
				},
			})
		},
	})

	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
	}))
	app.Use(logger.New())

	router.SetupRoutes(app)

	addr := fmt.Sprintf("0.0.0.0:%d", config.AppConfig.ApiPort)
	log.Printf("Server listening on http://%s", addr)
	if err := app.Listen(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
