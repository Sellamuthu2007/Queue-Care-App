import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from xgboost import XGBRegressor

def run_training_pipeline():
    print("=" * 60)
    print("QUEUE CARE - STARTING MACHINE LEARNING TRAINING PIPELINE")
    print("=" * 60)

    # 1. Paths configuration relative to script location
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(script_dir, "data", "queue_care_xgboost_training_dataset.csv")
    models_dir = os.path.join(script_dir, "models")
    results_dir = os.path.join(script_dir, "results")

    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(results_dir, exist_ok=True)

    # 2. Data Validation
    print("\n--- Phase 1: Data Validation ---")
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Dataset CSV not found at: {data_path}")

    # Load dataset
    df = pd.read_csv(data_path)
    print(f"Loaded dataset successfully from {data_path}")
    print(f"Initial shape: {df.shape[0]} rows, {df.shape[1]} columns")

    # Required columns
    required_cols = [
        "appointment_id", "doctor_id", "specialization", "day_of_week", 
        "appointment_hour", "appointment_minute", "queue_position", 
        "patients_ahead", "checked_in_ahead", "current_queue_length", 
        "slot_booked_count", "completed_consultations_today", 
        "doctor_avg_consultation_minutes", "doctor_avg_wait_minutes", 
        "actual_wait_minutes"
    ]
    
    missing_cols = [col for col in required_cols if col not in df.columns]
    if missing_cols:
        raise ValueError(f"CRITICAL: Missing required columns in dataset: {missing_cols}")
    print("✓ All required columns exist.")

    # Check duplicates
    duplicate_ids = df["appointment_id"].duplicated().sum()
    print(f"Duplicate appointment IDs: {duplicate_ids}")
    if duplicate_ids > 0:
        print(f"Warning: Found {duplicate_ids} duplicate appointment IDs. Removing duplicates...")
        df = df.drop_duplicates(subset=["appointment_id"])
        print(f"Shape after removing duplicate IDs: {df.shape[0]} rows")

    # Check missing values
    missing_vals = df[required_cols].isnull().sum().sum()
    print(f"Total missing values in required columns: {missing_vals}")
    if missing_vals > 0:
        print("Cleaning missing values (dropping rows)...")
        df = df.dropna(subset=required_cols)
        print(f"Shape after removing missing values: {df.shape[0]} rows")

    # Check for infinite values in numeric columns
    numeric_cols = [
        "day_of_week", "appointment_hour", "appointment_minute", "queue_position", 
        "patients_ahead", "checked_in_ahead", "current_queue_length", 
        "slot_booked_count", "completed_consultations_today", 
        "doctor_avg_consultation_minutes", "doctor_avg_wait_minutes",
        "actual_wait_minutes"
    ]
    inf_mask = df[numeric_cols].isin([np.inf, -np.inf]).any(axis=1)
    inf_count = inf_mask.sum()
    print(f"Rows with infinite values: {inf_count}")
    if inf_count > 0:
        df = df[~inf_mask]
        print(f"Shape after removing infinite values: {df.shape[0]} rows")

    # Check for negative actual wait times (invalid)
    negative_wait_mask = df["actual_wait_minutes"] < 0
    negative_wait_count = negative_wait_mask.sum()
    print(f"Rows with negative actual wait times: {negative_wait_count}")
    if negative_wait_count > 0:
        print(f"Removing {negative_wait_count} rows with invalid negative actual wait times...")
        df = df[~negative_wait_mask]
        print(f"Shape after removing invalid wait times: {df.shape[0]} rows")

    print("\n--- Target Distribution summary ---")
    print(df["actual_wait_minutes"].describe())

    print("\n✓ Data validation complete.")

    # 3. Features & Target Definition
    categorical_features = ["doctor_id", "specialization"]
    numerical_features = [
        "day_of_week", "appointment_hour", "appointment_minute", "queue_position", 
        "patients_ahead", "checked_in_ahead", "current_queue_length", 
        "slot_booked_count", "completed_consultations_today", 
        "doctor_avg_consultation_minutes", "doctor_avg_wait_minutes"
    ]
    target_feature = "actual_wait_minutes"

    # Separate features and target
    # We keep appointment_id and patients_ahead for baseline calculations in the split
    X_raw = df[categorical_features + numerical_features + ["appointment_id"]]
    y_raw = df[target_feature]

    # 4. Train / Test Split
    # NOTE: Since this is a synthetic dataset for testing/development, a random split is used here.
    # CRITICAL RULE FOR PRODUCTION: Real Queue Care historical data should be split chronologically
    # (e.g., using a specific cutoff date) to prevent time-based data leakage.
    print("\n--- Phase 2: Train/Test Split ---")
    X_train_raw, X_test_raw, y_train, y_test = train_test_split(
        X_raw, y_raw, test_size=0.20, random_state=42
    )

    # Separate appointment_id before fitting models to avoid passing them to training
    train_ids = X_train_raw["appointment_id"]
    test_ids = X_test_raw["appointment_id"]
    
    # Store test data slice with patients_ahead for baseline comparison
    test_patients_ahead = X_test_raw["patients_ahead"]

    X_train = X_train_raw[categorical_features + numerical_features]
    X_test = X_test_raw[categorical_features + numerical_features]

    print(f"Training set: {X_train.shape[0]} rows")
    print(f"Testing set: {X_test.shape[0]} rows")

    # 5. Preprocessing & Model Pipeline Configuration
    print("\n--- Phase 3: Building Preprocessing & XGBoost Pipeline ---")
    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_features),
            ("num", "passthrough", numerical_features)
        ]
    )

    pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("model", XGBRegressor(
            n_estimators=300,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            objective="reg:squarederror",
            random_state=42
        ))
    ])

    # 6. Training
    print("Training XGBRegressor model...")
    pipeline.fit(X_train, y_train)
    print("Training complete.")

    # 7. Evaluation & Baseline Comparison
    print("\n--- Phase 4: Model Evaluation ---")
    
    # XGBoost Prediction
    xgb_pred = pipeline.predict(X_test)
    
    # Baseline Heuristic: patients_ahead * 15
    baseline_pred = test_patients_ahead * 15

    # Metrics computation
    baseline_mae = mean_absolute_error(y_test, baseline_pred)
    baseline_rmse = np.sqrt(mean_squared_error(y_test, baseline_pred))
    baseline_r2 = r2_score(y_test, baseline_pred)

    xgb_mae = mean_absolute_error(y_test, xgb_pred)
    xgb_rmse = np.sqrt(mean_squared_error(y_test, xgb_pred))
    xgb_r2 = r2_score(y_test, xgb_pred)

    # MAE Improvement
    mae_improvement_pct = ((baseline_mae - xgb_mae) / baseline_mae) * 100

    print("=" * 60)
    print("QUEUE CARE WAIT TIME MODEL EVALUATION")
    print("=" * 60)
    print(f"Baseline - 15 Minute Heuristic")
    print(f"MAE  : {baseline_mae:.4f} minutes")
    print(f"RMSE : {baseline_rmse:.4f} minutes")
    print(f"R²   : {baseline_r2:.4f}")
    print("-" * 60)
    print(f"XGBoost Model")
    print(f"MAE  : {xgb_mae:.4f} minutes")
    print(f"RMSE : {xgb_rmse:.4f} minutes")
    print(f"R²   : {xgb_r2:.4f}")
    print("-" * 60)
    print(f"Improvement in MAE: {mae_improvement_pct:.2f}%")
    print("=" * 60)

    # 8. Save Metrics
    metrics_json_path = os.path.join(results_dir, "metrics.json")
    metrics_data = {
        "dataset": {
            "total_rows": int(df.shape[0]),
            "training_rows": int(X_train.shape[0]),
            "testing_rows": int(X_test.shape[0])
        },
        "target": target_feature,
        "baseline": {
            "name": "15-minute heuristic",
            "mae": float(baseline_mae),
            "rmse": float(baseline_rmse),
            "r2": float(baseline_r2)
        },
        "xgboost": {
            "mae": float(xgb_mae),
            "rmse": float(xgb_rmse),
            "r2": float(xgb_r2)
        },
        "mae_improvement_percent": float(mae_improvement_pct)
    }
    with open(metrics_json_path, "w") as f:
        json.dump(metrics_data, f, indent=2)
    print(f"Saved evaluation metrics to: {metrics_json_path}")

    # 9. Save Predictions CSV
    predictions_csv_path = os.path.join(results_dir, "predictions.csv")
    predictions_df = pd.DataFrame({
        "appointment_id": test_ids,
        "actual_wait_minutes": y_test,
        "baseline_prediction": baseline_pred,
        "xgboost_prediction": xgb_pred,
        "baseline_absolute_error": np.abs(y_test - baseline_pred),
        "xgboost_absolute_error": np.abs(y_test - xgb_pred)
    })
    predictions_df.to_csv(predictions_csv_path, index=False)
    print(f"Saved predictions CSV to: {predictions_csv_path}")

    # 10. Save Feature Importance
    print("\n--- Phase 5: Calculating Feature Importances ---")
    xgb_model = pipeline.named_steps["model"]
    importances = xgb_model.feature_importances_
    
    # Get feature names out
    feature_names = pipeline.named_steps["preprocessor"].get_feature_names_out()
    
    # Clean up prefixes
    clean_feature_names = []
    for name in feature_names:
        if name.startswith("cat__"):
            clean_feature_names.append(name[5:])
        elif name.startswith("num__"):
            clean_feature_names.append(name[5:])
        else:
            clean_feature_names.append(name)

    importance_df = pd.DataFrame({
        "feature": clean_feature_names,
        "importance": importances
    }).sort_values(by="importance", ascending=False)

    feature_importance_path = os.path.join(results_dir, "feature_importance.csv")
    importance_df.to_csv(feature_importance_path, index=False)
    print(f"Saved feature importance CSV to: {feature_importance_path}")
    
    print("\nTop 10 Important Features:")
    print(importance_df.head(10).to_string(index=False))

    # 11. Save Pipeline
    model_save_path = os.path.join(models_dir, "queue_wait_pipeline.joblib")
    joblib.dump(pipeline, model_save_path)
    print(f"\nSaved complete preprocessing + model pipeline to: {model_save_path}")

    # 12. Verification & Load Test
    print("\n--- Phase 6: Verification & Self-Test ---")
    loaded_pipeline = joblib.load(model_save_path)
    print("Successfully re-loaded saved pipeline.")

    # Pick 3 random rows from X_test and test prediction
    test_samples = X_test.sample(n=3, random_state=42)
    sample_preds = loaded_pipeline.predict(test_samples)
    
    for i, (idx, row) in enumerate(test_samples.iterrows()):
        print(f"\nVerification Sample {i+1}:")
        print(f"  Doctor ID      : {row['doctor_id']}")
        print(f"  Specialization : {row['specialization']}")
        print(f"  Patients Ahead : {row['patients_ahead']}")
        print(f"  Predicted Wait : {sample_preds[i]:.2f} minutes")
        print(f"  Actual Wait    : {y_test.loc[idx]:.2f} minutes")

    print("\n" + "=" * 60)
    print("✓ SUCCESS: MACHINE LEARNING PIPELINE COMPLETED SUCCESSFULLY")
    print("=" * 60)

if __name__ == "__main__":
    run_training_pipeline()
