package handler

import (
	"fmt"
	"strings"
	"time"
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

	// Trigger user-isolated booking notification
	if fullApt, err := repository.GetAppointmentByID(createdApt.ID, patientID); err == nil {
		notif := &models.Notification{
			UserID:  patientID,
			Title:   "Appointment Booked",
			Message: fmt.Sprintf("Your appointment with %s (%s) at %s is confirmed. Token Number: #%d.", fullApt.DoctorName, fullApt.DoctorSpecialization, fullApt.HospitalName, fullApt.QueuePosition),
			Type:    "booking",
		}
		_ = repository.CreateNotification(notif)
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

	// Query appointment details before cancel to get metadata for notification
	apt, notifErr := repository.GetAppointmentByID(id, patientID)

	err := repository.CancelAppointment(id, patientID)
	if err != nil {
		return errors.SendError(c, fiber.StatusInternalServerError, "DB_ERROR", "Failed to cancel appointment")
	}

	// Trigger user-isolated cancellation notification
	if notifErr == nil {
		notif := &models.Notification{
			UserID:  patientID,
			Title:   "Appointment Cancelled",
			Message: fmt.Sprintf("Your appointment with %s (%s) at %s has been successfully cancelled.", apt.DoctorName, apt.DoctorSpecialization, apt.HospitalName),
			Type:    "cancellation",
		}
		_ = repository.CreateNotification(notif)
	}

	return c.JSON(fiber.Map{
		"message": "Appointment cancelled successfully",
	})
}

func StaffCheckInAppointment(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return errors.SendError(c, fiber.StatusBadRequest, "INVALID_REQUEST", "Appointment ID is required")
	}

	if strings.HasPrefix(id, "QUEUECARE:APPOINTMENT:") {
		id = strings.TrimPrefix(id, "QUEUECARE:APPOINTMENT:")
	}

	apt, err := repository.CheckInAppointment(id)
	if err != nil {
		return errors.SendError(c, fiber.StatusBadRequest, "CHECKIN_FAILED", err.Error())
	}

	return c.JSON(fiber.Map{
		"success":     true,
		"message":     "Patient arrival confirmed",
		"appointment": apt,
	})
}

func StaffConsultationScan(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return errors.SendError(c, fiber.StatusBadRequest, "INVALID_REQUEST", "Appointment ID is required")
	}

	if strings.HasPrefix(id, "QUEUECARE:APPOINTMENT:") {
		id = strings.TrimPrefix(id, "QUEUECARE:APPOINTMENT:")
	}

	scannedApt, err := repository.GetAppointmentByIDWithoutPatient(id)
	if err != nil {
		return errors.SendError(c, fiber.StatusNotFound, "NOT_FOUND", "Appointment not found")
	}

	prev, current, err := repository.StartConsultation(id, scannedApt.DoctorID)
	if err != nil {
		return errors.SendError(c, fiber.StatusBadRequest, "CONSULTATION_FAILED", err.Error())
	}

	return c.JSON(fiber.Map{
		"success":               true,
		"previous_consultation": prev,
		"current_consultation":  current,
	})
}

func StaffUpdateAppointmentStatus(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return errors.SendError(c, fiber.StatusBadRequest, "INVALID_REQUEST", "Appointment ID is required")
	}

	if strings.HasPrefix(id, "QUEUECARE:APPOINTMENT:") {
		id = strings.TrimPrefix(id, "QUEUECARE:APPOINTMENT:")
	}

	type StatusRequest struct {
		Status string `json:"status"`
	}
	var req StatusRequest
	if err := c.BodyParser(&req); err != nil || req.Status == "" {
		return errors.SendError(c, fiber.StatusBadRequest, "INVALID_REQUEST", "Status value is required")
	}

	apt, err := repository.UpdateAppointmentStatusManual(id, req.Status)
	if err != nil {
		return errors.SendError(c, fiber.StatusBadRequest, "TRANSITION_FAILED", err.Error())
	}

	return c.JSON(fiber.Map{
		"success":     true,
		"appointment": apt,
	})
}

