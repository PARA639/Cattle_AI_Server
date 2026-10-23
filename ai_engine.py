import time
import math
import threading
from pathlib import Path
from datetime import datetime

import firebase_admin
from firebase_admin import credentials, db

import numpy as np
from sklearn.ensemble import IsolationForest


# ==========================================================
# CONFIGURATION
# ==========================================================

BASE_DIR = Path(__file__).resolve().parent

DATABASE_URL = (
    "https://cow-project-3aa86-default-rtdb.firebaseio.com"
)

COW_ID = "cow_001"

MAX_READING_AGE_SECONDS = 60
FUTURE_TOLERANCE_SECONDS = 60

RECONNECT_DELAY_SECONDS = 5

TRAINING_SAMPLES = 100


# ==========================================================
# FIREBASE INITIALIZATION
# ==========================================================

print("🔥 Initializing Cattle AI Health Engine v1.1...")

if not firebase_admin._apps:
    cred = credentials.Certificate(
        str(BASE_DIR / "serviceAccountKey.json")
    )

    firebase_admin.initialize_app(
        cred,
        {"databaseURL": DATABASE_URL}
    )

print("✅ Firebase Admin SDK Initialized")

ref_live = db.reference(f"/cows/{COW_ID}/live")
ref_ai = db.reference(f"/cows/{COW_ID}/ai_output")
ref_ai_history = db.reference(
    f"/cows/{COW_ID}/ai_history"
)

print(f"🧠 Monitoring Cow ID: {COW_ID}")


# ==========================================================
# MODEL INITIALIZATION
# ==========================================================

model = IsolationForest(
    contamination="auto",
    random_state=42
)

is_model_trained = False
training_data = []

last_processed_timestamp = None

processing_lock = threading.Lock()


# ==========================================================
# VALIDATION
# ==========================================================

def valid_number(value):
    if isinstance(value, bool):
        return None

    try:
        number = float(value)
    except (TypeError, ValueError):
        return None

    if not math.isfinite(number):
        return None

    return number


def validate_sensor_data(data):
    """
    Accept only complete, fresh, real sensor readings.
    """

    if not isinstance(data, dict):
        return None

    timestamp = valid_number(data.get("timestamp"))

    if timestamp is None or timestamp <= 0:
        return None

    age = time.time() - timestamp

    if age > MAX_READING_AGE_SECONDS:
        print("⏭️ Stale sensor reading ignored.")
        return None

    if age < -FUTURE_TOLERANCE_SECONDS:
        print("⚠️ Future timestamp ignored.")
        return None

    if data.get("temp_valid") is not True:
        print("⚠️ Invalid temperature reading.")
        return None

    temperature = valid_number(data.get("temperature"))
    accel_mag = valid_number(data.get("accel_mag"))
    sound_peak = valid_number(data.get("sound_peak"))

    if any(
        value is None
        for value in [temperature, accel_mag, sound_peak]
    ):
        print("⚠️ Missing or invalid sensor measurements.")
        return None

    return {
        "timestamp": timestamp,
        "temperature": temperature,
        "accel_mag": accel_mag,
        "sound_peak": sound_peak
    }


# ==========================================================
# AI HEALTH ANALYSIS
# ==========================================================

def analyze_health_data(data):
    """
    Experimental monitoring:
    - Rule-based indicators
    - Isolation Forest anomaly detection

    Not a veterinary diagnosis.
    """

    global is_model_trained

    temperature = data["temperature"]
    accel_mag = data["accel_mag"]
    sound_peak = data["sound_peak"]

    risk_score = 0
    alerts = []

    # Surface temperature: experimental threshold
    if temperature > 38.0:
        risk_score += 40
        alerts.append("High Surface Temperature Detected")

    # Single acceleration magnitude cannot prove immobility.
    # Only flag unusually high acceleration magnitude.
    if accel_mag > 15.0:
        risk_score += 15
        alerts.append("High Acceleration Event")

    # Raw sound ADC peak-to-peak, not decibels.
    if sound_peak > 3000:
        risk_score += 10
        alerts.append("High Sound ADC Event")

    features = [
        temperature,
        accel_mag,
        sound_peak
    ]

    anomaly_score = 0.0
    is_anomaly = False

    if not is_model_trained:

        training_data.append(features)

        print(
            f"⏳ Collecting real training readings: "
            f"{len(training_data)}/{TRAINING_SAMPLES}"
        )

        if len(training_data) >= TRAINING_SAMPLES:

            print("🏋️ Training Isolation Forest...")

            model.fit(
                np.array(training_data)
            )

            is_model_trained = True

            print("✅ Experimental AI Model Trained")

    else:

        prediction = model.predict([features])

        anomaly_score = float(
            model.decision_function([features])[0]
        )

        if prediction[0] == -1:

            is_anomaly = True

            risk_score += 30

            alerts.append(
                "Unusual Behavior Pattern (AI)"
            )

    if risk_score >= 60:
        health_status = "HIGH_RISK"

    elif risk_score >= 30:
        health_status = "WARNING"

    else:
        health_status = "NORMAL"

    analysis_timestamp = time.time()

    return {
        "last_updated": datetime.now().strftime(
            "%Y-%m-%d %H:%M:%S"
        ),
        "analysis_timestamp": analysis_timestamp,
        "source_timestamp": data["timestamp"],
        "health_status": health_status,
        "risk_score": risk_score,
        "alerts": (
            ", ".join(alerts)
            if alerts
            else "None"
        ),
        "is_anomaly": is_anomaly,
        "anomaly_score": round(anomaly_score, 4),
        "model_trained": is_model_trained,
        "model_validated": False
    }


