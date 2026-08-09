package models

import "time"

type User struct {
	ID                        string    `db:"id" json:"id"`
	GoogleID                  string    `db:"google_id" json:"google_id"`
	Email                     string    `db:"email" json:"email"`
	Name                      string    `db:"name" json:"name"`
	AvatarURL                 string    `db:"avatar_url" json:"avatar_url"`
	Role                      string    `db:"role" json:"role"`
	Age                       int       `db:"age" json:"age"`
	Gender                    string    `db:"gender" json:"gender"`
	Phone                     string    `db:"phone" json:"phone"`
	BloodGroup                string    `db:"blood_group" json:"blood_group"`
	Address                   string    `db:"address" json:"address"`
	MedicalDiseases           string    `db:"medical_diseases" json:"medical_diseases"`
	MedicalMedications        string    `db:"medical_medications" json:"medical_medications"`
	MedicalInsuranceAvailable bool      `db:"medical_insurance_available" json:"medical_insurance_available"`
	MedicalInsuranceProvider  string    `db:"medical_insurance_provider" json:"medical_insurance_provider"`
	CreatedAt                 time.Time `db:"created_at" json:"created_at"`
	UpdatedAt                 time.Time `db:"updated_at" json:"updated_at"`
}

type AuthResponse struct {
	Message      string `json:"message"`
	User         User   `json:"user"`
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}

type RefreshTokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}
