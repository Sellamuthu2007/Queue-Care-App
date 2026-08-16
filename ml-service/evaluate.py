import os
import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

def run_evaluation():
    print("=" * 60)
    print("QUEUE CARE - STARTING STANDALONE EVALUATION SCRIPT")
    print("=" * 60)

    # 1. Resolve paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(script_dir, "models", "queue_wait_pipeline.joblib")
    data_path = os.path.join(script_dir, "data", "queue_care_xgboost_training_dataset.csv")

    # 2. Check if model and data exist
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Trained pipeline model not found at: {model_path}\nPlease run train.py first to train the model.")
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Evaluation dataset CSV not found at: {data_path}")

    # 3. Load model and data
    print(f"Loading pipeline from: {model_path}")
    pipeline = joblib.load(model_path)

    print(f"Loading evaluation dataset from: {data_path}")
    df = pd.read_csv(data_path)

    # Clean data similar to train.py to ensure correct comparison
    # Remove rows with negative actual wait times or duplicate appointment IDs
    df = df.drop_duplicates(subset=["appointment_id"])
    df = df.dropna(subset=["actual_wait_minutes", "patients_ahead"])
    df = df[df["actual_wait_minutes"] >= 0]

    print(f"Evaluation dataset shape: {df.shape[0]} rows")

    # 4. Prepare features and target
    categorical_features = ["doctor_id", "specialization"]
    numerical_features = [
        "day_of_week", "appointment_hour", "appointment_minute", "queue_position", 
        "patients_ahead", "checked_in_ahead", "current_queue_length", 
        "slot_booked_count", "completed_consultations_today", 
        "doctor_avg_consultation_minutes", "doctor_avg_wait_minutes"
    ]
    target_feature = "actual_wait_minutes"

    X = df[categorical_features + numerical_features]
    y_true = df[target_feature]

    # 5. Predict
    print("Running predictions through the pipeline...")
    y_pred = pipeline.predict(X)
    
    # Baseline Heuristic: patients_ahead * 15
    y_baseline = df["patients_ahead"] * 15

    # 6. Calculate metrics
    mae_baseline = mean_absolute_error(y_true, y_baseline)
    rmse_baseline = np.sqrt(mean_squared_error(y_true, y_baseline))
    r2_baseline = r2_score(y_true, y_baseline)

    mae_xgb = mean_absolute_error(y_true, y_pred)
    rmse_xgb = np.sqrt(mean_squared_error(y_true, y_pred))
    r2_xgb = r2_score(y_true, y_pred)

    mae_improvement = ((mae_baseline - mae_xgb) / mae_baseline) * 100

    # 7. Print results
    print("=" * 60)
    print("QUEUE CARE WAIT TIME MODEL - SYSTEM-WIDE EVALUATION")
    print("=" * 60)
    print(f"Baseline - 15 Minute Heuristic")
    print(f"MAE  : {mae_baseline:.4f} minutes")
    print(f"RMSE : {rmse_baseline:.4f} minutes")
    print(f"R²   : {r2_baseline:.4f}")
    print("-" * 60)
    print(f"XGBoost Model (Full Dataset Evaluation)")
    print(f"MAE  : {mae_xgb:.4f} minutes")
    print(f"RMSE : {rmse_xgb:.4f} minutes")
    print(f"R²   : {r2_xgb:.4f}")
    print("-" * 60)
    print(f"Improvement in MAE: {mae_improvement:.2f}%")
    print("=" * 60)

if __name__ == "__main__":
    run_evaluation()
