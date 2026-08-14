package handler

import (
	"queue-care-backend/errors"
	"queue-care-backend/repository"

	"github.com/gofiber/fiber/v2"
)

func GetMyNotifications(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)

	notifications, err := repository.GetNotificationsByUserID(userID)
	if err != nil {
		return errors.SendError(c, fiber.StatusInternalServerError, "DB_ERROR", err.Error())
	}

	return c.JSON(notifications)
}

func MarkNotificationsRead(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)

	err := repository.MarkAllNotificationsAsRead(userID)
	if err != nil {
		return errors.SendError(c, fiber.StatusInternalServerError, "DB_ERROR", err.Error())
	}

	return c.JSON(fiber.Map{
		"message": "All notifications marked as read",
	})
}

func DeleteNotification(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	id := c.Params("id")

	err := repository.DeleteNotification(id, userID)
	if err != nil {
		return errors.SendError(c, fiber.StatusInternalServerError, "DB_ERROR", err.Error())
	}

	return c.JSON(fiber.Map{
		"message": "Notification deleted successfully",
	})
}
