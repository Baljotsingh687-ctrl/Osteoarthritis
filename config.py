import os
from typing import Dict, List, Literal, Optional

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.environ.get("KOA_MODEL_DIR", os.path.join(BASE_DIR, "model"))
def _resolve_artifact(stem):
    for ext in (".pkl", ".joblib"):
        p=os.path.join(MODEL_DIR, stem+ext)
        if os.path.exists(p): return p
    return os.path.join(MODEL_DIR, stem+".pkl")
MODEL_PATH=_resolve_artifact("oa_sensor_model")
SCALER_PATH=_resolve_artifact("oa_sensor_scaler")
FEATURE_COLUMNS_PATH=os.path.join(MODEL_DIR,"oa_sensor_features.json")
DEFAULT_SAMPLING_RATE_HZ=100.0
MIN_DURATION_SECONDS=5.0
MIN_READINGS_COUNT=100
TRAIN_TRIAL_SECONDS=None
ACCEL_CONVERSION_FACTOR=9.80665
GYRO_CONVERSION_FACTOR=0.017453292519943295
SENSOR_MAPPING={"shin":"RF","thigh":"LB"}
ALL_TRAINING_SENSORS=["HE","LB","LF","RF"]
FILL_MODE: Literal["zero_after_scaling","train_mean","raw_zero"]="zero_after_scaling"
STRIDE_PEAK_MIN_DISTANCE_MS=450
STRIDE_PEAK_PROMINENCE=0.40
STRIDE_PEAK_REL_PROMINENCE=0.35
MIN_STRIDES_REQUIRED=2
ESTIMATE_CONTRALATERAL_STRIDES=False
LABEL_HIGH="Higher severity"
LABEL_LOW="Lower severity"
LABEL_BORDERLINE="Borderline"
RISK_THRESHOLD_HIGH=0.65
RISK_THRESHOLD_LOW=0.35
INTERPRETATION=("Estimated WOMAC-based symptom-severity tier for people with knee osteoarthritis. "
                "This is not a diagnosis. Prototype model trained on KOA patients only, "
                "with part of its inputs unavailable from the live sensors.")
IS_PROTOTYPE=True
