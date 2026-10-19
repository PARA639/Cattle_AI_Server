import os
import json
from flask import Flask, render_template, jsonify, request
import firebase_admin
from firebase_admin import credentials, db
from pathlib import Path
import time
import math

app = Flask(__name__)

# ==========================================
# FIREBASE CONFIGURATION
# ==========================================

BASE_DIR = Path(__file__).resolve().parent

DATABASE_URL = (
    "https://cow-project-3aa86-default-rtdb.firebaseio.com"
)

KEY_PATH = BASE_DIR / "serviceAccountKey.json"

if not firebase_admin._apps:

    firebase_credentials_json = os.environ.get(
        "FIREBASE_SERVICE_ACCOUNT"
    )

    if firebase_credentials_json:

        service_account_info = json.loads(
            firebase_credentials_json
        )

        cred = credentials.Certificate(
            service_account_info
        )

    elif KEY_PATH.exists():

        # Local development only.
        cred = credentials.Certificate(
            str(KEY_PATH)
        )

    else:

        raise RuntimeError(
            "Firebase service account credentials not found."
        )

    firebase_admin.initialize_app(
        cred,
        {
            "databaseURL": DATABASE_URL
        }
    )
    
COW_ID = "cow_001"

print("Firebase initialized for dashboard")


# ==========================================
# HELPER FUNCTIONS
# ==========================================

def safe_number(value):
    """
    Convert numeric values safely.
    Reject invalid values and booleans.
    """

    if isinstance(value, bool):
        return None

    try:
        number = float(value)

        if math.isfinite(number):
            return number

    except (TypeError, ValueError):
        pass

    return None


def get_live_status(live_data):
    """
    Check whether real ESP32 readings
    are arriving within 30 seconds.
    """

    timestamp = safe_number(
        live_data.get("timestamp")
    )

    if timestamp is None:
        return False, None

    age = time.time() - timestamp

    online = (
        0 <= age < 30
    )

    return online, round(age, 1)


# ==========================================
# MULTI-PAGE DASHBOARD ROUTES
# ==========================================

@app.route("/")
def dashboard():
    return render_template("index.html")


@app.route("/analytics")
def analytics():
    return render_template("analytics.html")


@app.route("/ai-health")
def ai_health():
    return render_template("ai_health.html")


@app.route("/alerts")
def alerts():
    return render_template("alerts.html")


@app.route("/profile")
def profile():
    return render_template("profile.html")


@app.route("/settings")
def settings():
    return render_template("settings.html")


# ==========================================
# LIVE SENSOR DATA API
# ==========================================

@app.route("/api/live")
def get_live_data():

    try:

        live = db.reference(
            f"/cows/{COW_ID}/live"
        ).get()

        ai = db.reference(
            f"/cows/{COW_ID}/ai_output"
        ).get()

        if not live:

            return jsonify({
                "success": False,
                "message": "No real sensor data available"
            }), 404

        online, data_age = get_live_status(live)

        return jsonify({
            "success": True,
            "cow_id": COW_ID,
            "online": online,
            "data_age_seconds": data_age,
            "live": live,
            "ai": ai or {}
        })

    except Exception as error:

        print("Live API Error:", error)

        return jsonify({
            "success": False,
            "error": str(error)
        }), 500


# ==========================================
# HISTORICAL DATA API
# ==========================================

@app.route("/api/history")
def get_history():

    try:

        history = (
            db.reference(
                f"/cows/{COW_ID}/raw_history"
            )
            .order_by_key()
            .limit_to_last(100)
            .get()
        )

        records = []

        for key, value in (history or {}).items():

            if not isinstance(value, dict):
                continue

            records.append({
                "id": key,
                "datetime": value.get("datetime"),
                "timestamp": value.get("timestamp"),
                "temperature": value.get("temperature"),
                "temp_valid": value.get("temp_valid"),
                "accel_mag": value.get("accel_mag"),
                "mpu_valid": value.get(
                    "mpu_valid", True
                ),
                "sound_peak": value.get("sound_peak")
            })

        records.sort(
            key=lambda record:
                record.get("timestamp") or 0
        )

        return jsonify({
            "success": True,
            "history": records
        })

    except Exception as error:

        print("History API Error:", error)

        return jsonify({
            "success": False,
            "error": str(error)
        }), 500


