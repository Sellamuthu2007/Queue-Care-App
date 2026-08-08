package repository

import (
	"encoding/json"
	"queue-care-backend/db"
	"queue-care-backend/models"
)

func GetDefaultHospital() (*models.Hospital, error) {
	var hospital models.Hospital
	query := `SELECT id, name, address, rating, open_hours, emergency_availability, 
	          phone_number, about, facilities, departments, services, cover_image_url 
	          FROM hospitals LIMIT 1`
	
	err := db.DB.Get(&hospital, query)
	if err != nil {
		return nil, err
	}

	// Parse JSON fields
	_ = json.Unmarshal([]byte(hospital.FacilitiesRaw), &hospital.Facilities)
	_ = json.Unmarshal([]byte(hospital.DepartmentsRaw), &hospital.Departments)
	_ = json.Unmarshal([]byte(hospital.ServicesRaw), &hospital.Services)

	return &hospital, nil
}
