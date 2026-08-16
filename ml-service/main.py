import os
import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(
    title="Queue Care ML Prediction API",
    description="Microservice to dynamically predict patient waiting time using XGBoost.",
    version="1.0.0"
)

# Resolve paths relative to this file
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(SCRIPT_DIR, "models", "queue_wait_pipeline.joblib")

# Load model pipeline on startup
if not os.path.exists(MODEL_PATH):
    raise RuntimeError(f"Trained pipeline model not found at: {MODEL_PATH}. Please run train.py first.")

print(f"Loading wait time prediction pipeline from: {MODEL_PATH}")
pipeline = joblib.load(MODEL_PATH)
print("Pipeline loaded successfully and ready for inference.")

class PredictionRequest(BaseModel):
    doctor_id: str = Field(..., description="Unique identifier of the doctor", examples=["DOC002"])
    specialization: str = Field(..., description="Specialty of the doctor", examples=["Cardiology"])
    day_of_week: int = Field(..., ge=0, le=6, description="0=Monday, 6=Sunday", examples=[5])
    appointment_hour: int = Field(..., ge=0, le=23, description="Hour of appointment (24h)", examples=[10])
    appointment_minute: int = Field(..., ge=0, le=59, description="Minute of appointment", examples=[30])
    queue_position: int = Field(..., ge=1, description="Assigned token number / queue position", examples=[8])
    patients_ahead: int = Field(..., ge=0, description="Total booked patients ahead in line", examples=[7])
    checked_in_ahead: int = Field(..., ge=0, description="Total physical checked-in patients ahead", examples=[5])
    current_queue_length: int = Field(..., ge=0, description="Current length of doctor's queue", examples=[6])
    slot_booked_count: int = Field(..., ge=0, description="Total appointments booked in current slot", examples=[8])
    completed_consultations_today: int = Field(..., ge=0, description="Number of consultations done by doctor today", examples=[2])
    doctor_avg_consultation_minutes: float = Field(..., ge=0.0, description="Doctor's average session length in minutes", examples=[20.0])
    doctor_avg_wait_minutes: float = Field(..., ge=0.0, description="Doctor's historical average wait time", examples=[32.0])

class PredictionResponse(BaseModel):
    predicted_wait_minutes: float

@app.get("/health")
def health_check():
    return {"status": "healthy", "model_loaded": True}

@app.post("/predict", response_model=PredictionResponse)
def predict(req: PredictionRequest):
    try:
        # Convert Pydantic request model to dict, then values to list for DataFrame creation
        # We ensure features match the exact training column order
        features = [
            "doctor_id", "specialization", "day_of_week", "appointment_hour", 
            "appointment_minute", "queue_position", "patients_ahead", 
            "checked_in_ahead", "current_queue_length", "slot_booked_count", 
            "completed_consultations_today", "doctor_avg_consultation_minutes", 
            "doctor_avg_wait_minutes"
        ]
        
        request_dict = req.dict()
        input_data = {feat: [request_dict[feat]] for feat in features}
        df_input = pd.DataFrame(input_data)

        # Run inference
        prediction = pipeline.predict(df_input)
        predicted_val = float(prediction[0])

        # Post-processing: patient wait time cannot be negative
        predicted_val = max(0.0, predicted_val)

        return {"predicted_wait_minutes": round(predicted_val, 1)}
    except Exception as e:
        print(f"Error during inference: {e}")
        raise HTTPException(status_code=500, detail=f"Inference engine failure: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