func StaffGetTodayQueue(c *fiber.Ctx) error {
	doctorID := c.Query("doctor_id")
	hospitalID := c.Query("hospital_id")
	if doctorID == "" || hospitalID == "" {
		return errors.SendError(c, fiber.StatusBadRequest, "MISSING_PARAMS", "doctor_id and hospital_id query params are required")
	}

	queue, err := repository.GetTodayQueue(doctorID, hospitalID)
	if err != nil {
		return errors.SendError(c, fiber.StatusInternalServerError, "DB_ERROR", err.Error())
	}

	return c.JSON(queue)
}

func StaffGetCurrentConsultation(c *fiber.Ctx) error {
	doctorID := c.Query("doctor_id")
	if doctorID == "" {
		return errors.SendError(c, fiber.StatusBadRequest, "MISSING_PARAMS", "doctor_id query param is required")
	}

	apt, err := repository.GetCurrentConsultation(doctorID)
	if err != nil {
		return errors.SendError(c, fiber.StatusInternalServerError, "DB_ERROR", err.Error())
	}

	if apt == nil {
		return c.JSON(nil)
	}
	return c.JSON(apt)
}

func StaffGetTodayHospitalQueue(c *fiber.Ctx) error {
	hospitalID := c.Query("hospital_id")
	if hospitalID == "" {
		return errors.SendError(c, fiber.StatusBadRequest, "MISSING_PARAMS", "hospital_id query param is required")
	}

	doctors, err := repository.GetDoctorsByHospital(hospitalID, "All")
	if err != nil {
		return errors.SendError(c, fiber.StatusInternalServerError, "DB_ERROR", fmt.Sprintf("Failed to fetch doctors: %v", err))
	}

	appointments, err := repository.GetTodayHospitalQueue(hospitalID)
	if err != nil {
		return errors.SendError(c, fiber.StatusInternalServerError, "DB_ERROR", fmt.Sprintf("Failed to fetch today's appointments: %v", err))
	}

	// Group appointments by doctor ID
	apptsByDoctor := make(map[string][]models.Appointment)
	for _, apt := range appointments {
		if apt.Status != "Cancelled" {
			apptsByDoctor[apt.DoctorID] = append(apptsByDoctor[apt.DoctorID], apt)
		}
	}

	type Summary struct {
		Total          int `json:"total"`
		Waiting        int `json:"waiting"`
		Arrived        int `json:"arrived"`
		InConsultation int `json:"in_consultation"`
		Completed      int `json:"completed"`
	}

	type DoctorQueue struct {
		DoctorID       string               `json:"doctor_id"`
		DoctorName     string               `json:"doctor_name"`
		Specialization string               `json:"specialization"`
		Summary        Summary              `json:"summary"`
		Appointments   []models.Appointment `json:"appointments"`
	}

	var doctorsQueueList []DoctorQueue
	totalBooked := 0

	for _, doc := range doctors {
		docAppts := apptsByDoctor[doc.ID]
		if docAppts == nil {
			docAppts = []models.Appointment{}
		}

		summary := Summary{}
		for _, apt := range docAppts {
			summary.Total++
			totalBooked++
			
			switch apt.Status {
			case "Booked", "Confirmed", "In Queue":
				summary.Waiting++
			case "Checked In":
				summary.Arrived++
			case "Consultation Started":
				summary.InConsultation++
			case "Completed":
				summary.Completed++
			}
		}

		doctorsQueueList = append(doctorsQueueList, DoctorQueue{
			DoctorID:       doc.ID,
			DoctorName:     doc.Name,
			Specialization: doc.Specialization,
			Summary:        summary,
			Appointments:   docAppts,
		})
	}

	todayStr := time.Now().Format("2006-01-02")

	return c.JSON(fiber.Map{
		"date":         todayStr,
		"total_booked": totalBooked,
		"doctors":      doctorsQueueList,
	})
}