# ==========================================
# ANALYTICS HISTORY API
# REAL FIREBASE SENSOR READINGS
# ==========================================

@app.route("/api/analytics-history")
def get_analytics_history():

    selected_range = request.args.get(
        "range", "1h"
    )

    range_seconds = {
        "1h": 3600,
        "24h": 86400,
        "7d": 604800
    }

    if selected_range not in range_seconds:

        return jsonify({
            "success": False,
            "error": "Invalid time range"
        }), 400

    try:

        current_time = time.time()

        start_time = (
            current_time
            - range_seconds[selected_range]
        )

        history_ref = db.reference(
            f"/cows/{COW_ID}/raw_history"
        )

        history = (
            history_ref
            .order_by_child("timestamp")
            .start_at(start_time)
            .end_at(current_time + 60)
            .get()
        )

        records = []

        for key, value in (history or {}).items():

            if not isinstance(value, dict):
                continue

            timestamp = safe_number(
                value.get("timestamp")
            )

            if timestamp is None:
                continue

            if not (
                start_time
                <= timestamp
                <= current_time + 60
            ):
                continue

            records.append({
                "id": key,
                "timestamp": timestamp,
                "datetime": value.get("datetime"),
                "temperature": value.get("temperature"),
                "temp_valid": value.get("temp_valid"),
                "accel_x": value.get("accel_x"),
                "accel_y": value.get("accel_y"),
                "accel_z": value.get("accel_z"),
                "accel_mag": value.get("accel_mag"),
                "mpu_valid": value.get("mpu_valid"),
                "sound_peak": value.get("sound_peak")
            })

        records.sort(
            key=lambda record:
                record["timestamp"]
        )

        return jsonify({
            "success": True,
            "cow_id": COW_ID,
            "range": selected_range,
            "count": len(records),
            "history": records
        })

    except Exception as error:

        print(
            "Analytics API Error:",
            error
        )

        return jsonify({
            "success": False,
            "error": "Unable to load Firebase history"
        }), 500


# ==========================================
# AI ANOMALY HISTORY API
# REAL FIREBASE ANALYSIS RECORDS ONLY
# ==========================================

@app.route("/api/ai-history")
def get_ai_history():

    try:

        history_ref = db.reference(
            f"/cows/{COW_ID}/ai_history"
        )

        history = (
            history_ref
            .order_by_key()
            .limit_to_last(500)
            .get()
        )

        records = []

        for key, value in (history or {}).items():

            if not isinstance(value, dict):
                continue

            # Only actual trained-model scores.
            if value.get("model_trained") is not True:
                continue

            score = safe_number(
                value.get("anomaly_score")
            )

            timestamp = safe_number(
                value.get("source_timestamp")
            )

            if score is None:
                continue

            if timestamp is None or timestamp <= 0:
                continue

            records.append({
                "id": key,
                "source_timestamp": timestamp,
                "analysis_timestamp": value.get(
                    "analysis_timestamp"
                ),
                "anomaly_score": score,
                "is_anomaly": value.get(
                    "is_anomaly", False
                ),
                "health_status": value.get(
                    "health_status", "UNKNOWN"
                ),
                "risk_score": value.get(
                    "risk_score"
                ),
                "model_validated": value.get(
                    "model_validated", False
                )
            })

        records.sort(
            key=lambda record:
                record["source_timestamp"]
        )

        return jsonify({
            "success": True,
            "cow_id": COW_ID,
            "count": len(records),
            "history": records
        })

    except Exception as error:

        print(
            "AI History API Error:",
            error
        )

        return jsonify({
            "success": False,
            "error": "Unable to load AI history"
        }), 500


