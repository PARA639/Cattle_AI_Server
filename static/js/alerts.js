// ==========================================
// CATTLE AI — ALERTS PAGE
// REAL FIREBASE ALERT MONITORING
// ==========================================

let allAlerts = [];
let monitoringStatus = null;

let activeAlertFilter = "all";
let activeTimeRange = "7d";


// ==========================================
// HELPERS
// ==========================================

function alertsEl(id) {
    return document.getElementById(id);
}

function alertsSetText(id, value) {
    const el = alertsEl(id);

    if (el) {
        el.textContent = value;
    }
}

function alertsEscape(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// ==========================================
// DATE FORMAT — INDIAN TIME
// ==========================================

function alertsFormatDate(timestamp) {

    const date = new Date(
        Number(timestamp) * 1000
    );

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


// ==========================================
// TIME RANGE FILTER
// ==========================================

function alertsInSelectedRange() {

    if (activeTimeRange === "all") {
        return [...allAlerts];
    }

    const now = Date.now() / 1000;

    const duration = (
        activeTimeRange === "24h"
            ? 86400
            : 604800
    );

    return allAlerts.filter(alert => {

        const timestamp = Number(
            alert.timestamp
        );

        return (
            timestamp >= now - duration
            && timestamp <= now + 60
        );
    });
}


// ==========================================
// CATEGORY FILTER
// ==========================================

function alertsFilteredList() {

    const events = alertsInSelectedRange();

    if (activeAlertFilter === "all") {
        return events;
    }

    return events.filter(
        event =>
            event.category === activeAlertFilter
    );
}


// ==========================================
// SUMMARY COUNTS
// ==========================================

function alertsUpdateSummary() {

    const events = alertsInSelectedRange();

    alertsSetText(
        "alertsTotalCount",
        events.length
    );

    alertsSetText(
        "alertsWarningCount",
        events.filter(
            e => e.category === "warning"
        ).length
    );

    alertsSetText(
        "alertsCriticalCount",
        events.filter(
            e => e.category === "high_risk"
        ).length
    );

    alertsSetText(
        "alertsAnomalyCount",
        events.filter(
            e => e.category === "anomaly"
        ).length
    );
}


// ==========================================
// SENSOR MONITORING STATUS
// ==========================================

function alertsUpdateMonitoring() {

    const dot = alertsEl(
        "alertsSystemDot"
    );

    const badge = alertsEl(
        "alertsCurrentBadge"
    );

    const content = alertsEl(
        "alertsCurrentContent"
    );

    if (!monitoringStatus) {

        alertsSetText(
            "alertsSystemStatus",
            "Monitoring Unavailable"
        );

        return;
    }

    const online = monitoringStatus.online;

    if (dot) {
        dot.style.background = online
            ? "#16a34a"
            : "#ef4444";
    }

    alertsSetText(
        "alertsSystemStatus",
        online
            ? "Sensors Online"
            : "Sensors Offline"
    );

    if (monitoringStatus.live_timestamp) {

        alertsSetText(
            "alertsLastUpdated",
            "Last sensor reading: "
            + alertsFormatDate(
                monitoringStatus.live_timestamp
            )
            + " IST"
        );

    } else {

        alertsSetText(
            "alertsLastUpdated",
            "No sensor data available"
        );
    }

    if (!content) {
        return;
    }

    // --------------------------------------
    // SENSOR OFFLINE
    // --------------------------------------

    if (!online) {

        if (badge) {
            badge.textContent = "OFFLINE";
            badge.style.background = "#fee2e2";
            badge.style.color = "#b91c1c";
        }

        content.innerHTML = `
            <div class="alerts-current-state">
                <h3>Sensor Monitoring Offline</h3>

                <p>
                    ESP32 se fresh sensor readings
                    receive nahi ho rahi hain.
                </p>

                <p>
                    Neeche diye gaye alerts historical
                    records hain, active emergencies nahi.
                </p>
            </div>
        `;

        return;
    }

    // --------------------------------------
    // SENSOR ONLINE, AI PENDING
    // --------------------------------------

    if (!monitoringStatus.ai_current) {

        if (badge) {
            badge.textContent = "AI PENDING";
            badge.style.background = "#fef3c7";
            badge.style.color = "#92400e";
        }

        content.innerHTML = `
            <div class="alerts-current-state">
                <h3>Sensors Online</h3>

                <p>
                    Fresh hardware readings available hain.
                </p>

                <p>
                    Matching fresh AI analysis ka
                    wait ho raha hai.
                </p>
            </div>
        `;

        return;
    }

    // --------------------------------------
    // FRESH AI RESULT
    // --------------------------------------

    const status = String(
        monitoringStatus.health_status || "UNKNOWN"
    ).toUpperCase();

    const risk = monitoringStatus.risk_score;

    let anomalyText = "Not evaluated";

    if (monitoringStatus.is_anomaly === true) {
        anomalyText = "Unusual pattern detected";
    }

    if (monitoringStatus.is_anomaly === false) {
        anomalyText = "No anomaly flagged";
    }

    if (badge) {
        badge.textContent = status;

        if (
            status === "CRITICAL"
            || status === "HIGH_RISK"
        ) {
            badge.style.background = "#fee2e2";
            badge.style.color = "#b91c1c";

        } else if (status === "WARNING") {
            badge.style.background = "#fef3c7";
            badge.style.color = "#92400e";

        } else {
            badge.style.background = "#dcfce7";
            badge.style.color = "#166534";
        }
    }

    content.innerHTML = `
        <div class="alerts-current-state">
            <h3>Current AI Monitoring: ${alertsEscape(status)}</h3>

            <p>
                <strong>Risk Score:</strong>
                ${risk === null || risk === undefined
                    ? "Not available"
                    : alertsEscape(risk) + " / 100"}
            </p>

            <p>
                <strong>Isolation Forest:</strong>
                ${alertsEscape(anomalyText)}
            </p>

            <p>
                Experimental monitoring result.
                Not a veterinary diagnosis.
            </p>
        </div>
    `;
}


// ==========================================
// ALERT HISTORY TIMELINE
// ==========================================

function alertsRenderTimeline() {

    const container = alertsEl(
        "alertsTimelineList"
    );

    if (!container) {
        return;
    }

    const alerts = alertsFilteredList();

    if (alerts.length === 0) {

        container.innerHTML = `
            <div class="alerts-empty-state">
                <div class="alerts-empty-icon">✓</div>

                <h3>No Alerts Found</h3>

                <p>
                    Selected category aur time range
                    mein koi actual recorded alert
                    available nahi hai.
                </p>

                <p>
                    Sirf Firebase mein stored real AI
                    monitoring events yahan dikhenge.
                </p>
            </div>
        `;

        return;
    }

    container.innerHTML = alerts.map(alert => {

        const category = alert.category;

        let categoryLabel = "Warning";

        if (category === "high_risk") {
            categoryLabel = "High Risk";
        }

        if (category === "anomaly") {
            categoryLabel = "AI Anomaly";
        }

        const riskText = (
            alert.risk_score === null
            || alert.risk_score === undefined
        )
            ? ""
            : `
                <span>
                    Risk: ${alertsEscape(alert.risk_score)}
                </span>
            `;

        return `
            <article class="alerts-event ${
                category === "high_risk"
                    ? "high-risk"
                    : alertsEscape(category)
            }">

                <div class="alerts-event-header">

                    <div>
                        <span class="alerts-event-category">
                            ${alertsEscape(categoryLabel)}
                        </span>

                        <h3>
                            ${alertsEscape(alert.title)}
                        </h3>
                    </div>

                    <span class="alerts-event-age">
                        Historical Record
                    </span>
                </div>

                <p class="alerts-event-message">
                    ${alertsEscape(alert.message)}
                </p>

                <div class="alerts-event-meta">
                    <span>
                        ${alertsEscape(
                            alertsFormatDate(alert.timestamp)
                        )} IST
                    </span>

                    ${riskText}
                </div>

                <p class="alerts-event-note">
                    Experimental monitoring alert.
                    Not a confirmed disease diagnosis.
                </p>
            </article>
        `;

    }).join("");
}


// ==========================================
// RENDER PAGE
// ==========================================

function alertsRenderPage() {

    alertsUpdateSummary();

    alertsUpdateMonitoring();

    alertsRenderTimeline();
}


// ==========================================
// LOAD ALERTS API
// ==========================================

async function alertsLoadData() {

    const refreshBtn = alertsEl(
        "alertsRefreshBtn"
    );

    if (refreshBtn) {
        refreshBtn.disabled = true;
    }

    try {

        const response = await fetch(
            "/api/alerts",
            { cache: "no-store" }
        );

        if (!response.ok) {
            throw new Error(
                "HTTP " + response.status
            );
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error("Alerts API failed");
        }

        allAlerts = Array.isArray(data.events)
            ? data.events
            : [];

        monitoringStatus = data.monitoring || null;

        alertsRenderPage();

        console.log(
            "Real Firebase alerts loaded:",
            allAlerts.length
        );

    } catch (error) {

        console.error(
            "Alerts Error:",
            error
        );

        alertsSetText(
            "alertsSystemStatus",
            "Connection Error"
        );

        const container = alertsEl(
            "alertsTimelineList"
        );

        if (container) {

            container.innerHTML = `
                <div class="alerts-empty-state">
                    <h3>Unable to Load Alerts</h3>

                    <p>
                        Firebase ya Flask connection
                        check karo aur Refresh dabao.
                    </p>
                </div>
            `;
        }

    } finally {

        if (refreshBtn) {
            refreshBtn.disabled = false;
        }
    }
}


// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        // Category filters

        document.querySelectorAll(
            ".alerts-filter-btn"
        ).forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    activeAlertFilter =
                        button.dataset.filter || "all";

                    document.querySelectorAll(
                        ".alerts-filter-btn"
                    ).forEach(item => {
                        item.classList.remove("active");
                    });

                    button.classList.add("active");

                    alertsRenderTimeline();
                }
            );
        });

        // Time range

        const rangeSelector = alertsEl(
            "alertsTimeRange"
        );

        if (rangeSelector) {

            activeTimeRange =
                rangeSelector.value || "7d";

            rangeSelector.addEventListener(
                "change",
                () => {

                    activeTimeRange =
                        rangeSelector.value;

                    alertsUpdateSummary();

                    alertsRenderTimeline();
                }
            );
        }

        // Refresh button

        const refreshBtn = alertsEl(
            "alertsRefreshBtn"
        );

        if (refreshBtn) {
            refreshBtn.addEventListener(
                "click",
                alertsLoadData
            );
        }

        // First load

        alertsLoadData();

        // Automatic refresh every 30 seconds

        setInterval(
            alertsLoadData,
            30000
        );
    }
);
