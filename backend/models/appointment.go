package models

import "time"

type Appointment struct {
	ID                       string    `db:"id" json:"appointment_id"`
	PatientID                string    `db:"patient_id" json:"patient_id"`
	DoctorID                 string    `db:"doctor_id" json:"doctor_id"`
	HospitalID               string    `db:"hospital_id" json:"hospital_id"`
	AppointmentDate          string    `db:"appointment_date" json:"appointment_date"`
	AppointmentTime          string    `db:"appointment_time" json:"appointment_time"`
	Department               string    `db:"department" json:"department"`
	Reason                   string    `db:"reason" json:"reason"`
	Symptoms                 string    `db:"symptoms" json:"symptoms"`
	Status                   string    `db:"status" json:"status"` // Booked, Confirmed, Checked In, In Queue, Consultation Started, Completed, Cancelled
	CreatedAt                time.Time `db:"created_at" json:"created_at"`
	UpdatedAt                time.Time `db:"updated_at" json:"updated_at"`
	QueuePosition            int       `db:"queue_position" json:"queue_position"`
	EstimatedWait            int       `db:"estimated_wait" json:"estimated_wait"`
	SlotCapacity             int       `db:"slot_capacity" json:"slot_capacity"`
	BookedCount              int       `db:"booked_count" json:"booked_count"`
	Notes                    string    `db:"notes" json:"notes"`
	// Patient details
	PatientName              string    `db:"patient_name" json:"patient_name"`
	PatientAge               int       `db:"patient_age" json:"patient_age"`
	PatientGender            string    `db:"patient_gender" json:"patient_gender"`
	PatientPhone             string    `db:"patient_phone" json:"patient_phone"`
	PatientEmail             string    `db:"patient_email" json:"patient_email"`
	PatientAddress           string    `db:"patient_address" json:"patient_address"`
	PatientBloodGroup        string    `db:"patient_blood_group" json:"patient_blood_group"`
	PatientEmergencyContact  string    `db:"patient_emergency_contact" json:"patient_emergency_contact"`
	// Medical details
	MedicalDiseases          string    `db:"medical_diseases" json:"medical_diseases"`
	MedicalMedications       string    `db:"medical_medications" json:"medical_medications"`
	MedicalPreviousVisit     bool      `db:"medical_previous_visit" json:"medical_previous_visit"`
	MedicalInsuranceAvailable bool      `db:"medical_insurance_available" json:"medical_insurance_available"`
	MedicalInsuranceProvider  string    `db:"medical_insurance_provider" json:"medical_insurance_provider"`
	// Joins (only loaded in detail responses, optional)
	DoctorName               string    `db:"doctor_name" json:"doctor_name,omitempty"`
	DoctorSpecialization     string    `db:"doctor_specialization" json:"doctor_specialization,omitempty"`
	DoctorPhotoURL           string    `db:"doctor_photo_url" json:"doctor_photo_url,omitempty"`
	HospitalName             string    `db:"hospital_name" json:"hospital_name,omitempty"`
	ConsultationFee          float64   `db:"consultation_fee" json:"consultation_fee,omitempty"`
}
