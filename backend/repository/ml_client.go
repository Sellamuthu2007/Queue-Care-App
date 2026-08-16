package repository

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"
)

type MLPredictRequest struct {
	DoctorID                     string  `json:"doctor_id"`
	Specialization               string  `json:"specialization"`
	DayOfWeek                    int     `json:"day_of_week"`
	AppointmentHour              int     `json:"appointment_hour"`
	AppointmentMinute            int     `json:"appointment_minute"`
	QueuePosition                int     `json:"queue_position"`
	PatientsAhead                int     `json:"patients_ahead"`
	CheckedInAhead               int     `json:"checked_in_ahead"`
	CurrentQueueLength           int     `json:"current_queue_length"`
	SlotBookedCount              int     `json:"slot_booked_count"`
	CompletedConsultationsToday  int     `json:"completed_consultations_today"`
	DoctorAvgConsultationMinutes float64 `json:"doctor_avg_consultation_minutes"`
	DoctorAvgWaitMinutes         float64 `json:"doctor_avg_wait_minutes"`
}

type MLPredictResponse struct {
	PredictedWaitMinutes float64 `json:"predicted_wait_minutes"`
}

// GetMLWaitTimePrediction sends a request to the FastAPI ML service to retrieve dynamic wait times.
func GetMLWaitTimePrediction(req *MLPredictRequest) (float64, error) {
	mlServiceURL := os.Getenv("ML_SERVICE_URL")
	if mlServiceURL == "" {
		mlServiceURL = "http://127.0.0.1:8000"
	}

	endpoint := fmt.Sprintf("%s/predict", mlServiceURL)

	jsonData, err := json.Marshal(req)
	if err != nil {
		return 0, fmt.Errorf("failed to marshal ML request: %v", err)
	}

	// 2 second timeout so we don't hold up backend API threads if ML is lagging/offline
	client := &http.Client{
		Timeout: 2 * time.Second,
	}

	resp, err := client.Post(endpoint, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return 0, fmt.Errorf("ML service unreachable: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var errData map[string]interface{}
		_ = json.NewDecoder(resp.Body).Decode(&errData)
		return 0, fmt.Errorf("ML service error (status %d): %v", resp.StatusCode, errData)
	}

	var result MLPredictResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return 0, fmt.Errorf("failed to decode ML response: %v", err)
	}

	return result.PredictedWaitMinutes, nil
}
