package repository

import (
	"queue-care-backend/db"
	"queue-care-backend/models"
)

func GetNotificationsByUserID(userID string) ([]models.Notification, error) {
	var notifications []models.Notification
	query := `SELECT id, user_id, title, message, type, is_read, created_at 
			  FROM notifications 
			  WHERE user_id = $1 
			  ORDER BY created_at DESC`

	err := db.DB.Select(&notifications, query, userID)
	if err != nil {
		return nil, err
	}
	return notifications, nil
}

func CreateNotification(n *models.Notification) error {
	query := `INSERT INTO notifications (user_id, title, message, type) 
			  VALUES ($1, $2, $3, $4)`

	_, err := db.DB.Exec(query, n.UserID, n.Title, n.Message, n.Type)
	return err
}

func MarkAllNotificationsAsRead(userID string) error {
	query := `UPDATE notifications 
			  SET is_read = true 
			  WHERE user_id = $1`

	_, err := db.DB.Exec(query, userID)
	return err
}
