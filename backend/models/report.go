package models

import "time"

type Report struct {
	ID           string    `db:"id" json:"id"`
	UserID       string    `db:"user_id" json:"user_id"`
	Title        string    `db:"title" json:"title"`
	Type         string    `db:"type" json:"type"`
	Description  string    `db:"description" json:"description"`
	DoctorName   string    `db:"doctor_name" json:"doctor_name"`
	HospitalName string    `db:"hospital_name" json:"hospital_name"`
	Department   string    `db:"department" json:"department"`
	ReportDate   time.Time `db:"report_date" json:"report_date"`
	FileURL      string    `db:"file_url" json:"file_url"`
	FileType     string    `db:"file_type" json:"file_type"`
	CreatedAt    time.Time `db:"created_at" json:"created_at"`
	UpdatedAt    time.Time `db:"updated_at" json:"updated_at"`
}
