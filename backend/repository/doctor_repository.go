package repository

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"queue-care-backend/db"
	"queue-care-backend/models"
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

			// Core Queue Care metrics
			estimatedWait := count * 15 // 15 mins average wait time per patient ahead
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
