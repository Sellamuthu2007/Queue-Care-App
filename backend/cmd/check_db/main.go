package main

import (
	"fmt"
	"log"
	"queue-care-backend/config"
	"queue-care-backend/db"
	"queue-care-backend/models"
)

func main() {
	log.Println("Loading configuration...")
	config.LoadConfig()

	log.Println("Connecting to database...")
	db.InitDB(config.AppConfig.DatabaseURL)

	log.Println("Querying users table...")
	var users []models.User
	err := db.DB.Select(&users, "SELECT id, email, name, role, created_at FROM users")
	if err != nil {
		log.Fatalf("Failed to query users: %v", err)
	}

	fmt.Println("\n--- Registered Users ---")
	if len(users) == 0 {
		fmt.Println("No users found in the database.")
	} else {
		for i, u := range users {
			fmt.Printf("[%d] ID: %s | Email: %s | Name: %s | Role: %s | Created: %s\n",
				i+1, u.ID, u.Email, u.Name, u.Role, u.CreatedAt.Format("2006-01-02 15:04:05"))
		}
	}
	fmt.Println("------------------------\n")
}
