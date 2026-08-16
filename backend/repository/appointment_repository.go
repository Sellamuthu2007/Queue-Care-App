package repository

import (
	"database/sql"
	"fmt"
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
				a.booked_at, a.confirmed_at, a.checked_in_at, a.queue_entered_at, a.consultation_started_at, a.completed_at,
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
				a.booked_at, a.confirmed_at, a.checked_in_at, a.queue_entered_at, a.consultation_started_at, a.completed_at,
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

func GetAppointmentByIDWithoutPatient(id string) (*models.Appointment, error) {
	var apt models.Appointment
	query := `SELECT 
				a.id, a.patient_id, a.doctor_id, a.hospital_id, a.appointment_date, a.appointment_time, 
				a.department, a.reason, a.symptoms, a.status, a.created_at, a.updated_at, 
				a.queue_position, a.estimated_wait, a.slot_capacity, a.booked_count, a.notes,
				a.patient_name, a.patient_age, a.patient_gender, a.patient_phone, a.patient_email, a.patient_address,
				a.patient_blood_group, a.patient_emergency_contact, a.medical_diseases, a.medical_medications,
				a.medical_previous_visit, a.medical_insurance_available, a.medical_insurance_provider,
				a.booked_at, a.confirmed_at, a.checked_in_at, a.queue_entered_at, a.consultation_started_at, a.completed_at,
				d.name AS doctor_name, d.specialization AS doctor_specialization, d.profile_photo_url AS doctor_photo_url,
				h.name AS hospital_name, d.consultation_fee AS consultation_fee
			  FROM appointments a
			  JOIN doctors d ON a.doctor_id = d.id
			  JOIN hospitals h ON a.hospital_id = h.id
			  WHERE a.id = $1`

	err := db.DB.Get(&apt, query, id)
	if err != nil {
		return nil, err
	}
	return &apt, nil
}

func CancelAppointment(id string, patientID string) error {
	query := `DELETE FROM appointments WHERE id = $1 AND patient_id = $2`
	_, err := db.DB.Exec(query, id, patientID)
	return err
}

func CheckInAppointment(id string) (*models.Appointment, error) {
	tx, err := db.DB.Beginx()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	var apt models.Appointment
	query := `SELECT id, status FROM appointments WHERE id = $1`
	err = tx.Get(&apt, query, id)
	if err != nil {
		return nil, fmt.Errorf("appointment not found")
	}

	if apt.Status == "Cancelled" {
		return nil, fmt.Errorf("this appointment has been cancelled")
	}
	if apt.Status == "Completed" {
		return nil, fmt.Errorf("this appointment has already been completed")
	}
	if apt.Status == "Checked In" || apt.Status == "In Queue" || apt.Status == "Consultation Started" {
		return nil, fmt.Errorf("patient is already checked in")
	}

	// State transitions: Booked -> Confirmed -> Checked In
	var updateQuery string
	if apt.Status == "Booked" {
		updateQuery = `UPDATE appointments 
		               SET status = 'Checked In', 
		                   confirmed_at = COALESCE(confirmed_at, NOW()), 
		                   checked_in_at = NOW(), 
		                   updated_at = NOW() 
		               WHERE id = $1`
	} else {
		updateQuery = `UPDATE appointments 
		               SET status = 'Checked In', 
		                   checked_in_at = NOW(), 
		                   updated_at = NOW() 
		               WHERE id = $1`
	}

	_, err = tx.Exec(updateQuery, id)
	if err != nil {
		return nil, fmt.Errorf("failed to check in patient: %v", err)
	}

	err = tx.Commit()
	if err != nil {
		return nil, err
	}

	return GetAppointmentByIDWithoutPatient(id)
}

func StartConsultation(newAptID string, doctorID string) (*models.Appointment, *models.Appointment, error) {
	tx, err := db.DB.Beginx()
	if err != nil {
		return nil, nil, err
	}
	defer tx.Rollback()

	// 1. Get current active consultation for this doctor
	var activeApt models.Appointment
	var prevConsultation *models.Appointment
	activeQuery := `SELECT id, patient_id, status FROM appointments 
	                WHERE doctor_id = $1 AND status = 'Consultation Started' LIMIT 1`
	err = tx.Get(&activeApt, activeQuery, doctorID)
	if err == nil {
		if activeApt.ID == newAptID {
			return nil, nil, fmt.Errorf("Consultation is already active for this patient.")
		}
		return nil, nil, fmt.Errorf("A consultation is already running. Please complete it before starting a new one.")
	}

	// 2. Fetch the new appointment and check state transitions
	var newApt models.Appointment
	newAptQuery := `SELECT id, status, doctor_id FROM appointments WHERE id = $1`
	err = tx.Get(&newApt, newAptQuery, newAptID)
	if err != nil {
		return nil, nil, fmt.Errorf("appointment not found")
	}

	if newApt.DoctorID != doctorID {
		return nil, nil, fmt.Errorf("this patient is not assigned to the current doctor")
	}
	if newApt.Status == "Cancelled" {
		return nil, nil, fmt.Errorf("this appointment has been cancelled")
	}
	if newApt.Status == "Completed" {
		return nil, nil, fmt.Errorf("this appointment has already been completed")
	}

	// Never bypass state machine
	if newApt.Status != "Checked In" && newApt.Status != "In Queue" && newApt.Status != "Consultation Started" {
		return nil, nil, fmt.Errorf("patient must check in before starting consultation")
	}

	// Update new appointment
	updateNewQuery := `UPDATE appointments 
	                   SET status = 'Consultation Started', 
	                       consultation_started_at = COALESCE(consultation_started_at, NOW()), 
	                       queue_entered_at = COALESCE(queue_entered_at, NOW()),
	                       updated_at = NOW() 
	                   WHERE id = $1`
	_, err = tx.Exec(updateNewQuery, newAptID)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to start new consultation: %v", err)
	}

	err = tx.Commit()
	if err != nil {
		return nil, nil, err
	}

	// Fetch updated current appointment
	currentConsultation, err := GetAppointmentByIDWithoutPatient(newAptID)
	if err != nil {
		return nil, nil, err
	}

	return prevConsultation, currentConsultation, nil
}