# ==========================================================
# PROCESS FIREBASE SENSOR READING
# ==========================================================

def process_reading(raw_data):

    global last_processed_timestamp

    data = validate_sensor_data(raw_data)

    if data is None:
        return

    timestamp = data["timestamp"]

    with processing_lock:

        if (
            last_processed_timestamp is not None
            and timestamp <= last_processed_timestamp
        ):
            print("⏭️ Duplicate sensor reading ignored.")
            return

        print(
            "\n📡 Processing actual ESP32 reading..."
        )

        print(
            f"Surface Temp: {data['temperature']} °C | "
            f"Accel: {data['accel_mag']} m/s² | "
            f"Sound ADC: {data['sound_peak']}"
        )

        ai_results = analyze_health_data(data)

        history_record = ai_results.copy()
        history_record["cow_id"] = COW_ID

        # Use source timestamp as a stable history key.
        # Prevents duplicate records after reconnection.
        history_key = str(int(timestamp * 1000))

        try:
            # Write latest AI output and history together.
            # Firebase multi-location update.
            db.reference(
                f"/cows/{COW_ID}"
            ).update({
                "ai_output": ai_results,
                f"ai_history/{history_key}": history_record
            })

            last_processed_timestamp = timestamp

            print(
                "✅ AI output and history saved | "
                f"Status: {ai_results['health_status']} | "
                f"Risk: {ai_results['risk_score']}"
            )

        except Exception as error:

            print(
                f"❌ Firebase write failed: {error}"
            )

            print(
                "⚠️ Reading will not be marked saved."
            )


# ==========================================================
# FIREBASE LISTENER CALLBACK
# ==========================================================

def listener(event):

    try:
        # On initial connection, "/" contains full live data.
        if event.path == "/":

            if isinstance(event.data, dict):
                process_reading(event.data)

            return

        # Firebase may send individual field updates.
        # Re-fetch the complete live record.
        #
        # NOTE: This adds an API call for partial updates,
        # but prevents analysis of incomplete readings.

        if event.path:

            latest_data = ref_live.get()

            if isinstance(latest_data, dict):
                process_reading(latest_data)

    except Exception as error:

        print(
            f"⚠️ Listener callback error: {error}"
        )


# ==========================================================
# CONNECTION MONITORING
# ==========================================================

def run_listener():

    while True:

        firebase_listener = None

        try:

            print(
                "\n📡 Connecting Firebase Live Listener..."
            )

            firebase_listener = ref_live.listen(
                listener
            )

            print(
                "✅ Firebase Listener Connected"
            )

            # Firebase Admin listener uses a background thread.
            # Check thread health so a failed listener is restarted.

            while True:

                time.sleep(5)

                thread = getattr(
                    firebase_listener,
                    "_thread",
                    None
                )

                if (
                    thread is not None
                    and not thread.is_alive()
                ):

                    raise ConnectionError(
                        "Firebase listener thread stopped."
                    )

        except KeyboardInterrupt:

            print(
                "\n🛑 AI Engine stopped by user."
            )

            break

        except Exception as error:

            print(
                f"⚠️ Firebase listener disconnected: {error}"
            )

            print(
                f"🔄 Reconnecting in "
                f"{RECONNECT_DELAY_SECONDS} seconds..."
            )

            time.sleep(
                RECONNECT_DELAY_SECONDS
            )

        finally:

            if firebase_listener is not None:

                try:
                    firebase_listener.close()

                except Exception:
                    pass


# ==========================================================
# MAIN
# ==========================================================

if __name__ == "__main__":

    print(
        "\n🚀 CattleAI Health Monitoring Started"
    )

    run_listener()
    