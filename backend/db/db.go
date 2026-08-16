package db

import (
	"embed"
	"fmt"
	"log"
	"os"
	"sort"
	"strings"
	"time"

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

	log.Println("Starting background cleanup scheduler...")
	StartCleanupScheduler()
}

func runMigrations() {
	// Create schema_migrations table if not exists
	_, err := DB.Exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
		version VARCHAR(255) PRIMARY KEY
	);`)
	if err != nil {
		log.Fatalf("Failed to create schema_migrations table: %v", err)
	}

	// Fetch already executed migrations
	var executed []string
	err = DB.Select(&executed, "SELECT version FROM schema_migrations")
	if err != nil {
		log.Fatalf("Failed to query executed migrations: %v", err)
	}

	executedMap := make(map[string]bool)
	for _, version := range executed {
		executedMap[version] = true
	}

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

	// Write diagnostic info to a log file
	diagInfo := fmt.Sprintf("TIME: %s\n", time.Now().Format(time.RFC3339))
	diagInfo += fmt.Sprintf("Executed in DB: %v\n", executed)
	diagInfo += fmt.Sprintf("Files in dir: %v\n", files)
	
	var executedList []string
	var skippedList []string

	for _, file := range files {
		if executedMap[file] {
			skippedList = append(skippedList, file)
			log.Printf("Migration %s already executed, skipping.", file)
			continue
		}
		executedList = append(executedList, file)

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

		_, err = tx.Exec("INSERT INTO schema_migrations (version) VALUES ($1)", file)
		if err != nil {
			_ = tx.Rollback()
			log.Fatalf("Failed to record migration version for %s: %v", file, err)
		}

		err = tx.Commit()
		if err != nil {
			log.Fatalf("Failed to commit migration %s: %v", file, err)
		}
	}

	diagInfo += fmt.Sprintf("Skipped (already run): %v\n", skippedList)
	diagInfo += fmt.Sprintf("Executed (new run): %v\n\n", executedList)
	
	f, _ := os.OpenFile("migration_run.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if f != nil {
		defer f.Close()
		_, _ = f.WriteString(diagInfo)
	}

	log.Println("All migrations completed successfully.")
}

func StartCleanupScheduler() {
	go func() {
		// Run once immediately on startup
		cleanupOldAppointments()

		// Run periodically (every 12 hours)
		ticker := time.NewTicker(12 * time.Hour)
		defer ticker.Stop()
		for range ticker.C {
			cleanupOldAppointments()
		}
	}()
}

func cleanupOldAppointments() {
	log.Println("Running automated cleanup for past appointments...")
	// Delete appointments where appointment_date is in the past (yesterday or older)
	query := `DELETE FROM appointments WHERE appointment_date < CURRENT_DATE`
	result, err := DB.Exec(query)
	if err != nil {
		log.Printf("Error cleaning up old appointments: %v", err)
		return
	}
	rows, err := result.RowsAffected()
	if err == nil && rows > 0 {
		log.Printf("Cleaned up %d old appointments", rows)
	}
}
