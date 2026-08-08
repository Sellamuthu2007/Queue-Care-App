package service

import (
	"fmt"

	"queue-care-backend/models"
	"queue-care-backend/repository"
)

func syncSupabaseUser(user *SupabaseUser, fallbackEmail string) (*models.User, error) {
	googleID, email, name, avatarURL := normalizeSupabaseUser(user, fallbackEmail)

	localUser, err := repository.GetOrCreateUserByGoogleID(googleID, email, name, avatarURL)
	if err != nil {
		return nil, fmt.Errorf("failed to sync user in database: %v", err)
	}

	return localUser, nil
}
