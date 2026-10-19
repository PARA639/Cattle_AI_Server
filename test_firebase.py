import firebase_admin
from firebase_admin import credentials, db
from pathlib import Path

# Firebase configuration
DATABASE_URL = "https://cow-project-3aa86-default-rtdb.firebaseio.com"

# Find service account key
BASE_DIR = Path(__file__).resolve().parent

KEY_PATH = BASE_DIR / "serviceAccountKey.json"

print("Checking Firebase connection...")

try:
    cred = credentials.Certificate(str(KEY_PATH))

    firebase_admin.initialize_app(cred, {
        "databaseURL": DATABASE_URL
    })

    print("Firebase initialized.")

    # Actual network connection happens here
    ref = db.reference("/cows/cow_001/live")

    data = ref.get()

    print("\n✅ Firebase Database Connected!")

    if data is None:
        print("No live sensor data found yet.")
    else:
        print("\n🐄 REAL SENSOR DATA:")
        print(data)

except Exception as e:
    print("\n❌ Firebase Connection Failed:")
    print(type(e).__name__)
    print(str(e))