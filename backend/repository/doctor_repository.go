package repository

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"queue-care-backend/db"
	"queue-care-backend/models"
	"time"
)

func GetDoctorsByHospital(hospitalID string, specialization string) ([]models.Doctor, error) {
	doctors := []models.Doctor{}
	var err error

	if specialization == "All" || specialization == "" {
		query := `SELECT id, name, specialization, qualification, experience, consultation_fee, 
		          available_today, rating, languages, short_description, profile_photo_url, 
		          registration_number, patients_treated, biography, special_interests, education, 
		          working_hours, available_days, hospital_id 
		          FROM doctors WHERE hospital_id = $1`
		err = db.DB.Select(&doctors, query, hospitalID)
	} else {
		query := `SELECT id, name, specialization, qualification, experience, consultation_fee, 
		          available_today, rating, languages, short_description, profile_photo_url, 
		          registration_number, patients_treated, biography, special_interests, education, 
		          working_hours, available_days, hospital_id 
		          FROM doctors WHERE hospital_id = $1 AND specialization = $2`
		err = db.DB.Select(&doctors, query, hospitalID, specialization)
	}

	if err != nil {
		return nil, err
	}

	for i := range doctors {
		_ = json.Unmarshal([]byte(doctors[i].LanguagesRaw), &doctors[i].Languages)
		_ = json.Unmarshal([]byte(doctors[i].SpecialInterestsRaw), &doctors[i].SpecialInterests)
		_ = json.Unmarshal([]byte(doctors[i].EducationRaw), &doctors[i].Education)
		_ = json.Unmarshal([]byte(doctors[i].AvailableDaysRaw), &doctors[i].AvailableDays)
	}

	return doctors, nil
}

func GetDoctorByID(id string) (*models.Doctor, error) {
	var doctor models.Doctor
	query := `SELECT id, name, specialization, qualification, experience, consultation_fee, 
	          available_today, rating, languages, short_description, profile_photo_url, 
	          registration_number, patients_treated, biography, special_interests, education, 
	          working_hours, available_days, hospital_id 
	          FROM doctors WHERE id = $1`
	
	err := db.DB.Get(&doctor, query, id)
	if err != nil {
		return nil, err
	}

	_ = json.Unmarshal([]byte(doctor.LanguagesRaw), &doctor.Languages)
	_ = json.Unmarshal([]byte(doctor.SpecialInterestsRaw), &doctor.SpecialInterests)
	_ = json.Unmarshal([]byte(doctor.EducationRaw), &doctor.Education)
	_ = json.Unmarshal([]byte(doctor.AvailableDaysRaw), &doctor.AvailableDays)

	return &doctor, nil
}