# ==========================================
# ALERTS API
# REAL FIREBASE MONITORING EVENTS
# ==========================================

@app.route("/api/alerts")
def get_alerts():

    try:

        current_time = time.time()

        # ----------------------------------
        # READ LIVE ESP32 SENSOR DATA
        # ----------------------------------

        live = db.reference(
            f"/cows/{COW_ID}/live"
        ).get() or {}

        online, data_age = get_live_status(live)

        live_timestamp = safe_number(
            live.get("timestamp")
        )

        # ----------------------------------
        # READ CURRENT AI OUTPUT
        # ----------------------------------

        ai = db.reference(
            f"/cows/{COW_ID}/ai_output"
        ).get() or {}

        ai_source_timestamp = safe_number(
            ai.get("source_timestamp")
        )

        # AI output should correspond to
        # the latest fresh sensor reading.

        ai_current = (
            online
            and live_timestamp is not None
            and ai_source_timestamp is not None
            and abs(
                live_timestamp - ai_source_timestamp
            ) <= 15
        )

        # ----------------------------------
        # READ STORED AI HISTORY
        # ----------------------------------

        history = (
            db.reference(
                f"/cows/{COW_ID}/ai_history"
            )
            .order_by_key()
            .limit_to_last(2000)
            .get()
        ) or {}

        events = []

        for record_id, record in history.items():

            if not isinstance(record, dict):
                continue

            timestamp = safe_number(
                record.get("source_timestamp")
            )

            if timestamp is None or timestamp <= 0:
                continue

            # Reject timestamps unrealistically
            # far into the future.

            if timestamp > current_time + 60:
                continue

            health_status = str(
                record.get("health_status") or ""
            ).strip().upper()

            risk_score = safe_number(
                record.get("risk_score")
            )

            model_trained = (
                record.get("model_trained") is True
            )

            is_anomaly = (
                model_trained
                and record.get("is_anomaly") is True
            )

            # ----------------------------------
            # CLASSIFY ALERT CATEGORY
            # ----------------------------------

            if health_status in (
                "CRITICAL",
                "HIGH_RISK",
                "HIGH RISK",
                "DANGER"
            ):

                category = "high_risk"
                title = "High Risk Alert"

            elif is_anomaly:

                category = "anomaly"
                title = "AI Anomaly Detected"

            elif health_status in (
                "WARNING",
                "ALERT"
            ):

                category = "warning"
                title = "Health Warning"

            else:

                # Normal monitoring records
                # are not alerts.
                continue

            # ----------------------------------
            # ALERT MESSAGE
            # ----------------------------------

            raw_alerts = record.get("alerts")

            if isinstance(raw_alerts, list):

                message = ", ".join(
                    str(item)
                    for item in raw_alerts
                    if item is not None
                )

            elif isinstance(raw_alerts, str):

                message = raw_alerts.strip()

            else:

                message = ""

            if not message:

                if category == "anomaly":

                    message = (
                        "Isolation Forest detected "
                        "an unusual sensor pattern."
                    )

                elif category == "high_risk":

                    message = (
                        "The monitoring engine "
                        "recorded a high-risk status."
                    )

                else:

                    message = (
                        "The monitoring engine "
                        "recorded a warning status."
                    )

            # ----------------------------------
            # ANOMALY SCORE
            # ----------------------------------

            anomaly_score = None

            if model_trained:

                anomaly_score = safe_number(
                    record.get("anomaly_score")
                )

            # ----------------------------------
            # CREATE HISTORICAL EVENT
            # ----------------------------------

            events.append({
                "id": str(record_id),
                "timestamp": timestamp,
                "analysis_timestamp": record.get(
                    "analysis_timestamp"
                ),
                "category": category,
                "title": title,
                "message": message,
                "health_status": health_status,
                "risk_score": risk_score,
                "is_anomaly": is_anomaly,
                "anomaly_score": anomaly_score,
                "model_trained": model_trained,
                "model_validated": (
                    record.get("model_validated") is True
                )
            })

        # Show latest recorded events first.

        events.sort(
            key=lambda event: event["timestamp"],
            reverse=True
        )

        # ----------------------------------
        # CURRENT MONITORING STATUS
        # ----------------------------------

        monitoring = {
            "online": online,
            "ai_current": ai_current,
            "data_age_seconds": data_age,
            "live_timestamp": live_timestamp,
            "ai_source_timestamp": ai_source_timestamp,
            "health_status": (
                ai.get("health_status")
                if ai_current else None
            ),
            "risk_score": (
                ai.get("risk_score")
                if ai_current else None
            ),
            "is_anomaly": (
                ai.get("is_anomaly")
                if ai_current
                and ai.get("model_trained") is True
                else None
            ),
            "model_trained": (
                ai.get("model_trained") is True
                if ai_current else False
            )
        }

        return jsonify({
            "success": True,
            "cow_id": COW_ID,
            "server_timestamp": current_time,
            "monitoring": monitoring,
            "count": len(events),
            "events": events,
            "history_limit": 2000
        })

    except Exception as error:

        print(
            "Alerts API Error:",
            error
        )

        return jsonify({
            "success": False,
            "error": "Unable to load Firebase alerts",
            "count": 0,
            "events": []
        }), 500

