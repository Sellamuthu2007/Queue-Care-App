package repository

import (
	"database/sql"
	"queue-care-backend/db"
	"queue-care-backend/models"
)

func GetOrCreateUserByGoogleID(googleID, email, name, avatarURL string) (*models.User, error) {
	var user models.User
	
	// Check if user already exists by google_id
	err := db.DB.Get(&user, "SELECT id, google_id, email, name, avatar_url, role, created_at, updated_at FROM users WHERE google_id = $1", googleID)
	if err == nil {
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
	err = db.DB.Get(&user, "SELECT id, google_id, email, name, avatar_url, role, created_at, updated_at FROM users WHERE email = $1", email)
	if err == nil {
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

	// Brand new user registration
	err = db.DB.QueryRowx(
		"INSERT INTO users (google_id, email, name, avatar_url, role) VALUES ($1, $2, $3, $4, 'patient') RETURNING id, google_id, email, name, avatar_url, role, created_at, updated_at",
		googleID, email, name, avatarURL,
	).StructScan(&user)

	if err != nil {
		return nil, err
	}

	return &user, nil
}

func GetUserByID(userID string) (*models.User, error) {
	var user models.User
	err := db.DB.Get(&user, "SELECT id, google_id, email, name, avatar_url, role, created_at, updated_at FROM users WHERE id = $1", userID)
	if err != nil {
		return nil, err
	}
	return &user, nil
}
