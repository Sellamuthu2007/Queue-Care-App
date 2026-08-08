package handler

import (
	"queue-care-backend/errors"
	"queue-care-backend/models"
	"queue-care-backend/repository"

	"github.com/gofiber/fiber/v2"
)

func BookAppointment(c *fiber.Ctx) error {
	patientID := c.Locals("userID").(string)

	var apt models.Appointment
	if err := c.BodyParser(&apt); err != nil {
		return errors.SendError(c, fiber.StatusBadRequest, "INVALID_REQUEST", "Failed to parse appointment body")
	}

	// Never trust frontend, force patient_id from JWT
	apt.PatientID = patientID

	if apt.DoctorID == "" || apt.HospitalID == "" || apt.AppointmentDate == "" || apt.AppointmentTime == "" {
		return errors.SendError(c, fiber.StatusBadRequest, "MISSING_FIELDS", "Doctor, Hospital, Date, and Time slots are required")
	}

	createdApt, err := repository.CreateAppointment(&apt)
	if err != nil {
		return errors.SendError(c, fiber.StatusInternalServerError, "DB_ERROR", err.Error())
	}

	return c.Status(fiber.StatusCreated).JSON(createdApt)
}

func GetMyAppointments(c *fiber.Ctx) error {
	patientID := c.Locals("userID").(string)

	appointments, err := repository.GetAppointmentsByPatientID(patientID)
	if err != nil {
		return errors.SendError(c, fiber.StatusInternalServerError, "DB_ERROR", err.Error())
	}

	return c.JSON(appointments)
}

func GetAppointmentDetails(c *fiber.Ctx) error {
	patientID := c.Locals("userID").(string)
	id := c.Params("id")
	if id == "" {
		return errors.SendError(c, fiber.StatusBadRequest, "INVALID_REQUEST", "Appointment ID is required")
	}

	apt, err := repository.GetAppointmentByID(id, patientID)
	if err != nil {
		return errors.SendError(c, fiber.StatusNotFound, "NOT_FOUND", "Appointment details not found")
	}

	return c.JSON(apt)
}

func CancelMyAppointment(c *fiber.Ctx) error {
	patientID := c.Locals("userID").(string)
	id := c.Params("id")
	if id == "" {
		return errors.SendError(c, fiber.StatusBadRequest, "INVALID_REQUEST", "Appointment ID is required")
	}

	err := repository.CancelAppointment(id, patientID)
	if err != nil {
		return errors.SendError(c, fiber.StatusInternalServerError, "DB_ERROR", "Failed to cancel appointment")
	}

	return c.JSON(fiber.Map{
		"message": "Appointment cancelled successfully",
	})
}
