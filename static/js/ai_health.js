// ==========================================
// CATTLE AI - AI HEALTH DASHBOARD
// ACTUAL FIREBASE DATA ONLY
// ==========================================

const AI_API_URL = "/api/live";

const AI_REFRESH_INTERVAL = 10000;

let aiHealthRequestRunning = false;


// ==========================================
// DOM HELPERS
// ==========================================

function aiSetText(id, value) {

    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }

}


function aiNumber(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return null;
    }

    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : null;

}


function aiFormatNumber(value, decimals = 2) {

    const number = aiNumber(value);

    return number === null
        ? "--"
        : number.toFixed(decimals);

}


// ==========================================
// SYSTEM STATUS
// ==========================================

function aiUpdateSystemStatus(result) {

    const indicator = document.querySelector(
        ".ai-system-indicator"
    );

    const isOnline = result.online === true;

    if (indicator) {

        indicator.style.background = isOnline
            ? "#22c55e"
            : "#f59e0b";

    }

    if (isOnline) {

        aiSetText(
            "aiSystemStatus",
            "Sensor Connection Online"
        );

    } else {

        aiSetText(
            "aiSystemStatus",
            "Sensor Offline — Historical Data"
        );

    }

    const age = aiNumber(
        result.data_age_seconds
    );

    const ageText = age === null
        ? "Unknown"
        : formatAiAge(age);

    aiSetText(
        "aiLastUpdated",
        `Latest sensor reading: ${ageText} ago`
    );

}


function formatAiAge(seconds) {

    if (seconds < 60) {
        return `${Math.floor(seconds)} seconds`;
    }

    if (seconds < 3600) {
        return `${Math.floor(seconds / 60)} minutes`;
    }

    if (seconds < 86400) {
        return `${(seconds / 3600).toFixed(1)} hours`;
    }

    return `${(seconds / 86400).toFixed(1)} days`;

}


// ==========================================
// AI SUMMARY
// ==========================================

function aiUpdateSummary(ai, isOnline) {

    const hasAI = (
        ai &&
        typeof ai === "object" &&
        Object.keys(ai).length > 0
    );

    if (!hasAI) {

        aiSetText("aiHealthStatus", "NO AI DATA");
        aiSetText("aiRiskScore", "--");
        aiSetText("aiAnomalyStatus", "--");
        aiSetText("aiModelStatus", "UNKNOWN");

        document.getElementById(
            "aiRiskProgress"
        ).style.width = "0%";

        return;

    }

    const status = ai.health_status || "UNKNOWN";

    // Avoid presenting stored historical output
    // as a current animal health assessment.
    aiSetText(
        "aiHealthStatus",
        isOnline ? status : `${status} (OLD)`
    );

    const risk = aiNumber(ai.risk_score);

    aiSetText(
        "aiRiskScore",
        risk === null ? "--" : `${risk} / 100`
    );

    document.getElementById(
        "aiRiskProgress"
    ).style.width =
        risk === null
            ? "0%"
            : `${Math.min(100, Math.max(0, risk))}%`;

    if (ai.model_trained === true) {

        aiSetText(
            "aiModelStatus",
            "TRAINED*"
        );

    } else {

        aiSetText(
            "aiModelStatus",
            "TRAINING"
        );

    }

    if (ai.model_trained !== true) {

        aiSetText(
            "aiAnomalyStatus",
            "NOT READY"
        );

    } else if (ai.is_anomaly === true) {

        aiSetText(
            "aiAnomalyStatus",
            isOnline ? "DETECTED" : "DETECTED (OLD)"
        );

    } else if (ai.is_anomaly === false) {

        aiSetText(
            "aiAnomalyStatus",
            isOnline ? "NOT DETECTED" : "NOT DETECTED (OLD)"
        );

    } else {

        aiSetText(
            "aiAnomalyStatus",
            "UNKNOWN"
        );

    }

}


// ==========================================
// ISOLATION FOREST DETAILS
// ==========================================

function aiUpdateModelDetails(ai) {

    aiSetText(
        "aiAnomalyScore",
        aiFormatNumber(ai.anomaly_score, 4)
    );

    aiSetText(
        "aiModelTrained",
        ai.model_trained === true
            ? "Yes — Experimental"
            : ai.model_trained === false
                ? "No"
                : "Unknown"
    );

    // This timestamp is stored without explicit timezone.
    // Display as recorded, without assuming UTC or IST.
    aiSetText(
        "aiAnalysisTime",
        ai.last_updated || "--"
    );

}


