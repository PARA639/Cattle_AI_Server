// ======================================================
// CATTLE AI — ALERTS & MONITORING PAGE
// Real Firebase sensor readings + recorded alert history
// ======================================================

let allAlerts = [];
let monitoringStatus = null;
let latestSensorData = null;
let latestAIData = null;

let activeAlertFilter = "all";
let activeTimeRange = "7d";

let alertsLoading = false;


// ======================================================
// HELPERS
// ======================================================

function alertsEl(id) {
    return document.getElementById(id);
}

function alertsSetText(id, value) {
    const element = alertsEl(id);
    if (element) element.textContent = value;
}

function alertsEscape(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function alertsValidNumber(value) {
    if (value === null || value === undefined || value === "") {
        return null;
    }

    const number = Number(value);
    return Number.isFinite(number) ? number : null;
}

function alertsFormatMeasurement(value, digits = 2) {
    const number = alertsValidNumber(value);

    return number === null
        ? "Not available"
        : number.toFixed(digits);
}

function alertsFormatDate(timestamp) {
    const seconds = alertsValidNumber(timestamp);

    if (seconds === null || seconds <= 0) {
        return "Unknown date";
    }

    const date = new Date(seconds * 1000);

    if (Number.isNaN(date.getTime())) {
        return "Unknown date";
    }

    return date.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    });
}


// ======================================================
// ALERT FILTERS
// ======================================================

function alertsInSelectedRange() {
    if (activeTimeRange === "all") {
        return [...allAlerts];
    }

    const now = Date.now() / 1000;

    const duration = activeTimeRange === "24h"
        ? 86400
        : 604800;

    return allAlerts.filter(alert => {
        const timestamp = alertsValidNumber(alert.timestamp);

        return timestamp !== null
            && timestamp >= now - duration
            && timestamp <= now + 60;
    });
}

function alertsFilteredList() {
    const events = alertsInSelectedRange();

    if (activeAlertFilter === "all") {
        return events;
    }

    return events.filter(
        event => event.category === activeAlertFilter
    );
}


// ======================================================
// SUMMARY
// ======================================================

function alertsUpdateSummary() {
    const events = alertsInSelectedRange();

    alertsSetText("alertsTotalCount", events.length);

    alertsSetText(
        "alertsWarningCount",
        events.filter(e => e.category === "warning").length
    );

    alertsSetText(
        "alertsCriticalCount",
        events.filter(e => e.category === "high_risk").length
    );

    alertsSetText(
        "alertsAnomalyCount",
        events.filter(e => e.category === "anomaly").length
    );
}


// ======================================================
// LATEST ACTUAL SENSOR + AI INFORMATION
// ======================================================

