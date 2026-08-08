package repository

import (
	"database/sql"
	"queue-care-backend/db"
	"queue-care-backend/models"
)

func CreateAppointment(apt *models.Appointment) (*models.Appointment, error) {
	// 1. Calculate slot capacity metrics for dynamic future-ready queueing
	var bookedCount int
	qCount := `SELECT COUNT(*) FROM appointments 
	           WHERE doctor_id = $1 AND appointment_date = $2 AND appointment_time = $3 AND status != 'Cancelled'`
	err := db.DB.Get(&bookedCount, qCount, apt.DoctorID, apt.AppointmentDate, apt.AppointmentTime)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}

	apt.SlotCapacity = 5
	apt.BookedCount = bookedCount
	apt.QueuePosition = bookedCount + 1
	apt.EstimatedWait = bookedCount * 15 // 15 minutes average session length
	apt.Status = "Booked"

	// 2. Insert into database
	query := `INSERT INTO appointments (
		patient_id, doctor_id, hospital_id, appointment_date, appointment_time, department, 
		reason, symptoms, status, queue_position, estimated_wait, slot_capacity, booked_count, notes,
		patient_name, patient_age, patient_gender, patient_phone, patient_email, patient_address, 
		patient_blood_group, patient_emergency_contact, medical_diseases, medical_medications, 
		medical_previous_visit, medical_insurance_available, medical_insurance_provider
	) VALUES (
		$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, 
		$21, $22, $23, $24, $25, $26, $27
	) RETURNING id, created_at, updated_at`

	err = db.DB.QueryRow(
		query,
		apt.PatientID, apt.DoctorID, apt.HospitalID, apt.AppointmentDate, apt.AppointmentTime, apt.Department,
		apt.Reason, apt.Symptoms, apt.Status, apt.QueuePosition, apt.EstimatedWait, apt.SlotCapacity, apt.BookedCount, apt.Notes,
		apt.PatientName, apt.PatientAge, apt.PatientGender, apt.PatientPhone, apt.PatientEmail, apt.PatientAddress,
		apt.PatientBloodGroup, apt.PatientEmergencyContact, apt.MedicalDiseases, apt.MedicalMedications,
		apt.MedicalPreviousVisit, apt.MedicalInsuranceAvailable, apt.MedicalInsuranceProvider,
	).Scan(&apt.ID, &apt.CreatedAt, &apt.UpdatedAt)

	if err != nil {
		return nil, err
	}

	return GetAppointmentByID(apt.ID, apt.PatientID)
}

func GetAppointmentsByPatientID(patientID string) ([]models.Appointment, error) {
	appointments := []models.Appointment{}
	query := `SELECT 
				a.id, a.patient_id, a.doctor_id, a.hospital_id, a.appointment_date, a.appointment_time, 
				a.department, a.reason, a.symptoms, a.status, a.created_at, a.updated_at, 
				a.queue_position, a.estimated_wait, a.slot_capacity, a.booked_count, a.notes,
				a.patient_name, a.patient_age, a.patient_gender, a.patient_phone, a.patient_email, a.patient_address,
				a.patient_blood_group, a.patient_emergency_contact, a.medical_diseases, a.medical_medications,
				a.medical_previous_visit, a.medical_insurance_available, a.medical_insurance_provider,
				d.name AS doctor_name, d.specialization AS doctor_specialization, d.profile_photo_url AS doctor_photo_url,
				h.name AS hospital_name, d.consultation_fee AS consultation_fee
			  FROM appointments a
			  JOIN doctors d ON a.doctor_id = d.id
			  JOIN hospitals h ON a.hospital_id = h.id
			  WHERE a.patient_id = $1
			  ORDER BY a.appointment_date ASC, a.appointment_time ASC`

	err := db.DB.Select(&appointments, query, patientID)
	if err != nil {
		return nil, err
	}
	return appointments, nil
}

func GetAppointmentByID(id string, patientID string) (*models.Appointment, error) {
	var apt models.Appointment
	query := `SELECT 
				a.id, a.patient_id, a.doctor_id, a.hospital_id, a.appointment_date, a.appointment_time, 
				a.department, a.reason, a.symptoms, a.status, a.created_at, a.updated_at, 
				a.queue_position, a.estimated_wait, a.slot_capacity, a.booked_count, a.notes,
				a.patient_name, a.patient_age, a.patient_gender, a.patient_phone, a.patient_email, a.patient_address,
				a.patient_blood_group, a.patient_emergency_contact, a.medical_diseases, a.medical_medications,
				a.medical_previous_visit, a.medical_insurance_available, a.medical_insurance_provider,
				d.name AS doctor_name, d.specialization AS doctor_specialization, d.profile_photo_url AS doctor_photo_url,
				h.name AS hospital_name, d.consultation_fee AS consultation_fee
			  FROM appointments a
			  JOIN doctors d ON a.doctor_id = d.id
			  JOIN hospitals h ON a.hospital_id = h.id
			  WHERE a.id = $1 AND a.patient_id = $2`

	err := db.DB.Get(&apt, query, id, patientID)
	if err != nil {
		return nil, err
	}
	return &apt, nil
}

func CancelAppointment(id string, patientID string) error {
	query := `UPDATE appointments SET status = 'Cancelled', updated_at = NOW() 
	          WHERE id = $1 AND patient_id = $2`
	_, err := db.DB.Exec(query, id, patientID)
	return err
}