// ==========================================
// RULE-BASED ALERTS
// ==========================================

function aiUpdateAlerts(ai, isOnline) {

    const container = document.getElementById(
        "aiCurrentAlerts"
    );

    if (!container) {
        return;
    }

    container.replaceChildren();

    const rawAlerts = ai.alerts;

    if (
        !rawAlerts ||
        rawAlerts === "None"
    ) {

        const message = document.createElement("div");

        message.className = "ai-empty-message";

        message.textContent =
            "No alerts recorded in the last AI analysis.";

        container.appendChild(message);

        return;

    }

    const alerts = String(rawAlerts)
        .split(",")
        .map(alert => alert.trim())
        .filter(Boolean);

    alerts.forEach(alert => {

        const item = document.createElement("div");

        item.className = "ai-alert-item";

        item.textContent = isOnline
            ? `⚠️ ${alert}`
            : `🕘 Historical alert: ${alert}`;

        container.appendChild(item);

    });

}


// ==========================================
// SENSOR READINGS
// ==========================================

function aiUpdateSensors(live, isOnline) {

    const temperature = (
        live.temp_valid === true
    )
        ? aiNumber(live.temperature)
        : null;

    const motion = aiNumber(
        live.accel_mag
    );

    const sound = aiNumber(
        live.sound_peak
    );

    aiSetText(
        "aiSensorTemperature",
        temperature === null
            ? "-- °C"
            : `${temperature.toFixed(2)} °C`
    );

    aiSetText(
        "aiSensorMotion",
        motion === null
            ? "-- m/s²"
            : `${motion.toFixed(2)} m/s²`
    );

    aiSetText(
        "aiSensorSound",
        sound === null
            ? "--"
            : sound.toFixed(0)
    );

    const freshness = isOnline
        ? "Latest available reading"
        : "Historical reading — Sensor offline";

    aiSetText(
        "aiTemperatureStatus",
        temperature === null
            ? "Invalid or unavailable measurement"
            : freshness
    );

    aiSetText(
        "aiMotionStatus",
        motion === null
            ? "Measurement unavailable"
            : "Validity flag unavailable — " + freshness
    );

    aiSetText(
        "aiSoundStatus",
        sound === null
            ? "Measurement unavailable"
            : freshness
    );

}


// ==========================================
// HEALTH SUMMARY
// ==========================================

function aiUpdateHealthReport(ai, result) {

    const report = document.getElementById(
        "aiHealthReport"
    );

    if (!report) {
        return;
    }

    const isOnline = result.online === true;

    const status = ai.health_status || "Unknown";

    const risk = aiNumber(ai.risk_score);

    const anomaly = ai.is_anomaly === true
        ? "An unusual sensor pattern was flagged."
        : ai.is_anomaly === false
            ? "No anomaly was flagged in the stored result."
            : "Anomaly status is unavailable.";

    const freshness = isOnline
        ? "The sensor connection is currently online."
        : "The sensor is offline. Displayed measurements and stored AI results may be outdated.";

    const text = [
        freshness,
        `Stored monitoring status: ${status}.`,
        `Stored risk score: ${risk === null ? "Unavailable" : risk}.`,
        anomaly,
        "These are experimental monitoring indicators, not a veterinary diagnosis."
    ].join(" ");

    report.replaceChildren();

    const paragraph = document.createElement("p");

    paragraph.textContent = text;

    report.appendChild(paragraph);

}


// ==========================================
// AI HISTORY EMPTY STATE
// ==========================================

// ==========================================
// AI ANOMALY HISTORY GRAPH
// REAL FIREBASE AI RESULTS ONLY
// ==========================================

let aiHistoryChart = null;