func UpdateAppointmentStatusManual(id string, targetStatus string) (*models.Appointment, error) {
	tx, err := db.DB.Beginx()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	var apt models.Appointment
	query := `SELECT id, status FROM appointments WHERE id = $1`
	err = tx.Get(&apt, query, id)
	if err != nil {
		return nil, fmt.Errorf("appointment not found")
	}

	if apt.Status == "Cancelled" {
		return nil, fmt.Errorf("this appointment has been cancelled")
	}

	// Validate transitions
	var updateQuery string
	switch targetStatus {
	case "Confirmed":
		if apt.Status != "Booked" && apt.Status != "Confirmed" {
			return nil, fmt.Errorf("invalid transition to Confirmed from %s", apt.Status)
		}
		updateQuery = `UPDATE appointments SET status = 'Confirmed', confirmed_at = COALESCE(confirmed_at, NOW()), updated_at = NOW() WHERE id = $1`
	case "Checked In":
		if apt.Status != "Booked" && apt.Status != "Confirmed" && apt.Status != "Checked In" {
			return nil, fmt.Errorf("invalid transition to Checked In from %s", apt.Status)
		}
		updateQuery = `UPDATE appointments SET status = 'Checked In', confirmed_at = COALESCE(confirmed_at, NOW()), checked_in_at = COALESCE(checked_in_at, NOW()), updated_at = NOW() WHERE id = $1`
	case "In Queue":
		if apt.Status != "Checked In" && apt.Status != "In Queue" {
			return nil, fmt.Errorf("invalid transition to In Queue from %s (must be Checked In first)", apt.Status)
		}
		updateQuery = `UPDATE appointments SET status = 'In Queue', queue_entered_at = COALESCE(queue_entered_at, NOW()), updated_at = NOW() WHERE id = $1`
	case "Consultation Started":
		if apt.Status != "In Queue" && apt.Status != "Checked In" && apt.Status != "Consultation Started" {
			return nil, fmt.Errorf("invalid transition to Consultation Started from %s (must check in/queue first)", apt.Status)
		}
		updateQuery = `UPDATE appointments SET status = 'Consultation Started', queue_entered_at = COALESCE(queue_entered_at, NOW()), consultation_started_at = COALESCE(consultation_started_at, NOW()), updated_at = NOW() WHERE id = $1`
	case "Completed":
		if apt.Status != "Consultation Started" && apt.Status != "Completed" {
			return nil, fmt.Errorf("invalid transition to Completed from %s", apt.Status)
		}
		updateQuery = `UPDATE appointments SET status = 'Completed', completed_at = COALESCE(completed_at, NOW()), updated_at = NOW() WHERE id = $1`
	case "Cancelled":
		updateQuery = `UPDATE appointments SET status = 'Cancelled', updated_at = NOW() WHERE id = $1`
	default:
		return nil, fmt.Errorf("unknown target status: %s", targetStatus)
	}

	_, err = tx.Exec(updateQuery, id)
	if err != nil {
		return nil, fmt.Errorf("failed to transition status: %v", err)
	}

	err = tx.Commit()
	if err != nil {
		return nil, err
	}

	return GetAppointmentByIDWithoutPatient(id)
}

