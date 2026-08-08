package router

import (
	"queue-care-backend/db"
	"queue-care-backend/handler"
	"queue-care-backend/middleware"
	"queue-care-backend/models"

	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App) {
	api := app.Group("/api/v1")

	api.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "healthy",
			"message": "Queue Care Go Backend is running",
		})
	})

	api.Get("/debug/db", func(c *fiber.Ctx) error {
		var appointments []models.Appointment
		err := db.DB.Select(&appointments, `
			SELECT a.id, a.patient_id, a.doctor_id, a.hospital_id, a.appointment_date, a.appointment_time, 
				a.department, a.reason, a.symptoms, a.status, a.created_at, a.updated_at, 
				a.queue_position, a.estimated_wait, a.slot_capacity, a.booked_count, a.notes,
				a.patient_name, a.patient_age, a.patient_gender, a.patient_phone, a.patient_email, a.patient_address,
				a.patient_blood_group, a.patient_emergency_contact, a.medical_diseases, a.medical_medications,
				a.medical_previous_visit, a.medical_insurance_available, a.medical_insurance_provider,
				d.name AS doctor_name, d.specialization AS doctor_specialization, d.profile_photo_url AS doctor_photo_url,
				h.name AS hospital_name, d.consultation_fee AS consultation_fee
			FROM appointments a
			LEFT JOIN doctors d ON a.doctor_id = d.id
			LEFT JOIN hospitals h ON a.hospital_id = h.id
		`)
		if err != nil {
			return c.Status(500).SendString(err.Error())
		}
		return c.JSON(appointments)
	})

	auth := api.Group("/auth")
	auth.Post("/google", handler.GoogleSignIn)
	auth.Post("/refresh", handler.RefreshToken)
	auth.Post("/login", handler.EmailPasswordLogin)

	// Authenticated Routes
	authenticated := api.Group("/", middleware.AuthRequired)

	// Hospital endpoints
	authenticated.Get("/hospital", handler.GetHospital)
	authenticated.Get("/hospital/:id/doctors", handler.GetHospitalDoctors)

	// Doctor endpoints
	authenticated.Get("/doctor/:id", handler.GetDoctorByID)
	authenticated.Get("/doctor/:id/availability", handler.GetDoctorAvailability)

	// Appointment endpoints
	authenticated.Post("/appointments", handler.BookAppointment)
	authenticated.Get("/appointments/me", handler.GetMyAppointments)
	authenticated.Get("/appointments/:id", handler.GetAppointmentDetails)
	authenticated.Patch("/appointments/:id/cancel", handler.CancelMyAppointment)
}

