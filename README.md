# CattleAI — IoT-Based Cattle Health Monitoring and AI Anomaly Detection

**Academic Project:** Design and Development of Biomedical Devices for Comprehensive Healthcare

**Subtitle:** IoT-Enabled Wearable Monitoring and AI-Based Anomaly Detection for Cattle

**Institution:** MITS-DU, Gwalior

**Submitted By:** Paranjay Rathore (BTIR25O1038)

**Under the Guidance of:** Dr. Rajni Ranjan Singh, HOD, Centre for AI

**Project Mentor:** Dr. Neeraj Mishra

---

## Project Overview

CattleAI is an experimental IoT-based wearable cattle monitoring system that integrates real hardware sensors, cloud data storage, machine learning and web-based visualization.

The system uses an ESP32 to acquire sensor readings and transmit them to Firebase Realtime Database.

A Python AI engine performs experimental rule-based monitoring and Isolation Forest anomaly detection.

A Flask dashboard displays recent sensor readings, historical graphs, AI monitoring results and recorded alerts.

> **Disclaimer:** This system is an experimental research prototype, not a veterinary diagnostic device.

## System Architecture

```text
DS18B20 ───┐
           │
MPU6050 ───┼──> ESP32 ──Wi-Fi──> Firebase
           │                         │
MAX9814 ───┘                         │
                                     ▼
                              Python AI Engine
                                     │
                        Rule-Based + Isolation Forest
                                     │
                                     ▼
                              AI Output / History
                                     │
                                     ▼
                              Flask Web Dashboard
```

## Technologies Used

| Category | Technologies |
|---|---|
| Microcontroller | ESP32 |
| Sensors | DS18B20, MPU6050, MAX9814 |
| Communication | Wi-Fi |
| Cloud Database | Firebase Realtime Database |
| Backend | Python, Flask |
| Machine Learning | Scikit-learn, Isolation Forest |
| Frontend | HTML, CSS, JavaScript |
| Data Visualization | Chart.js |
| Development Tools | Arduino IDE, VS Code, Git, GitHub |

## Hardware Components

- ESP32 Development Board
- DS18B20 Temperature Sensor
- MPU6050 Accelerometer/Gyroscope
- MAX9814 Microphone Amplifier
- TP4056 Charging Module
- MT3608 Boost Converter
- 3.7V Li-Po Battery
- On/Off Switch

## Methodology

1. Acquire actual sensor data using ESP32.
2. Validate available sensor readings.
3. Transmit measurements to Firebase using Wi-Fi.
4. Store live and historical records.
5. Analyze fresh readings using Python.
6. Apply experimental rule-based monitoring.
7. Detect unusual patterns using Isolation Forest.
8. Store monitoring outputs in Firebase.
9. Display records through Flask and Chart.js.

## Dashboard Features

- Overview Dashboard
- Historical Analytics
- AI Health Monitoring
- Alerts & Notifications
- Cattle Profile
- Settings
- Responsive Light/Dark Theme
- Multilingual Interface
- CSV Data Export
- Interactive Graph Navigation

## Future Scope

- Multi-cattle monitoring
- GPS tracking
- GSM/LTE connectivity
- Battery monitoring
- Advanced behavior recognition
- Veterinary-supervised validation
- Improved time-series machine learning
- Mobile application
- Secure cloud deployment
- Improved wearable enclosure

## Current Limitations

- No clinical veterinary validation.
- Surface temperature is not core body temperature.
- Raw acoustic ADC readings are not calibrated decibels.
- Accelerometer magnitude cannot independently classify walking.
- AI model training and validation require improvement.
- Public deployment requires authentication and secure credentials.

## Academic Information

**Submitted By:** Paranjay Rathore (BTIR25O1038)

**Under the Guidance of:** Dr. Rajni Ranjan Singh, HOD, Centre for AI

**Project Mentor:** Dr. Neeraj Mishra

**Institution:** MITS-DU Gwalior

## Project Status

Functional research prototype. Public deployment and veterinary validation are pending.