function initializeAIHistoryChart() {

    const canvas = document.getElementById(
        "aiAnomalyHistoryChart"
    );

    if (!canvas || typeof Chart === "undefined") {
        return;
    }

    aiHistoryChart = new Chart(canvas, {

        type: "line",

        data: {
            labels: [],

            datasets: [{
                label: "Isolation Forest Decision Score",
                data: [],
                borderColor: "#8b5cf6",
                backgroundColor: "rgba(139,92,246,0.10)",
                borderWidth: 2,
                tension: 0.25,
                pointRadius: 2,
                pointHoverRadius: 6,
                fill: true,
                spanGaps: false
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,

            interaction: {
                mode: "index",
                intersect: false
            },

            plugins: {
                legend: {
                    display: false
                },

                tooltip: {
                    enabled: true
                }
            },

            scales: {
                x: {
                    ticks: {
                        maxTicksLimit: 7,
                        color: "#94a3b8",
                        maxRotation: 0
                    },
                    grid: {
                        display: false
                    }
                },

                y: {
                    ticks: {
                        color: "#94a3b8"
                    },
                    grid: {
                        color: "rgba(148,163,184,0.12)"
                    }
                }
            }
        }
    });

}


function formatAIHistoryTime(timestamp) {

    const value = Number(timestamp);

    if (!Number.isFinite(value) || value <= 0) {
        return "--";
    }

    return new Date(value * 1000).toLocaleString(
        "en-IN",
        {
            timeZone: "Asia/Kolkata",
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


async function loadAIHistory() {

    const message = document.getElementById(
        "aiHistoryMessage"
    );

    if (message) {
        message.textContent =
            "Loading actual AI analysis history...";
    }

    try {

        const response = await fetch(
            "/api/ai-history",
            {
                cache: "no-store"
            }
        );

        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}`
            );
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(
                result.error || "API error"
            );
        }

        const records = Array.isArray(result.history)
            ? result.history
            : [];

        if (aiHistoryChart) {

            aiHistoryChart.data.labels = records.map(
                item => formatAIHistoryTime(
                    item.source_timestamp
                )
            );

            aiHistoryChart.data.datasets[0].data =
                records.map(
                    item => Number(item.anomaly_score)
                );

            aiHistoryChart.update("none");

        }

        if (message) {

            message.textContent = records.length
                ? `${records.length} actual AI analysis records loaded. Experimental anomaly scores; not a disease diagnosis.`
                : "No historical AI scores available yet. New results will appear when ESP32 uploads fresh readings and AI Engine processes them.";

        }

    } catch (error) {

        console.error(
            "AI History loading error:",
            error
        );

        if (message) {
            message.textContent =
                "Unable to load AI history. Check Flask server connection.";
        }

    }

}


// ==========================================
// FETCH FIREBASE DATA
// ==========================================

async function loadAIHealth() {

    if (aiHealthRequestRunning) {
        return;
    }

    aiHealthRequestRunning = true;

    try {

        const response = await fetch(
            AI_API_URL,
            {
                cache: "no-store"
            }
        );

        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}`
            );
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(
                result.error || "API error"
            );
        }

        const ai = result.ai || {};
        const live = result.live || {};

        aiUpdateSystemStatus(result);

        aiUpdateSummary(
            ai,
            result.online === true
        );

        aiUpdateModelDetails(ai);

        aiUpdateAlerts(
            ai,
            result.online === true
        );

        aiUpdateSensors(
            live,
            result.online === true
        );

        aiUpdateHealthReport(
            ai,
            result
        );



    } catch (error) {

        console.error(
            "AI Health loading error:",
            error
        );

        aiSetText(
            "aiSystemStatus",
            "Unable to connect to Firebase API"
        );

        aiSetText(
            "aiLastUpdated",
            "Check Flask server connection"
        );

    } finally {

        aiHealthRequestRunning = false;

    }

}

// ==========================================
// PAGE INITIALIZATION
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        // Initialize AI history graph
        initializeAIHistoryChart();

        // Load latest Firebase AI data
        loadAIHealth();

        // Load historical AI analysis records
        loadAIHistory();

        // Refresh button
        const refreshButton = document.getElementById(
            "aiRefreshBtn"
        );

        if (refreshButton) {

            refreshButton.addEventListener(
                "click",
                () => {

                    loadAIHealth();

                    loadAIHistory();

                }
            );

        }

        // Auto-refresh latest AI readings every 10 seconds
        setInterval(
            loadAIHealth,
            AI_REFRESH_INTERVAL
        );

        // Auto-refresh AI history every 30 seconds
        setInterval(
            loadAIHistory,
            30000
        );

    }
);
