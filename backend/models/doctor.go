package models

type Doctor struct {
	ID                 string   `db:"id" json:"id"`
	Name               string   `db:"name" json:"name"`
	Specialization     string   `db:"specialization" json:"specialization"`
	Qualification      string   `db:"qualification" json:"qualification"`
	Experience         int      `db:"experience" json:"experience"`
	ConsultationFee    float64  `db:"consultation_fee" json:"consultation_fee"`
	AvailableToday     bool     `db:"available_today" json:"available_today"`
	Rating             float64  `db:"rating" json:"rating"`
	LanguagesRaw       string   `db:"languages" json:"-"`
	Languages          []string `json:"languages"`
	ShortDescription   string   `db:"short_description" json:"short_description"`
	ProfilePhotoURL    string   `db:"profile_photo_url" json:"profile_photo_url"`
	RegistrationNumber string   `db:"registration_number" json:"registration_number"`
	PatientsTreated    int      `db:"patients_treated" json:"patients_treated"`
	Biography          string   `db:"biography" json:"biography"`
	SpecialInterestsRaw string  `db:"special_interests" json:"-"`
	SpecialInterests   []string `json:"special_interests"`
	EducationRaw       string   `db:"education" json:"-"`
	Education          []string `json:"education"`
	WorkingHours       string   `db:"working_hours" json:"working_hours"`
	AvailableDaysRaw   string   `db:"available_days" json:"-"`
	AvailableDays      []string `json:"available_days"`
	HospitalID         string   `db:"hospital_id" json:"hospital_id"`
}

type TimeSlot struct {
	Time          string  `json:"time"`          // "09:00", "09:20", etc.
	BookedCount   int     `json:"bookedCount"`   // e.g. 2
	MaxPatients   int     `json:"maxPatients"`   // e.g. 5
	EstimatedWait int     `json:"estimatedWait"` // in minutes
	QueueLength   int     `json:"queueLength"`   // number of patients ahead
	IsAvailable   bool    `json:"isAvailable"`
}

type SessionAvailability struct {
	SessionName string     `json:"sessionName"` // "Morning", "Afternoon", "Evening"
	Slots       []TimeSlot `json:"slots"`
}

type DoctorAvailabilityResponse struct {
	DoctorID      string                `json:"doctorId"`
	SelectedDate  string                `json:"selectedDate"`
	Sessions      []SessionAvailability `json:"sessions"`
}
