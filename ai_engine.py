import time
import math
import threading
from pathlib import Path
from datetime import datetime

import firebase_admin
from firebase_admin import credentials, db

import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler


# ==========================================================
# CONFIGURATION
# ==========================================================

BASE_DIR = Path(__file__).resolve().parent

DATABASE_URL = (
    "https://cow-project-3aa86-default-rtdb.firebaseio.com"
)

COW_ID = "cow_001"

TRAINING_SAMPLES = 100
MAX_TRAINING_RECORDS = 3000

MAX_READING_AGE_SECONDS = 60
FUTURE_TOLERANCE_SECONDS = 60

POLL_INTERVAL_SECONDS = 3
RECONNECT_DELAY_SECONDS = 5


# ==========================================================
# FIREBASE INITIALIZATION
# ==========================================================

print("\n🔥 Initializing CattleAI Health Engine v2.0...")

if not firebase_admin._apps:
    cred = credentials.Certificate(
        str(BASE_DIR / "serviceAccountKey.json")
    )

    firebase_admin.initialize_app(
        cred,
        {
            "databaseURL": DATABASE_URL
        }
    )

print("✅ Firebase Admin SDK initialized")

ROOT_PATH = f"/cows/{COW_ID}"

ref_cow = db.reference(ROOT_PATH)
ref_live = db.reference(f"{ROOT_PATH}/live")
ref_raw_history = db.reference(f"{ROOT_PATH}/raw_history")

print(f"🐄 Monitoring Cow ID: {COW_ID}")


# ==========================================================
# MODEL INITIALIZATION
# ==========================================================

model = IsolationForest(
    n_estimators=100,
    contamination="auto",
    random_state=42
)

scaler = StandardScaler()

is_model_trained = False
training_data = []

last_processed_timestamp = None

processing_lock = threading.Lock()


# ==========================================================
# VALIDATION
# ==========================================================

def valid_number(value):

    if value is None or isinstance(value, bool):
        return None

    try:
        number = float(value)

    except (TypeError, ValueError):
        return None

    if not math.isfinite(number):
        return None

    return number


def extract_features(data):

    if not isinstance(data, dict):
        return None

    if data.get("temp_valid") is not True:
        return None

    if data.get("mpu_valid") is False:
        return None

    temperature = valid_number(
        data.get("temperature")
    )

    acceleration = valid_number(
        data.get("accel_mag")
    )

    sound = valid_number(
        data.get("sound_peak")
    )

    if any(
        value is None
        for value in [
            temperature,
            acceleration,
            sound
        ]
    ):
        return None

    return [
        temperature,
        acceleration,
        sound
    ]


def validate_live_reading(data):

    features = extract_features(data)

    if features is None:
        return None

    timestamp = valid_number(
        data.get("timestamp")
    )

    if timestamp is None or timestamp <= 0:
        return None

    age = time.time() - timestamp

    if age > MAX_READING_AGE_SECONDS:
        return None

    if age < -FUTURE_TOLERANCE_SECONDS:
        return None

    return {
        "timestamp": timestamp,
        "temperature": features[0],
        "accel_mag": features[1],
        "sound_peak": features[2]
    }


# ==========================================================
# TRAIN MODEL FROM REAL FIREBASE HISTORY
# ==========================================================

def train_from_firebase_history():

    global is_model_trained
    global training_data

    print(
        "\n📚 Loading real historical sensor readings..."
    )

    try:

        records = (
            ref_raw_history
            .order_by_child("timestamp")
            .limit_to_last(MAX_TRAINING_RECORDS)
            .get()
        )

        if not isinstance(records, dict):
            records = {}

        valid_records = []

        for record in records.values():

            features = extract_features(record)

            if features is not None:
                valid_records.append(features)

        print(
            f"✅ Found {len(valid_records)} valid "
            f"historical readings"
        )

        if len(valid_records) < TRAINING_SAMPLES:

            training_data = valid_records

            print(
                "⚠️ Not enough historical readings "
                "for model training."
            )

            return

        X = np.array(
            valid_records,
            dtype=float
        )

        X_scaled = scaler.fit_transform(X)

        model.fit(X_scaled)

        is_model_trained = True

        training_data = valid_records

        print(
            "🧠 Isolation Forest trained successfully!"
        )

        print(
            f"📊 Training samples: {len(valid_records)}"
        )

        print(
            "⚠️ Experimental anomaly model; "
            "not clinically validated."
        )

    except Exception as error:

        print(
            f"❌ Historical training error: {error}"
        )


# ==========================================================
# ANALYZE SENSOR DATA
# ==========================================================

