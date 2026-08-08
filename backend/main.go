package main

import (
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"queue-care-backend/config"
	"queue-care-backend/db"
	"queue-care-backend/router"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func copyFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()

	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, in)
	return err
}

func copyAssets() {
	sourceDir := `C:\Users\senth\.gemini\antigravity-ide\brain\9d819ef2-7924-49fb-aba5-8cb21203bef6`
	destDir := `e:\MAD - QUEUE CARE\Queue-Care-App\Queue-care\assets\images`

	// Ensure destination directory exists
	if err := os.MkdirAll(destDir, 0755); err != nil {
		log.Printf("Failed to create destination assets folder: %v", err)
		return
	}

	files, err := os.ReadDir(sourceDir)
	if err != nil {
		log.Printf("Asset copier: Source directory not available: %v", err)
		return
	}

	for _, file := range files {
		if file.IsDir() {
			continue
		}
		name := file.Name()
		var targetName string
		if strings.HasPrefix(name, "hospital_cover_") && strings.HasSuffix(name, ".png") {
			targetName = "hospital_cover.png"
		} else if strings.HasPrefix(name, "doctor_cardiology_") && strings.HasSuffix(name, ".png") {
			targetName = "doctor_cardiology.png"
		} else if strings.HasPrefix(name, "doctor_neurology_") && strings.HasSuffix(name, ".png") {
			targetName = "doctor_neurology.png"
		}

		if targetName != "" {
			srcPath := filepath.Join(sourceDir, name)
			dstPath := filepath.Join(destDir, targetName)
			log.Printf("Copying asset: %s -> %s", name, targetName)
			if err := copyFile(srcPath, dstPath); err != nil {
				log.Printf("Failed to copy %s to %s: %v", name, targetName, err)
			}
		}
	}
}

func main() {
	log.Println("Starting Queue Care backend in Go...")

	config.LoadConfig()

	// Synchronize generated Gemini assets
	copyAssets()

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
		AllowHeaders: "Origin, Content-Type, Accept, Authorization, Bypass-Tunnel-Reminder",
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