function alertsUpdateMonitoring() {
    const dot = alertsEl("alertsSystemDot");
    const badge = alertsEl("alertsCurrentBadge");
    const content = alertsEl("alertsCurrentContent");

    if (!content) return;

    const live = latestSensorData;
    const ai = latestAIData;

    const sourceTimestamp = live
        ? alertsValidNumber(live.timestamp)
        : null;

    const isFresh = monitoringStatus?.online === true;

    if (dot) {
        dot.style.background = live
            ? "#38bdf8"
            : "#94a3b8";
    }

    alertsSetText(
        "alertsSystemStatus",
        live
            ? "Latest Recorded Sensor Data"
            : "Waiting for Sensor Records"
    );

    alertsSetText(
        "alertsLastUpdated",
        sourceTimestamp
            ? "Last recorded: " + alertsFormatDate(sourceTimestamp) + " IST"
            : "No recorded sensor timestamp available"
    );

    if (badge) {
        badge.textContent = live
            ? (isFresh ? "LIVE DATA" : "LAST RECORDED")
            : "NO DATA";

        badge.style.background = isFresh
            ? "#dcfce7"
            : "#dbeafe";

        badge.style.color = isFresh
            ? "#166534"
            : "#1d4ed8";
    }

    if (!live) {
        content.innerHTML = `
            <div class="alerts-empty-state">
                No actual Firebase sensor readings available yet.
            </div>
        `;
        return;
    }

    const temperature = live.temp_valid === true
        ? alertsFormatMeasurement(live.temperature, 1) + " °C"
        : "Invalid / unavailable";

    const acceleration = alertsFormatMeasurement(
        live.accel_mag, 2
    ) + " m/s²";

    const sound = alertsFormatMeasurement(
        live.sound_peak, 0
    );

    const readingLabel = isFresh
        ? "Fresh ESP32 measurement"
        : "Previously recorded ESP32 measurement";

    let aiSection = `
        <p style="margin-top: 16px;">
            <strong>AI Analysis:</strong>
            No stored AI result available.
        </p>
    `;

    if (ai && typeof ai === "object") {
        const aiStatus = String(
            ai.health_status || "UNKNOWN"
        ).toUpperCase();

        const aiTimestamp = alertsValidNumber(
            ai.source_timestamp
        );

        const aiIsCurrent =
            isFresh &&
            monitoringStatus?.ai_current === true &&
            aiTimestamp !== null &&
            sourceTimestamp !== null &&
            aiTimestamp === sourceTimestamp;

        const risk = alertsValidNumber(ai.risk_score);

        const anomalyText = ai.model_trained !== true
            ? "Model training / not evaluated"
            : ai.is_anomaly === true
                ? "Unusual pattern flagged"
                : "No anomaly flagged";

        aiSection = `
            <div style="
                margin-top: 18px;
                padding-top: 14px;
                border-top: 1px solid rgba(148,163,184,0.2);
            ">
                <h3 style="margin-bottom: 12px;">
                    🧠 ${aiIsCurrent
                        ? "Current AI Monitoring"
                        : "Last Stored AI Analysis"}
                </h3>

                <p>
                    <strong>Status:</strong>
                    ${alertsEscape(aiStatus)}
                </p>

                <p>
                    <strong>Risk Score:</strong>
                    ${risk === null
                        ? "Not available"
                        : alertsEscape(risk) + " / 100"}
                </p>

                <p>
                    <strong>AI Anomaly:</strong>
                    ${alertsEscape(anomalyText)}
                </p>

                <p style="opacity: 0.75;">
                    ${aiIsCurrent
                        ? "AI result matches the current fresh reading."
                        : "Historical AI result — not a current emergency."}
                </p>
            </div>
        `;
    }

    content.innerHTML = `
        <div class="alerts-current-state">

            <h3 style="margin-bottom: 14px;">
                📊 Latest Available Measurements
            </h3>

            <div style="
                display: grid;
                grid-template-columns: repeat(
                    auto-fit,
                    minmax(170px, 1fr)
                );
                gap: 12px;
                margin-bottom: 16px;
            ">

                <div style="
                    padding: 14px;
                    border: 1px solid rgba(148,163,184,0.2);
                    border-radius: 12px;
                ">
                    <small>🌡️ Surface Temperature</small>
                    <h3>${alertsEscape(temperature)}</h3>
                </div>

                <div style="
                    padding: 14px;
                    border: 1px solid rgba(148,163,184,0.2);
                    border-radius: 12px;
                ">
                    <small>📈 Acceleration Magnitude</small>
                    <h3>${alertsEscape(acceleration)}</h3>
                </div>

                <div style="
                    padding: 14px;
                    border: 1px solid rgba(148,163,184,0.2);
                    border-radius: 12px;
                ">
                    <small>🎤 Sound ADC Peak-to-Peak</small>
                    <h3>${alertsEscape(sound)}</h3>
                </div>

            </div>

            <p style="opacity: 0.8;">
                ${alertsEscape(readingLabel)}
            </p>

            <p style="opacity: 0.7;">
                Recorded at:
                ${alertsEscape(alertsFormatDate(sourceTimestamp))} IST
            </p>

            ${aiSection}

            <p style="
                margin-top: 14px;
                opacity: 0.65;
                font-size: 12px;
            ">
                Experimental sensor monitoring.
                Measurements are not a veterinary diagnosis.
            </p>

        </div>
    `;
}


// ======================================================
// HISTORY TIMELINE
// ======================================================

