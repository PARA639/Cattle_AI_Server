import firebase_admin
from firebase_admin import credentials, db
import time
import numpy as np
from sklearn.ensemble import IsolationForest

# ==========================================================
# 1. FIREBASE & MODEL INITIALIZATION
# ==========================================================
print("🔥 Initializing Cattle AI Health Engine v1.0...")

# Initialize Firebase
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

cred = credentials.Certificate(
    str(BASE_DIR / "serviceAccountKey.json")
)
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://cow-project-3aa86-default-rtdb.firebaseio.com' # CHANGE THIS
})
print("✅ Firebase Connection: Success")

# Initialize Isolation Forest Model
# contamination='auto' means the model will decide the anomaly threshold
model = IsolationForest(contamination='auto', random_state=42)
is_model_trained = False
training_data = []

# Track the timestamp of the last processed reading
last_processed_timestamp = None

# Reference to the specific cow's data
COW_ID = "cow_001"
ref_live = db.reference(f'/cows/{COW_ID}/live')
ref_ai = db.reference(f'/cows/{COW_ID}/ai_output')
ref_ai_history = db.reference(
    f'/cows/{COW_ID}/ai_history'
)


print(f"🧠 Monitoring Cow ID: {COW_ID}\n")

# ==========================================================
# 2. FEATURE ENGINEERING & ANALYSIS
# ==========================================================
def analyze_health_data(data):
    """
    Analyzes sensor data using a hybrid approach:
    1. Rule-based checks for immediate red flags.
    2. ML-based anomaly detection for subtle changes.
    """
    global is_model_trained, training_data, model

    # --- Feature Extraction ---
    temp = data.get('temperature', 0)
    accel_mag = data.get('accel_mag', 0)
    sound_peak = data.get('sound_peak', 0)
    
    # --- Rule-Based Analysis ---
    risk_score = 0
    alerts = []

    # Rule 1: High Temperature (Surface temp, so adjust threshold)
    if temp > 38.0: # NOTE: This is surface temp, not core. Calibrate this!
        risk_score += 40
        alerts.append("High Temperature Detected")
    
        # Rule 2: Activity / Immobility Analysis
    #
    # Temporarily disabled.
    #
    # A single acceleration magnitude cannot reliably
    # identify cattle immobility or resting behavior.
    #
    # Future implementation will analyze variation
    # across multiple real sensor readings collected
    # over a defined time window.
        
    # Rule 3: High Agitation / Movement
    if accel_mag > 15.0: # Value needs calibration
        risk_score += 15
        alerts.append("High Agitation Detected")

    # Rule 4: High Sound Peak
    if sound_peak > 3000: # Value needs calibration
        risk_score += 10
        alerts.append("Loud Sound Event")

    # --- ML-Powered Anomaly Detection ---
    features = [temp, accel_mag, sound_peak]
    anomaly_score = 0
    is_anomaly = False

    if not is_model_trained:
        # Collect data for initial training
        training_data.append(features)
        print(f"⏳ Collecting training data... ({len(training_data)}/100)")
        if len(training_data) >= 100:
            print("🏋️ Training Anomaly Detection Model...")
            model.fit(np.array(training_data))
            is_model_trained = True
            print("✅ Model Trained!")
    else:
        # Predict anomaly
        prediction = model.predict([features])
        anomaly_score = model.decision_function([features])[0]
        if prediction[0] == -1: # -1 indicates an anomaly
            is_anomaly = True
            risk_score += 30 # Add significant weight for anomalies
            alerts.append("Unusual Behavior Pattern (AI)")

    # --- Final Health Status ---
    if risk_score >= 60:
        health_status = "HIGH_RISK"
    elif risk_score >= 30:
        health_status = "WARNING"
    else:
        health_status = "NORMAL"

    # --- Prepare JSON for Firebase ---
    output = {
        'last_updated': time.strftime('%Y-%m-%d %H:%M:%S'),
        'health_status': health_status,
        'risk_score': risk_score,
        'alerts': ", ".join(alerts) if alerts else "None",
        'is_anomaly': is_anomaly,
        'anomaly_score': round(anomaly_score, 4),
        'model_trained': is_model_trained
    }
    
    return output

# ==========================================================
# 3. REAL-TIME DATABASE LISTENER
# DUPLICATE READING PROTECTION
# ==========================================================

def listener(event):

    global last_processed_timestamp

    data = event.data

    # Ignore empty or invalid Firebase events
    if not isinstance(data, dict):
        return

    # Firebase listener may also receive partial updates.
    # Only process complete live sensor snapshots.
    if "timestamp" not in data:
        return

    try:
        timestamp = float(data["timestamp"])
    except (TypeError, ValueError):
        print("⚠️ Invalid timestamp. Reading ignored.")
        return

    # Reject invalid timestamps
    if timestamp <= 0:
        print("⚠️ Missing or invalid timestamp.")
        return

    # Reject duplicate and older readings
    if (
        last_processed_timestamp is not None
        and timestamp <= last_processed_timestamp
    ):
        print("⏭️ Duplicate or older reading ignored.")
        return

    # Reject stale readings.
    # ESP32 should upload timestamps in Unix UTC seconds.
    current_time = time.time()
    data_age = current_time - timestamp

    if data_age < -60:
        print("⚠️ Future timestamp detected. Reading ignored.")
        return

    if data_age > 60:
        print("⏭️ Old Firebase snapshot ignored.")
        return

    # Check required measurement fields
    required_fields = [
        "temperature",
        "accel_mag",
        "sound_peak"
    ]

    for field in required_fields:
        if data.get(field) is None:
            print(f"⚠️ Missing {field}. Reading ignored.")
            return

    # Only accept valid temperature readings
    if data.get("temp_valid") is not True:
        print("⚠️ Invalid temperature reading.")
        return

    # Mark as processed
    last_processed_timestamp = timestamp

    print(
        f"\n📡 New sensor reading: "
        f"{time.strftime('%H:%M:%S')}"
    )

    print(
        f"Temperature: {data['temperature']} °C | "
        f"Acceleration: {data['accel_mag']} m/s² | "
        f"Sound: {data['sound_peak']}"
    )

       # ==========================================
    # RUN AI ANALYSIS
    # ==========================================

    ai_results = analyze_health_data(data)

    # Preserve the source sensor timestamp
    ai_results["source_timestamp"] = timestamp

    # Record when the analysis was performed
    ai_results["analysis_timestamp"] = time.time()

    # Mark current model as experimental
    ai_results["model_validated"] = False

    # ==========================================
    # SAVE LATEST AI RESULT
    # ==========================================

    ref_ai.set(ai_results)

    # ==========================================
    # SAVE HISTORICAL AI RESULT
    # ==========================================

    history_record = ai_results.copy()

    history_record["cow_id"] = COW_ID

    ref_ai_history.push(history_record)

    print(
        f"✅ AI Analysis Saved | "
        f"Status: {ai_results['health_status']} | "
        f"Risk: {ai_results['risk_score']} | "
        f"Source Timestamp: {timestamp}"
    )
    
    # ==========================================
# START FIREBASE LISTENER
# ==========================================

print("📡 Starting Firebase Live Listener...")

ref_live.listen(listener)

print("✅ Firebase Listener Started")

# ==========================================
# KEEP AI ENGINE RUNNING
# ==========================================

try:
    while True:
        time.sleep(1)

except KeyboardInterrupt:
    print("\n🛑 Shutting down AI Engine.")