def analyze_health_data(data):

    global is_model_trained

    temperature = data["temperature"]
    acceleration = data["accel_mag"]
    sound = data["sound_peak"]

    risk_score = 0
    alerts = []

    # ------------------------------------------
    # RULE-BASED INDICATORS
    # ------------------------------------------

    if temperature > 38.0:

        risk_score += 40

        alerts.append(
            "High Surface Temperature Detected"
        )

    if acceleration > 15.0:

        risk_score += 15

        alerts.append(
            "High Acceleration Event"
        )

    if sound > 3000:

        risk_score += 10

        alerts.append(
            "High Sound ADC Event"
        )

    # ------------------------------------------
    # EXPERIMENTAL ML ANOMALY DETECTION
    # ------------------------------------------

    features = np.array(
        [[
            temperature,
            acceleration,
            sound
        ]],
        dtype=float
    )

    anomaly_score = 0.0
    is_anomaly = False

    if is_model_trained:

        scaled_features = scaler.transform(
            features
        )

        prediction = model.predict(
            scaled_features
        )

        anomaly_score = float(
            model.decision_function(
                scaled_features
            )[0]
        )

        if prediction[0] == -1:

            is_anomaly = True

            risk_score += 30

            alerts.append(
                "Unusual Behavior Pattern (AI)"
            )

    # ------------------------------------------
    # MONITORING STATUS
    # ------------------------------------------

    if risk_score >= 60:
        health_status = "HIGH_RISK"

    elif risk_score >= 30:
        health_status = "WARNING"

    else:
        health_status = "NORMAL"

    return {
        "last_updated": datetime.now().strftime(
            "%Y-%m-%d %H:%M:%S"
        ),
        "analysis_timestamp": time.time(),
        "source_timestamp": data["timestamp"],
        "health_status": health_status,
        "risk_score": risk_score,
        "alerts": (
            ", ".join(alerts)
            if alerts
            else "None"
        ),
        "is_anomaly": is_anomaly,
        "anomaly_score": round(
            anomaly_score,
            4
        ),
        "model_trained": is_model_trained,
        "model_validated": False
    }


# ==========================================================
# PROCESS REAL LIVE READING
# ==========================================================

def process_reading(raw_data):

    global last_processed_timestamp
    global is_model_trained

    data = validate_live_reading(
        raw_data
    )

    if data is None:
        return

    timestamp = data["timestamp"]

    with processing_lock:

        if (
            last_processed_timestamp is not None
            and timestamp <= last_processed_timestamp
        ):
            return

        print(
            "\n📡 New real ESP32 reading detected"
        )

        print(
            f"Temperature: {data['temperature']} °C | "
            f"Acceleration: {data['accel_mag']} m/s² | "
            f"Sound ADC: {data['sound_peak']}"
        )

        # Collect genuine live readings if historical
        # training data was insufficient.

        if not is_model_trained:

            training_data.append([
                data["temperature"],
                data["accel_mag"],
                data["sound_peak"]
            ])

            if len(training_data) >= TRAINING_SAMPLES:

                X = np.array(
                    training_data,
                    dtype=float
                )

                scaler.fit(X)

                model.fit(
                    scaler.transform(X)
                )

                is_model_trained = True

                print(
                    "✅ Model trained using real readings"
                )

        ai_results = analyze_health_data(data)

        history_record = ai_results.copy()
        history_record["cow_id"] = COW_ID

        history_key = str(
            int(timestamp * 1000)
        )

        try:

            ref_cow.update({
                "ai_output": ai_results,
                f"ai_history/{history_key}": history_record
            })

            last_processed_timestamp = timestamp

            print(
                "✅ AI monitoring result saved | "
                f"Status: {ai_results['health_status']} | "
                f"Risk: {ai_results['risk_score']} | "
                f"Anomaly: {ai_results['is_anomaly']}"
            )

        except Exception as error:

            print(
                f"❌ Firebase write error: {error}"
            )


# ==========================================================
# MAIN MONITORING LOOP
# ==========================================================

def run_ai_engine():

    print(
        "\n🚀 CattleAI AI Engine v2.0 Running"
    )

    # Train immediately from genuine Firebase history.

    train_from_firebase_history()

    print(
        "\n📡 Monitoring Firebase live sensor updates..."
    )

    while True:

        try:

            live_data = ref_live.get()

            if isinstance(live_data, dict):

                process_reading(
                    live_data
                )

            time.sleep(
                POLL_INTERVAL_SECONDS
            )

        except KeyboardInterrupt:

            print(
                "\n🛑 AI Engine stopped."
            )

            break

        except Exception as error:

            print(
                f"⚠️ Firebase connection error: {error}"
            )

            print(
                "🔄 Retrying connection in "
                f"{RECONNECT_DELAY_SECONDS} seconds..."
            )

            time.sleep(
                RECONNECT_DELAY_SECONDS
            )


# ==========================================================
# START ENGINE
# ==========================================================

if __name__ == "__main__":

    run_ai_engine()
    