function alertsRenderTimeline() {
    const container = alertsEl("alertsTimelineList");

    if (!container) return;

    const events = alertsFilteredList();

    if (events.length === 0) {
        container.innerHTML = `
            <div class="alerts-empty-state">
                <div class="alerts-empty-icon">✓</div>
                <h3>No Alerts Found</h3>
                <p>
                    No recorded alert events match the
                    selected category and time range.
                </p>
                <p>
                    Real historical monitoring events
                    will appear here when available.
                </p>
            </div>
        `;
        return;
    }

    container.innerHTML = events.map(event => {
        const category = event.category;

        let label = "Warning";

        if (category === "high_risk") {
            label = "High Risk";
        } else if (category === "anomaly") {
            label = "AI Anomaly";
        }

        const risk = alertsValidNumber(event.risk_score);

        return `
            <article class="alerts-event ${
                category === "high_risk"
                    ? "high-risk"
                    : alertsEscape(category)
            }">
                <div class="alerts-event-header">
                    <div>
                        <span class="alerts-event-category">
                            ${alertsEscape(label)}
                        </span>
                        <h3>
                            ${alertsEscape(event.title)}
                        </h3>
                    </div>

                    <span class="alerts-event-age">
                        Historical Record
                    </span>
                </div>

                <p class="alerts-event-message">
                    ${alertsEscape(event.message)}
                </p>

                <div class="alerts-event-meta">
                    <span>
                        ${alertsEscape(
                            alertsFormatDate(event.timestamp)
                        )} IST
                    </span>

                    ${risk === null ? "" : `
                        <span>Risk: ${alertsEscape(risk)}</span>
                    `}
                </div>

                <p class="alerts-event-note">
                    Experimental monitoring alert.
                    Not a confirmed disease diagnosis.
                </p>
            </article>
        `;
    }).join("");
}


// ======================================================
// RENDER
// ======================================================

function alertsRenderPage() {
    alertsUpdateSummary();
    alertsUpdateMonitoring();
    alertsRenderTimeline();
}


// ======================================================
// FETCH REAL FIREBASE DATA VIA FLASK
// ======================================================

async function alertsLoadData() {
    if (alertsLoading) return;

    alertsLoading = true;

    const refreshBtn = alertsEl("alertsRefreshBtn");

    if (refreshBtn) {
        refreshBtn.disabled = true;
    }

    try {
        const responses = await Promise.all([
            fetch("/api/alerts", { cache: "no-store" }),
            fetch("/api/live", { cache: "no-store" })
        ]);

        const alertsResponse = responses[0];
        const liveResponse = responses[1];

        if (!alertsResponse.ok) {
            throw new Error(
                "Alerts API HTTP " + alertsResponse.status
            );
        }

        if (!liveResponse.ok) {
            throw new Error(
                "Live API HTTP " + liveResponse.status
            );
        }

        const alertsData = await alertsResponse.json();
        const liveData = await liveResponse.json();

        if (!alertsData.success || !liveData.success) {
            throw new Error(
                "Firebase API returned unsuccessful response"
            );
        }

        allAlerts = Array.isArray(alertsData.events)
            ? alertsData.events
            : [];

        monitoringStatus = alertsData.monitoring || null;

        latestSensorData = liveData.live || null;
        latestAIData = liveData.ai || null;

        alertsRenderPage();

        console.log(
            "CattleAI Alerts Loaded:",
            allAlerts.length,
            "events"
        );

    } catch (error) {
        console.error("Alerts loading error:", error);

        alertsSetText(
            "alertsSystemStatus",
            "Monitoring Data Temporarily Unavailable"
        );

        const content = alertsEl("alertsCurrentContent");

        if (content) {
            content.innerHTML = `
                <div class="alerts-empty-state">
                    Unable to refresh Firebase data.
                    Please try again shortly.
                </div>
            `;
        }

    } finally {
        alertsLoading = false;

        if (refreshBtn) {
            refreshBtn.disabled = false;
        }
    }
}


// ======================================================
// INITIALIZE PAGE
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    document.querySelectorAll(
        ".alerts-filter-btn"
    ).forEach(button => {
        button.addEventListener("click", () => {
            activeAlertFilter = button.dataset.filter || "all";

            document.querySelectorAll(
                ".alerts-filter-btn"
            ).forEach(item => {
                item.classList.remove("active");
            });

            button.classList.add("active");
            alertsRenderTimeline();
        });
    });

    const rangeSelector = alertsEl("alertsTimeRange");

    if (rangeSelector) {
        activeTimeRange = rangeSelector.value || "7d";

        rangeSelector.addEventListener("change", () => {
            activeTimeRange = rangeSelector.value;
            alertsUpdateSummary();
            alertsRenderTimeline();
        });
    }

    const refreshBtn = alertsEl("alertsRefreshBtn");

    if (refreshBtn) {
        refreshBtn.addEventListener("click", alertsLoadData);
    }

    alertsLoadData();

    setInterval(alertsLoadData, 30000);
});
