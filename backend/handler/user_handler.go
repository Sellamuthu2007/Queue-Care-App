package handler

import (
	"queue-care-backend/errors"
	"queue-care-backend/models"
	"queue-care-backend/repository"

	"github.com/gofiber/fiber/v2"
)

func GetUserProfile(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)

	user, err := repository.GetUserByID(userID)
	if err != nil {
		return errors.SendError(c, fiber.StatusNotFound, "NOT_FOUND", "User profile not found")
	}

	return c.JSON(user)
}

func UpdateUserProfile(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)

	var req models.User
	if err := c.BodyParser(&req); err != nil {
		return errors.SendError(c, fiber.StatusBadRequest, "INVALID_REQUEST", "Failed to parse profile payload")
	}

	// Fetch existing user to preserve fields that shouldn't change through profile edit
	existingUser, err := repository.GetUserByID(userID)
	if err != nil {
		return errors.SendError(c, fiber.StatusNotFound, "NOT_FOUND", "User profile not found")
	}

	// Update permitted fields
	existingUser.Name = req.Name
	existingUser.Age = req.Age
	existingUser.Gender = req.Gender
	existingUser.Phone = req.Phone
	existingUser.BloodGroup = req.BloodGroup
	existingUser.Address = req.Address
	existingUser.MedicalDiseases = req.MedicalDiseases
	existingUser.MedicalMedications = req.MedicalMedications
	existingUser.MedicalInsuranceAvailable = req.MedicalInsuranceAvailable
	existingUser.MedicalInsuranceProvider = req.MedicalInsuranceProvider

	err = repository.UpdateUserProfile(userID, existingUser)
	if err != nil {
		return errors.SendError(c, fiber.StatusInternalServerError, "DB_ERROR", err.Error())
	}

	return c.JSON(existingUser)
}