func GetTodayQueue(doctorID string, hospitalID string) ([]models.Appointment, error) {
	appointments := []models.Appointment{}
	query := `SELECT 
				a.id, a.patient_id, a.doctor_id, a.hospital_id, a.appointment_date, a.appointment_time, 
				a.department, a.reason, a.symptoms, a.status, a.created_at, a.updated_at, 
				a.queue_position, a.estimated_wait, a.slot_capacity, a.booked_count, a.notes,
				a.patient_name, a.patient_age, a.patient_gender, a.patient_phone, a.patient_email, a.patient_address,
				a.patient_blood_group, a.patient_emergency_contact, a.medical_diseases, a.medical_medications,
				a.medical_previous_visit, a.medical_insurance_available, a.medical_insurance_provider,
				a.booked_at, a.confirmed_at, a.checked_in_at, a.queue_entered_at, a.consultation_started_at, a.completed_at,
				d.name AS doctor_name, d.specialization AS doctor_specialization,
				h.name AS hospital_name
			  FROM appointments a
			  JOIN doctors d ON a.doctor_id = d.id
			  JOIN hospitals h ON a.hospital_id = h.id
			  WHERE a.doctor_id = $1 AND a.hospital_id = $2 AND a.appointment_date = CURRENT_DATE
			  ORDER BY a.queue_position ASC`

	err := db.DB.Select(&appointments, query, doctorID, hospitalID)
	if err != nil {
		return nil, err
	}
	return appointments, nil
}

func GetCurrentConsultation(doctorID string) (*models.Appointment, error) {
	var apt models.Appointment
	query := `SELECT 
				a.id, a.patient_id, a.doctor_id, a.hospital_id, a.appointment_date, a.appointment_time, 
				a.department, a.reason, a.symptoms, a.status, a.created_at, a.updated_at, 
				a.queue_position, a.estimated_wait, a.slot_capacity, a.booked_count, a.notes,
				a.patient_name, a.patient_age, a.patient_gender, a.patient_phone, a.patient_email, a.patient_address,
				a.patient_blood_group, a.patient_emergency_contact, a.medical_diseases, a.medical_medications,
				a.medical_previous_visit, a.medical_insurance_available, a.medical_insurance_provider,
				a.booked_at, a.confirmed_at, a.checked_in_at, a.queue_entered_at, a.consultation_started_at, a.completed_at,
				d.name AS doctor_name, d.specialization AS doctor_specialization,
				h.name AS hospital_name
			  FROM appointments a
			  JOIN doctors d ON a.doctor_id = d.id
			  JOIN hospitals h ON a.hospital_id = h.id
			  WHERE a.doctor_id = $1 AND a.status = 'Consultation Started' LIMIT 1`

	err := db.DB.Get(&apt, query, doctorID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &apt, nil
}

func GetTodayHospitalQueue(hospitalID string) ([]models.Appointment, error) {
	appointments := []models.Appointment{}
	query := `SELECT 
				a.id, a.patient_id, a.doctor_id, a.hospital_id, a.appointment_date, a.appointment_time, 
				a.department, a.reason, a.symptoms, a.status, a.created_at, a.updated_at, 
				a.queue_position, a.estimated_wait, a.slot_capacity, a.booked_count, a.notes,
				a.patient_name, a.patient_age, a.patient_gender, a.patient_phone, a.patient_email, a.patient_address,
				a.patient_blood_group, a.patient_emergency_contact, a.medical_diseases, a.medical_medications,
				a.medical_previous_visit, a.medical_insurance_available, a.medical_insurance_provider,
				a.booked_at, a.confirmed_at, a.checked_in_at, a.queue_entered_at, a.consultation_started_at, a.completed_at,
				d.name AS doctor_name, d.specialization AS doctor_specialization,
				h.name AS hospital_name
			  FROM appointments a
			  JOIN doctors d ON a.doctor_id = d.id
			  JOIN hospitals h ON a.hospital_id = h.id
			  WHERE a.hospital_id = $1 AND a.appointment_date = CURRENT_DATE
			  ORDER BY a.queue_position ASC`

	err := db.DB.Select(&appointments, query, hospitalID)
	if err != nil {
		return nil, err
	}
	return appointments, nil
}
