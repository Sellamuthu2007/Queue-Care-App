package db

import (
	"embed"
	"log"
	"sort"
	"strings"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/jmoiron/sqlx"
)

//go:embed migrations/*.sql
var migrationFiles embed.FS

var DB *sqlx.DB

func InitDB(databaseURL string) {
	log.Println("Connecting to PostgreSQL database...")
	db, err := sqlx.Connect("pgx", databaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	DB = db
	log.Println("Database connection established. Running migrations...")
	runMigrations()
}

func runMigrations() {
	entries, err := migrationFiles.ReadDir("migrations")
	if err != nil {
		log.Fatalf("Failed to read migrations directory: %v", err)
	}

	var files []string
	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".sql") {
			files = append(files, entry.Name())
		}
	}

	sort.Strings(files)

	for _, file := range files {
		log.Printf("Executing migration: %s", file)
		content, err := migrationFiles.ReadFile("migrations/" + file)
		if err != nil {
			log.Fatalf("Failed to read migration %s: %v", file, err)
		}

		tx, err := DB.Beginx()
		if err != nil {
			log.Fatalf("Failed to start transaction for %s: %v", file, err)
		}

		_, err = tx.Exec(string(content))
		if err != nil {
			_ = tx.Rollback()
			log.Fatalf("Migration failed (%s): %v", file, err)
		}

		err = tx.Commit()
		if err != nil {
			log.Fatalf("Failed to commit migration %s: %v", file, err)
		}
	}

	log.Println("All migrations completed successfully.")
}
