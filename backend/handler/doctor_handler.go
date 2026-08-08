package handler

import (
	"queue-care-backend/errors"
	"queue-care-backend/repository"

	"github.com/gofiber/fiber/v2"
)

func GetDoctorByID(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return errors.SendError(c, fiber.StatusBadRequest, "INVALID_REQUEST", "Doctor ID is required")
	}

	doctor, err := repository.GetDoctorByID(id)
	if err != nil {
		return errors.SendError(c, fiber.StatusNotFound, "NOT_FOUND", "Doctor not found")
	}

	return c.JSON(doctor)
}

func GetDoctorAvailability(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return errors.SendError(c, fiber.StatusBadRequest, "INVALID_REQUEST", "Doctor ID is required")
	}

	date := c.Query("date")
	if date == "" {
		return errors.SendError(c, fiber.StatusBadRequest, "INVALID_REQUEST", "Date query parameter is required (YYYY-MM-DD)")
	}

	availability, err := repository.GetDoctorAvailability(id, date)
	if err != nil {
		return errors.SendError(c, fiber.StatusInternalServerError, "DB_ERROR", err.Error())
	}

	return c.JSON(availability)
}