func GetDoctorAvailability(doctorID string, date string) (*models.DoctorAvailabilityResponse, error) {
	// 1. Fetch doctor specialization details
	var docInfo struct {
		Specialization string `db:"specialization"`
	}
	err := db.DB.Get(&docInfo, "SELECT specialization FROM doctors WHERE id = $1", doctorID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch doctor specialization for availability ML: %v", err)
	}

	// 2. Resolve Doctor historical metrics
	defaultConsultMinutes := 15.0
	defaultWaitMinutes := 30.0
	switch docInfo.Specialization {
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
	`, doctorID, defaultConsultMinutes)
	if err != nil || docAvgConsultationMinutes <= 0 {
		docAvgConsultationMinutes = defaultConsultMinutes
	}

	var docAvgWaitMinutes float64
	err = db.DB.Get(&docAvgWaitMinutes, `
		SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (consultation_started_at - checked_in_at))/60), $2) 
		FROM appointments 
		WHERE doctor_id = $1 AND status = 'Completed'
	`, doctorID, defaultWaitMinutes)
	if err != nil || docAvgWaitMinutes <= 0 {
		docAvgWaitMinutes = defaultWaitMinutes
	}

	// 3. Parse day_of_week
	parsedDate, err := time.Parse("2006-01-02", date)
	var dayOfWeek int
	if err != nil {
		dayOfWeek = int(time.Now().Weekday())
	} else {
		goWeekday := int(parsedDate.Weekday())
		if goWeekday == 0 {
			dayOfWeek = 6 // Sunday is 6 in ML
		} else {
			dayOfWeek = goWeekday - 1 // Monday (1) becomes 0, etc.
		}
	}

	// Define standard working slots
	morningSlots := []string{"09:00 AM", "09:20 AM", "09:40 AM", "10:00 AM", "10:20 AM", "10:40 AM", "11:00 AM", "11:20 AM", "11:40 AM", "12:00 PM"}
	afternoonSlots := []string{"02:00 PM", "02:20 PM", "02:40 PM", "03:00 PM", "03:20 PM", "03:40 PM", "04:00 PM", "04:20 PM", "04:40 PM", "05:00 PM"}
	eveningSlots := []string{"06:00 PM", "06:20 PM", "06:40 PM", "07:00 PM", "07:20 PM", "07:40 PM", "08:00 PM"}

	maxPatients := 5 // Slot capacity

	buildSession := func(sessionName string, times []string) (models.SessionAvailability, error) {
		var slots []models.TimeSlot
		for _, t := range times {
			// Query actual booked count for this slot to support future live queues
			var count int
			q := `SELECT COUNT(*) FROM appointments 
			      WHERE doctor_id = $1 AND appointment_date = $2 AND appointment_time = $3 AND status != 'Cancelled'`
			err := db.DB.Get(&count, q, doctorID, date, t)
			if err != nil && err != sql.ErrNoRows {
				return models.SessionAvailability{}, err
			}

			// Parse slot time (e.g. "09:20 AM") for hour/minute features
			var hour, minute int
			var ampm string
			_, err = fmt.Sscanf(t, "%d:%d %s", &hour, &minute, &ampm)
			if err == nil {
				if ampm == "PM" && hour < 12 {
					hour += 12
				} else if ampm == "AM" && hour == 12 {
					hour = 0
				}
			} else {
				_, _ = fmt.Sscanf(t, "%d:%d", &hour, &minute)
			}

			// Construct dynamic ML features request for this future slot
			mlReq := &MLPredictRequest{
				DoctorID:                     doctorID,
				Specialization:               docInfo.Specialization,
				DayOfWeek:                    dayOfWeek,
				AppointmentHour:              hour,
				AppointmentMinute:            minute,
				QueuePosition:                count + 1,
				PatientsAhead:                count,
				CheckedInAhead:               0, // 0 physical arrivals ahead for future slot checks
				CurrentQueueLength:           count,
				SlotBookedCount:              count + 1,
				CompletedConsultationsToday:  0, // Future date, so no completions yet
				DoctorAvgConsultationMinutes: docAvgConsultationMinutes,
				DoctorAvgWaitMinutes:         docAvgWaitMinutes,
			}

			// Core Queue Care ML prediction
			var estimatedWait int
			predWait, err := GetMLWaitTimePrediction(mlReq)
			if err != nil {
				// Fallback to baseline
				estimatedWait = count * 15
			} else {
				estimatedWait = int(predWait)
			}

			isAvailable := count < maxPatients

			slots = append(slots, models.TimeSlot{
				Time:          t,
				BookedCount:   count,
				MaxPatients:   maxPatients,
				EstimatedWait: estimatedWait,
				QueueLength:   count,
				IsAvailable:   isAvailable,
			})
		}
		return models.SessionAvailability{
			SessionName: sessionName,
			Slots:       slots,
		}, nil
	}

	morning, err := buildSession("Morning", morningSlots)
	if err != nil {
		return nil, fmt.Errorf("failed to load morning slots: %v", err)
	}

	afternoon, err := buildSession("Afternoon", afternoonSlots)
	if err != nil {
		return nil, fmt.Errorf("failed to load afternoon slots: %v", err)
	}

	evening, err := buildSession("Evening", eveningSlots)
	if err != nil {
		return nil, fmt.Errorf("failed to load evening slots: %v", err)
	}

	return &models.DoctorAvailabilityResponse{
		DoctorID:     doctorID,
		SelectedDate: date,
		Sessions:     []models.SessionAvailability{morning, afternoon, evening},
	}, nil
}
