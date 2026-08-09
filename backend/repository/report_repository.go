package repository

import (
	"database/sql"
	"queue-care-backend/db"
	"queue-care-backend/models"
)

func GetReportsByUserID(userID string) ([]models.Report, error) {
	var reports []models.Report
	query := `SELECT id, user_id, title, type, description, doctor_name, hospital_name, department, report_date, file_url, file_type, created_at, updated_at
			  FROM reports
			  WHERE user_id = $1
			  ORDER BY report_date DESC`

	err := db.DB.Select(&reports, query, userID)
	if err != nil {
		return nil, err
	}
	return reports, nil
}

func GetReportByID(reportID string, userID string) (*models.Report, error) {
	var report models.Report
	query := `SELECT id, user_id, title, type, description, doctor_name, hospital_name, department, report_date, file_url, file_type, created_at, updated_at
			  FROM reports
			  WHERE id = $1 AND user_id = $2`

	err := db.DB.Get(&report, query, reportID, userID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &report, nil
}
