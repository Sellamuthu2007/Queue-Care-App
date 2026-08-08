package models

type Hospital struct {
	ID                    string   `db:"id" json:"id"`
	Name                  string   `db:"name" json:"name"`
	Address               string   `db:"address" json:"address"`
	Rating                float64  `db:"rating" json:"rating"`
	OpenHours             string   `db:"open_hours" json:"open_hours"`
	EmergencyAvailability bool     `db:"emergency_availability" json:"emergency_availability"`
	PhoneNumber           string   `db:"phone_number" json:"phone_number"`
	About                 string   `db:"about" json:"about"`
	FacilitiesRaw         string   `db:"facilities" json:"-"`
	DepartmentsRaw        string   `db:"departments" json:"-"`
	ServicesRaw           string   `db:"services" json:"-"`
	Facilities            []string `json:"facilities"`
	Departments           []string `json:"departments"`
	Services              []string `json:"services"`
	CoverImageURL         string   `db:"cover_image_url" json:"cover_image_url"`
}
