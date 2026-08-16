import os
import sys
import joblib
import pandas as pd

def get_predictions_pipeline():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(script_dir, "models", "queue_wait_pipeline.joblib")
    
    if not os.path.exists(model_path):
        raise FileNotFoundError(
            f"Trained pipeline model not found at: {model_path}\n"
            f"Please run 'python train.py' to train and save the model before predicting."
        )
    
    pipeline = joblib.load(model_path)
    return pipeline

def predict_wait_time(features_dict):
    """
    Accepts a dictionary containing the required features, runs preprocessing, and
    returns the predicted waiting time in minutes.
    """
    required_features = [
        "doctor_id", "specialization", "day_of_week", "appointment_hour", 
        "appointment_minute", "queue_position", "patients_ahead", 
        "checked_in_ahead", "current_queue_length", "slot_booked_count", 
        "completed_consultations_today", "doctor_avg_consultation_minutes", 
        "doctor_avg_wait_minutes"
    ]
    
    # 1. Validation: check if all features exist
    missing_features = [feat for feat in required_features if feat not in features_dict]
    if missing_features:
        raise ValueError(f"Missing required prediction features: {missing_features}")
    
    # 2. Convert to DataFrame (single row)
    # Re-order to match exact training column layout
    input_data = {feat: [features_dict[feat]] for feat in required_features}
    df_input = pd.DataFrame(input_data)
    
    # 3. Load model and predict
    pipeline = get_predictions_pipeline()
    prediction = pipeline.predict(df_input)
    
    # Return as floating number
    raw_val = float(prediction[0])
    
    # We round only the final output for representation, keeping raw value available if needed
    return {
        "predicted_wait_minutes": round(raw_val, 1)
    }

if __name__ == "__main__":
    # Test script execution
    print("Testing predict.py standalone prediction demonstration:")
    
    test_input = {
        "doctor_id": "DOC002",
        "specialization": "Cardiology",
        "day_of_week": 5,
        "appointment_hour": 10,
        "appointment_minute": 30,
        "queue_position": 8,
        "patients_ahead": 7,
        "checked_in_ahead": 5,
        "current_queue_length": 6,
        "slot_booked_count": 8,
        "completed_consultations_today": 2,
        "doctor_avg_consultation_minutes": 20,
        "doctor_avg_wait_minutes": 32
    }
    
    try:
        result = predict_wait_time(test_input)
        print("\nInput parameters:")
        for k, v in test_input.items():
            print(f"  {k:32s}: {v}")
        print("\nPrediction Result:")
        print(f"  predicted_wait_minutes: {result['predicted_wait_minutes']}")
    except Exception as e:
        print(f"Error during prediction: {e}", file=sys.stderr)