# ==========================================
# CATTLE PROFILE API
# ==========================================

@app.route("/api/profile", methods=["GET", "POST"])
def cattle_profile_api():

    profile_ref = db.reference(
        f"/cows/{COW_ID}/profile"
    )

    # --------------------------------------
    # LOAD PROFILE
    # --------------------------------------

    if request.method == "GET":

        try:

            profile = profile_ref.get() or {}

            return jsonify({
                "success": True,
                "cow_id": COW_ID,
                "profile": profile
            })

        except Exception as error:

            print("Profile Load Error:", error)

            return jsonify({
                "success": False,
                "error": "Unable to load cattle profile"
            }), 500

    # --------------------------------------
    # SAVE PROFILE
    # --------------------------------------

    try:

        data = request.get_json(silent=True) or {}

        name = str(
            data.get("name", "")
        ).strip()

        breed = str(
            data.get("breed", "")
        ).strip()

        age = data.get("age")

        photo = data.get("photo")

        if not name:

            return jsonify({
                "success": False,
                "error": "Cattle name is required"
            }), 400

        if len(name) > 80 or len(breed) > 100:

            return jsonify({
                "success": False,
                "error": "Profile text is too long"
            }), 400

        if age not in (None, ""):

            try:

                age = float(age)

                if not 0 <= age <= 40:
                    raise ValueError()

            except (TypeError, ValueError):

                return jsonify({
                    "success": False,
                    "error": "Enter a valid age between 0 and 40"
                }), 400

        else:

            age = None

        if photo is not None:

            if not isinstance(photo, str):

                return jsonify({
                    "success": False,
                    "error": "Invalid photo format"
                }), 400

            if photo and not photo.startswith(
                "data:image/"
            ):

                return jsonify({
                    "success": False,
                    "error": "Invalid image data"
                }), 400

            # Max ~500KB encoded image.
            if len(photo) > 700000:

                return jsonify({
                    "success": False,
                    "error": "Photo is too large"
                }), 400

        existing = profile_ref.get() or {}

        updated_profile = {
            "cow_id": COW_ID,
            "name": name,
            "breed": breed,
            "age": age,
            "photo": (
                photo
                if photo is not None
                else existing.get("photo", "")
            ),
            "updated_at": time.time()
        }

        profile_ref.set(updated_profile)

        return jsonify({
            "success": True,
            "message": "Cattle profile saved successfully",
            "profile": updated_profile
        })

    except Exception as error:

        print("Profile Save Error:", error)

        return jsonify({
            "success": False,
            "error": "Unable to save cattle profile"
        }), 500
    
# ==========================================
# START SERVER
# ==========================================

if __name__ == "__main__":

    print("Cattle AI Dashboard Starting...")

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )
