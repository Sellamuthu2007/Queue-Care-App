package repository

import (
	"database/sql"
	"os"
	"queue-care-backend/db"
	"queue-care-backend/models"
)

func GetOrCreateUserByGoogleID(googleID, email, name, avatarURL string) (*models.User, error) {
	var user models.User
	
	// Check if user already exists by google_id
	err := db.DB.Get(&user, "SELECT id, google_id, email, name, avatar_url, role, age, gender, phone, blood_group, address, medical_diseases, medical_medications, medical_insurance_available, medical_insurance_provider, created_at, updated_at FROM users WHERE google_id = $1", googleID)
	if err == nil {
		// Staff auto-promotion
		staffEmail := os.Getenv("STAFF_EMAIL")
		if email != "" && staffEmail != "" && email == staffEmail && user.Role != "staff" {
			_, _ = db.DB.Exec("UPDATE users SET role = 'staff', updated_at = NOW() WHERE id = $1", user.ID)
			user.Role = "staff"
		}

		// User exists, update user info if required (name/avatar changes)
		if user.Name != name || user.AvatarURL != avatarURL || user.Email != email {
			_, err = db.DB.Exec(
				"UPDATE users SET name = $1, avatar_url = $2, email = $3, updated_at = NOW() WHERE google_id = $4",
				name, avatarURL, email, googleID,
			)
			if err != nil {
				return nil, err
			}
			user.Name = name
			user.AvatarURL = avatarURL
			user.Email = email
		}
		return &user, nil
	}
	
	if err != sql.ErrNoRows {
		return nil, err
	}

	// User does not exist, check if user exists by email (to link google_id to existing account if registering with Google)
	err = db.DB.Get(&user, "SELECT id, google_id, email, name, avatar_url, role, age, gender, phone, blood_group, address, medical_diseases, medical_medications, medical_insurance_available, medical_insurance_provider, created_at, updated_at FROM users WHERE email = $1", email)
	if err == nil {
		// Staff auto-promotion
		staffEmail := os.Getenv("STAFF_EMAIL")
		if email != "" && staffEmail != "" && email == staffEmail && user.Role != "staff" {
			_, _ = db.DB.Exec("UPDATE users SET role = 'staff', updated_at = NOW() WHERE id = $1", user.ID)
			user.Role = "staff"
		}

		// Link Google ID and update name/avatar
		_, err = db.DB.Exec(
			"UPDATE users SET google_id = $1, name = $2, avatar_url = $3, updated_at = NOW() WHERE email = $4",
			googleID, name, avatarURL, email,
		)
		if err != nil {
			return nil, err
		}
		user.GoogleID = googleID
		user.Name = name
		user.AvatarURL = avatarURL
		return &user, nil
	}

	if err != sql.ErrNoRows {
		return nil, err
	}

	// Staff auto-promotion for brand new registration
	role := "patient"
	staffEmail := os.Getenv("STAFF_EMAIL")
	if email != "" && staffEmail != "" && email == staffEmail {
		role = "staff"
	}

	// Brand new user registration
	err = db.DB.QueryRowx(
		"INSERT INTO users (google_id, email, name, avatar_url, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, google_id, email, name, avatar_url, role, age, gender, phone, blood_group, address, medical_diseases, medical_medications, medical_insurance_available, medical_insurance_provider, created_at, updated_at",
		googleID, email, name, avatarURL, role,
	).StructScan(&user)

	if err != nil {
		return nil, err
	}

	return &user, nil
}

func GetUserProfileByID(userID string) (*models.User, error) {
	var user models.User
	err := db.DB.Get(&user, "SELECT id, google_id, email, name, avatar_url, role, age, gender, phone, blood_group, address, medical_diseases, medical_medications, medical_insurance_available, medical_insurance_provider, created_at, updated_at FROM users WHERE id = $1", userID)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func GetUserByID(userID string) (*models.User, error) {
	var user models.User
	err := db.DB.Get(&user, "SELECT id, google_id, email, name, avatar_url, role, age, gender, phone, blood_group, address, medical_diseases, medical_medications, medical_insurance_available, medical_insurance_provider, created_at, updated_at FROM users WHERE id = $1", userID)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func UpdateUserProfile(userID string, user *models.User) error {
	query := `UPDATE users SET 
		name = $1,
		age = $2,
		gender = $3,
		phone = $4,
		blood_group = $5,
		address = $6,
		medical_diseases = $7,
		medical_medications = $8,
		medical_insurance_available = $9,
		medical_insurance_provider = $10,
		updated_at = NOW()
		WHERE id = $11`

	_, err := db.DB.Exec(
		query,
		user.Name,
		user.Age,
		user.Gender,
		user.Phone,
		user.BloodGroup,
		user.Address,
		user.MedicalDiseases,
		user.MedicalMedications,
		user.MedicalInsuranceAvailable,
		user.MedicalInsuranceProvider,
		userID,
	)
	return err
}
