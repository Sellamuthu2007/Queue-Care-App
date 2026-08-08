package handler

import (
	"queue-care-backend/errors"
	"queue-care-backend/repository"

	"github.com/gofiber/fiber/v2"
)

func GetHospital(c *fiber.Ctx) error {
	hospital, err := repository.GetDefaultHospital()
	if err != nil {
		return errors.SendError(c, fiber.StatusInternalServerError, "DB_ERROR", err.Error())
	}
	return c.JSON(hospital)
}

func GetHospitalDoctors(c *fiber.Ctx) error {
	hospitalID := c.Params("id")
	if hospitalID == "" {
		return errors.SendError(c, fiber.StatusBadRequest, "INVALID_REQUEST", "Hospital ID parameter is required")
	}

	specialization := c.Query("specialization", "All")

	doctors, err := repository.GetDoctorsByHospital(hospitalID, specialization)
	if err != nil {
		return errors.SendError(c, fiber.StatusInternalServerError, "DB_ERROR", err.Error())
	}

	return c.JSON(doctors)
}
