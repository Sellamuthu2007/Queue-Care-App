package repository

import (
	"fmt"
	"log"
	"queue-care-backend/db"
	"time"
)

// GetMLFeaturesForAppointment gathers all real-time features required by the XGBoost wait time model.
func GetMLFeaturesForAppointment(appointmentID string) (*MLPredictRequest, error) {
	// 1. Fetch base appointment and doctor specialization details
	type baseAptInfo struct {
		DoctorID        string `db:"doctor_id"`
		Specialization  string `db:"specialization"`
		AppointmentDate string `db:"appointment_date"`
		AppointmentTime string `db:"appointment_time"`
		QueuePosition   int    `db:"queue_position"`
	}

	var apt baseAptInfo
	query := `
		SELECT a.doctor_id, d.specialization, a.appointment_date, a.appointment_time, a.queue_position
		FROM appointments a
		JOIN doctors d ON a.doctor_id = d.id
		WHERE a.id = $1
	`
	err := db.DB.Get(&apt, query, appointmentID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch base appointment info for ML: %v", err)
	}

	// 2. Parse day_of_week, hour, and minute
	// Date layout "2006-01-02"
	parsedDate, err := time.Parse("2006-01-02", apt.AppointmentDate)
	var dayOfWeek int
	if err != nil {
		// Fallback to current weekday if date format is unexpected
		dayOfWeek = int(time.Now().Weekday())
	} else {
		// time.Weekday in Go is 0 = Sunday, 1 = Monday.
		// Wait! In the training script/README: 0 = Monday, ..., 6 = Sunday.
		// Let's map Go's Weekday (0 = Sunday, 1 = Monday) to ML's format (0 = Monday, 6 = Sunday):
		goWeekday := int(parsedDate.Weekday())
		if goWeekday == 0 {
			dayOfWeek = 6 // Sunday is 6 in ML
		} else {
			dayOfWeek = goWeekday - 1 // Monday (1) becomes 0, etc.
		}
	}

	// Time layout "15:04"
	var hour, minute int
	_, err = fmt.Sscanf(apt.AppointmentTime, "%d:%d", &hour, &minute)
	if err != nil {
		// Fallback to defaults
		hour = 10
		minute = 0
	}

	// 3. Compute real-time queue metrics (non-cancelled appointments)
	var patientsAhead int
	err = db.DB.Get(&patientsAhead, `
		SELECT COUNT(*) FROM appointments 
		WHERE doctor_id = $1 AND appointment_date = $2 AND queue_position < $3 AND status != 'Cancelled'
	`, apt.DoctorID, apt.AppointmentDate, apt.QueuePosition)
	if err != nil {
		patientsAhead = 0
	}

	var checkedInAhead int
	err = db.DB.Get(&checkedInAhead, `
		SELECT COUNT(*) FROM appointments 
		WHERE doctor_id = $1 AND appointment_date = $2 AND queue_position < $3 
		AND status IN ('Checked In', 'In Queue', 'Consultation Started')
	`, apt.DoctorID, apt.AppointmentDate, apt.QueuePosition)
	if err != nil {
		checkedInAhead = 0
	}

	var currentQueueLength int
	err = db.DB.Get(&currentQueueLength, `
		SELECT COUNT(*) FROM appointments 
		WHERE doctor_id = $1 AND appointment_date = $2 
		AND status IN ('Checked In', 'In Queue', 'Consultation Started')
	`, apt.DoctorID, apt.AppointmentDate)
	if err != nil {
		currentQueueLength = 0
	}

	var slotBookedCount int
	err = db.DB.Get(&slotBookedCount, `
		SELECT COUNT(*) FROM appointments 
		WHERE doctor_id = $1 AND appointment_date = $2 AND appointment_time = $3 AND status != 'Cancelled'
	`, apt.DoctorID, apt.AppointmentDate, apt.AppointmentTime)
	if err != nil {
		slotBookedCount = 1
	}

	var completedConsultationsToday int
	err = db.DB.Get(&completedConsultationsToday, `
		SELECT COUNT(*) FROM appointments 
		WHERE doctor_id = $1 AND appointment_date = $2 AND status = 'Completed'
	`, apt.DoctorID, apt.AppointmentDate)
	if err != nil {
		completedConsultationsToday = 0
	}

	// 4. Resolve Doctor historical metrics
	// Specialization default averages
	defaultConsultMinutes := 15.0
	defaultWaitMinutes := 30.0
	switch apt.Specialization {
	case "Pediatrics":
		defaultConsultMinutes = 16.0
		defaultWaitMinutes = 60.0
	case "Orthopedics":
		defaultConsultMinutes = 18.0
		defaultWaitMinutes = 90.0
	case "Dermatology":
		defaultConsultMinutes = 12.0
		defaultWaitMinutes = 45.0
	case "Cardiology":
		defaultConsultMinutes = 20.0
		defaultWaitMinutes = 50.0
	}

	var docAvgConsultationMinutes float64
	err = db.DB.Get(&docAvgConsultationMinutes, `
		SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (completed_at - consultation_started_at))/60), $2) 
		FROM appointments 
		WHERE doctor_id = $1 AND status = 'Completed'
	`, apt.DoctorID, defaultConsultMinutes)
	if err != nil || docAvgConsultationMinutes <= 0 {
		docAvgConsultationMinutes = defaultConsultMinutes
	}

	var docAvgWaitMinutes float64
	err = db.DB.Get(&docAvgWaitMinutes, `
		SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (consultation_started_at - checked_in_at))/60), $2) 
		FROM appointments 
		WHERE doctor_id = $1 AND status = 'Completed'
	`, apt.DoctorID, defaultWaitMinutes)
	if err != nil || docAvgWaitMinutes <= 0 {
		docAvgWaitMinutes = defaultWaitMinutes
	}

	// 5. Construct the request struct
	req := &MLPredictRequest{
		DoctorID:                     apt.DoctorID,
		Specialization:               apt.Specialization,
		DayOfWeek:                    dayOfWeek,
		AppointmentHour:              hour,
		AppointmentMinute:            minute,
		QueuePosition:                apt.QueuePosition,
		PatientsAhead:                patientsAhead,
		CheckedInAhead:               checkedInAhead,
		CurrentQueueLength:           currentQueueLength,
		SlotBookedCount:              slotBookedCount,
		CompletedConsultationsToday:  completedConsultationsToday,
		DoctorAvgConsultationMinutes: docAvgConsultationMinutes,
		DoctorAvgWaitMinutes:         docAvgWaitMinutes,
	}

	log.Printf("[ML Features] appointment=%s doctor=%s spec=%s day=%d hour=%d min=%d patientsAhead=%d checkedInAhead=%d qLen=%d slots=%d completed=%d avgConsult=%.1f avgWait=%.1f",
		appointmentID, req.DoctorID, req.Specialization, req.DayOfWeek, req.AppointmentHour, req.AppointmentMinute,
		req.PatientsAhead, req.CheckedInAhead, req.CurrentQueueLength, req.SlotBookedCount, req.CompletedConsultationsToday,
		req.DoctorAvgConsultationMinutes, req.DoctorAvgWaitMinutes)

	return req, nil
}
