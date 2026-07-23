package repository

import (
	"database/sql"
	"errors"
	"queue-care-backend/db"
	"queue-care-backend/models"
)

type UserRepository struct{}

func NewUserRepository() *UserRepository {
	return &UserRepository{}
}

func (r *UserRepository) FindByID(id string) (*models.User, error) {
	var user models.User
	err := db.DB.Get(&user, "SELECT * FROM users WHERE id = $1", id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) FindByPhone(phone string) (*models.User, error) {
	var user models.User
	err := db.DB.Get(&user, "SELECT * FROM users WHERE phone = $1", phone)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) CreateUser(phone, passwordHash string) (*models.User, error) {
	var user models.User
	err := db.DB.Get(&user, 
		"INSERT INTO users (phone, password_hash, is_verified, role) VALUES ($1, $2, TRUE, 'patient') RETURNING *",
		phone, passwordHash,
	)
	if err != nil {
		return nil, err
	}
	return &user, nil
}
