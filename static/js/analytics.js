// ==========================================
// CATTLE AI - SENSOR ANALYTICS
// FIREBASE REAL HISTORICAL DATA
// ==========================================

let analyticsData = [];

let selectedRange = "24h";

let visiblePoints = 100;

let startIndex = 0;

let temperatureChart = null;
let motionChart = null;
let soundChart = null;

let activeRequest = null;
// ==========================================
// SETTINGS-CONTROLLED AUTO REFRESH
// ==========================================

let analyticsRefreshTimer = null;

function getAnalyticsRefreshInterval() {

    const seconds = Number(
        localStorage.getItem("cattle_refresh_interval") || "15"
    );

    return [10, 15, 30, 60].includes(seconds)
        ? seconds * 1000
        : 15000;
}

function startAnalyticsAutoRefresh() {

    if (analyticsRefreshTimer !== null) {
        clearInterval(analyticsRefreshTimer);
    }

    analyticsRefreshTimer = setInterval(
        () => loadAnalytics(true),
        getAnalyticsRefreshInterval()
    );

    console.log(
        "Analytics refresh interval:",
        getAnalyticsRefreshInterval() / 1000,
        "seconds"
    );
}


// ==========================================
// HELPERS
// ==========================================

function formatTime(timestamp) {

    const number = Number(timestamp);

    if (!Number.isFinite(number) || number <= 0) {
        return "--";
    }

    return new Date(number * 1000).toLocaleString(
        "en-IN",
        {
            timeZone: "Asia/Kolkata",
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        }
    );

}


function numericValue(value) {

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


function isValidFlag(value) {

    return (
        value === true ||
        value === 1 ||
        value === "true"
    );

}


function temperatureValue(reading) {

    if (!isValidFlag(reading.temp_valid)) {
        return null;
    }

    return numericValue(reading.temperature);

}


function motionValue(reading) {

    // Explicitly invalid MPU readings must be rejected.
    if (
        reading.mpu_valid === false ||
        reading.mpu_valid === 0 ||
        reading.mpu_valid === "false"
    ) {
        return null;
    }

    const x = numericValue(reading.accel_x);
    const y = numericValue(reading.accel_y);
    const z = numericValue(reading.accel_z);

    const magnitude = numericValue(
        reading.accel_mag
    );

    // Reject missing or non-numeric measurements.
    if (
        x === null ||
        y === null ||
        z === null ||
        magnitude === null
    ) {
        return null;
    }

    // Verify magnitude against the three axes.
    const calculatedMagnitude = Math.sqrt(
        x * x + y * y + z * z
    );

    // Allow small differences due to sensor rounding.
    if (
        Math.abs(
            calculatedMagnitude - magnitude
        ) > 0.15
    ) {
        return null;
    }

    // Accept legacy readings with a missing validity flag
    // only when their measurements are internally consistent.
    return magnitude;

}

function soundValue(reading) {

    return numericValue(reading.sound_peak);

}


function calculateAverage(values) {

    const validValues = values.filter(
        value => value !== null &&
                 Number.isFinite(value)
    );

    if (validValues.length === 0) {
        return null;
    }

    const total = validValues.reduce(
        (sum, value) => sum + value,
        0
    );

    return total / validValues.length;

}


// ==========================================
// STATUS DISPLAY
// ==========================================

function setAnalyticsStatus(message, type = "loading") {

    const text = document.getElementById(
        "analyticsStatusText"
    );

    const dot = document.getElementById(
        "analyticsStatusDot"
    );

    text.textContent = message;

    const colors = {
        loading: "#94a3b8",
        success: "#22c55e",
        error: "#ef4444",
        empty: "#f59e0b"
    };

    dot.style.background =
        colors[type] || colors.loading;

}


// ==========================================
// INITIALIZE CHARTS
// ==========================================

function createSensorChart(canvasId, color, label) {

    const canvas = document.getElementById(
        canvasId
    );

    return new Chart(canvas, {

        type: "line",

        data: {

            labels: [],

            datasets: [{

                label: label,

                data: [],

                borderColor: color,

                backgroundColor: color + "18",

                borderWidth: 2,

                fill: true,

                tension: 0.25,

                pointRadius: 0,

                pointHoverRadius: 5,

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

                    beginAtZero: false,

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


function initializeCharts() {

    temperatureChart = createSensorChart(
        "temperatureChart",
        "#ef4444",
        "Temperature (°C)"
    );

    motionChart = createSensorChart(
        "motionChart",
        "#3b82f6",
        "Acceleration (m/s²)"
    );

    soundChart = createSensorChart(
        "soundChart",
        "#a855f7",
        "Sound Peak (ADC)"
    );

}


// ==========================================
// LOAD REAL FIREBASE HISTORY
// ==========================================

async function loadAnalytics(isAutoRefresh = false) {

    if (activeRequest) {
        activeRequest.abort();
    }

    const controller = new AbortController();

    activeRequest = controller;

    setAnalyticsStatus(
        "Loading actual Firebase sensor history...",
        "loading"
    );

    try {

        const response = await fetch(
            `/api/analytics-history?range=${selectedRange}`,
            {
                signal: controller.signal,
                cache: "no-store"
            }
        );

        if (!response.ok) {
            throw new Error(
                `Server returned HTTP ${response.status}`
            );
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(
                result.error || "Firebase API error"
            );
        }

                const previousLength = analyticsData.length;

        const previousVisiblePoints = visiblePoints;

        const previousStartIndex = startIndex;

        // Was user viewing the latest end of the graph?
        const wasAtLatest = (
            previousLength === 0 ||
            previousStartIndex + previousVisiblePoints
                >= previousLength
        );

        analyticsData = Array.isArray(result.history)
            ? result.history
            : [];

        analyticsData.sort(
            (a, b) => Number(a.timestamp) -
                      Number(b.timestamp)
        );

        if (!isAutoRefresh) {

            // Manual refresh and time-range changes
            // retain the existing default behavior.

            visiblePoints = Math.min(
                100,
                analyticsData.length
            );

            startIndex = Math.max(
                0,
                analyticsData.length - visiblePoints
            );

        } else {

            // Preserve zoom level during auto-refresh.

            visiblePoints = Math.min(
                previousVisiblePoints,
                analyticsData.length
            );

            if (analyticsData.length > 0) {

                visiblePoints = Math.max(
                    1,
                    visiblePoints
                );
            }

            if (wasAtLatest) {

                // Follow new readings if user was
                // already viewing the latest data.

                startIndex = Math.max(
                    0,
                    analyticsData.length - visiblePoints
                );

            } else {

                // Keep user's historical position.

                startIndex = Math.min(
                    previousStartIndex,
                    Math.max(
                        0,
                        analyticsData.length - visiblePoints
                    )
                );
            }
        }
        
        updateSummaryCards();

        updateTimeline();

        updateCharts();

        updateActiveRangeButton();

        document.getElementById(
            "analyticsLastUpdated"
        ).textContent =
            "Last updated: " +
            new Date().toLocaleTimeString("en-IN");

        if (analyticsData.length === 0) {

            setAnalyticsStatus(
                "No sensor readings available in selected time range.",
                "empty"
            );

        } else {

            setAnalyticsStatus(
                `${analyticsData.length} actual Firebase readings loaded`,
                "success"
            );

        }

    } catch (error) {

        if (error.name === "AbortError") {
            return;
        }

        console.error(
            "Analytics error:",
            error
        );

        analyticsData = [];

        updateSummaryCards();
        updateTimeline();
        updateCharts();

        setAnalyticsStatus(
            "Unable to load Firebase history.",
            "error"
        );

    } finally {

        if (activeRequest === controller) {
            activeRequest = null;
        }

    }

}


// ==========================================
// FILTER BUTTONS
// ==========================================

function updateActiveRangeButton() {

    document.querySelectorAll(
        ".analytics-range-btn"
    ).forEach(button => {

        button.classList.toggle(
            "active",
            button.dataset.range === selectedRange
        );

    });

}


function changeRange(range) {

    if (!["1h", "24h", "7d"].includes(range)) {
        return;
    }

    selectedRange = range;

    updateActiveRangeButton();

    loadAnalytics();

}


// ==========================================
// SUMMARY CARDS
// ==========================================

function updateSummaryCards() {

    document.getElementById(
        "totalReadings"
    ).textContent =
        analyticsData.length.toLocaleString("en-IN");

    const averageTemperature = calculateAverage(
        analyticsData.map(temperatureValue)
    );

    const averageMotion = calculateAverage(
        analyticsData.map(motionValue)
    );

    const averageSound = calculateAverage(
        analyticsData.map(soundValue)
    );

    document.getElementById(
        "avgTemperature"
    ).textContent =
        averageTemperature === null
            ? "-- °C"
            : averageTemperature.toFixed(2) + " °C";

    document.getElementById(
        "avgMotion"
    ).textContent =
        averageMotion === null
            ? "-- m/s²"
            : averageMotion.toFixed(2) + " m/s²";

    document.getElementById(
        "avgSound"
    ).textContent =
        averageSound === null
            ? "--"
            : averageSound.toFixed(0);

}


// ==========================================
// UPDATE CHARTS
// ==========================================

function updateCharts() {

    if (
        !temperatureChart ||
        !motionChart ||
        !soundChart
    ) {
        return;
    }

    const visibleData = analyticsData.slice(
        startIndex,
        startIndex + visiblePoints
    );

    const labels = visibleData.map(
        reading => formatTime(reading.timestamp)
    );

    updateSingleChart(
        temperatureChart,
        labels,
        visibleData.map(temperatureValue)
    );

    updateSingleChart(
        motionChart,
        labels,
        visibleData.map(motionValue)
    );

    updateSingleChart(
        soundChart,
        labels,
        visibleData.map(soundValue)
    );

    updateTimelineLabels(visibleData);

}


function updateSingleChart(chart, labels, values) {

    chart.data.labels = labels;

    chart.data.datasets[0].data = values;

    chart.update("none");

}


// ==========================================
// TIMELINE SLIDER
// ==========================================

function updateTimeline() {

    const slider = document.getElementById(
        "timelineSlider"
    );

    const maxStartIndex = Math.max(
        0,
        analyticsData.length - visiblePoints
    );

    startIndex = Math.max(
        0,
        Math.min(startIndex, maxStartIndex)
    );

    slider.min = 0;
    slider.max = maxStartIndex;
    slider.value = startIndex;

    slider.disabled = (
        analyticsData.length === 0 ||
        maxStartIndex === 0
    );

    updateTimelineLabels(
        analyticsData.slice(
            startIndex,
            startIndex + visiblePoints
        )
    );

}

function updateTimelineLabels(visibleData) {

    const first = analyticsData[0];

    const last = analyticsData[
        analyticsData.length - 1
    ];

    document.getElementById(
        "timelineStart"
    ).textContent =
        first ? formatTime(first.timestamp) : "--";

    document.getElementById(
        "timelineEnd"
    ).textContent =
        last ? formatTime(last.timestamp) : "--";

    const visibleFirst = visibleData[0];

    const visibleLast = visibleData[
        visibleData.length - 1
    ];

    document.getElementById(
        "timelineCurrent"
    ).textContent =
        visibleFirst && visibleLast
            ? formatTime(visibleFirst.timestamp) +
              " → " +
              formatTime(visibleLast.timestamp)
            : "No readings loaded";

}


// ==========================================
// ZOOM
// ==========================================

function zoomIn() {

    if (!analyticsData.length) {
        return;
    }

    visiblePoints = Math.max(
        10,
        Math.floor(visiblePoints / 1.5)
    );

    visiblePoints = Math.min(
        visiblePoints,
        analyticsData.length
    );

    updateTimeline();
    updateCharts();

}


function zoomOut() {

    if (!analyticsData.length) {
        return;
    }

    visiblePoints = Math.min(
        analyticsData.length,
        Math.ceil(visiblePoints * 1.5)
    );

    updateTimeline();
    updateCharts();

}


function resetZoom() {

    visiblePoints = Math.min(
        100,
        analyticsData.length
    );

    startIndex = Math.max(
        0,
        analyticsData.length - visiblePoints
    );

    updateTimeline();
    updateCharts();

}


// ==========================================
// CSV EXPORT
// ==========================================

function exportCSV() {

    if (analyticsData.length === 0) {

        alert(
            "No actual Firebase readings available for export."
        );

        return;

    }

    const headers = [
        "Timestamp",
        "DateTime_IST",
        "Temperature_C",
        "Temp_Valid",
        "Accel_X",
        "Accel_Y",
        "Accel_Z",
        "Accel_Magnitude",
        "MPU_Valid",
        "Sound_Peak"
    ];

    const rows = analyticsData.map(reading => [

        reading.timestamp,

        formatTime(reading.timestamp),

        reading.temperature ?? "",

        reading.temp_valid ?? "",

        reading.accel_x ?? "",

        reading.accel_y ?? "",

        reading.accel_z ?? "",

        reading.accel_mag ?? "",

        reading.mpu_valid ?? "",

        reading.sound_peak ?? ""

    ]);

    function escapeCSV(value) {

        const text = String(value ?? "");

        return '"' +
            text.replace(/"/g, '""') +
            '"';

    }

    const csv = [

        headers.map(escapeCSV).join(","),

        ...rows.map(
            row => row.map(escapeCSV).join(",")
        )

    ].join("\r\n");

    const blob = new Blob(
        ["\uFEFF" + csv],
        {
            type: "text/csv;charset=utf-8;"
        }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download =
        `cattle_analytics_${selectedRange}.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);

}

// ==========================================
// ADVANCED GRAPH NAVIGATION
// WHEEL ZOOM + DRAG PAN + TOUCH SWIPE
// ==========================================

function clampNumber(value, min, max) {

    return Math.max(
        min,
        Math.min(value, max)
    );

}


// ==========================================
// WHEEL ZOOM
// ==========================================

function handleGraphWheel(event) {

    if (analyticsData.length < 2) {
        return;
    }

    event.preventDefault();

    const canvas = event.currentTarget;

    const chart = Chart.getChart(canvas);

    if (!chart) {
        return;
    }

    const rect = canvas.getBoundingClientRect();

    const chartArea = chart.chartArea;

    const mouseX = (
        event.clientX - rect.left
    ) * (canvas.width / rect.width);

    const chartWidth = (
        chartArea.right - chartArea.left
    );

    const relativeX = clampNumber(
        (mouseX - chartArea.left) / chartWidth,
        0,
        1
    );

    const oldVisiblePoints = visiblePoints;

    const minimumPoints = Math.min(
        10,
        analyticsData.length
    );

    if (event.deltaY < 0) {

        visiblePoints = Math.max(
            minimumPoints,
            Math.floor(visiblePoints * 0.8)
        );

    } else {

        visiblePoints = Math.min(
            analyticsData.length,
            Math.ceil(visiblePoints * 1.25)
        );

    }

    const oldCursorIndex = (
        startIndex +
        relativeX * oldVisiblePoints
    );

    startIndex = Math.round(
        oldCursorIndex -
        relativeX * visiblePoints
    );

    startIndex = clampNumber(
        startIndex,
        0,
        Math.max(
            0,
            analyticsData.length - visiblePoints
        )
    );

    updateTimeline();

    updateCharts();

}


// ==========================================
// DRAG PAN
// ==========================================

function enableGraphNavigation(canvasId) {

    const canvas = document.getElementById(
        canvasId
    );

    if (!canvas) {
        return;
    }

    let dragging = false;

    let dragStartX = 0;

    let dragStartIndex = 0;


    // WHEEL ZOOM

    canvas.addEventListener(
        "wheel",
        handleGraphWheel,
        { passive: false }
    );


    // POINTER DOWN

    canvas.addEventListener(
        "pointerdown",
        event => {

            if (
                analyticsData.length <= visiblePoints
            ) {
                return;
            }

            dragging = true;

            dragStartX = event.clientX;

            dragStartIndex = startIndex;

            canvas.setPointerCapture(
                event.pointerId
            );

            canvas.style.cursor = "grabbing";

        }
    );


    // POINTER MOVE

    canvas.addEventListener(
        "pointermove",
        event => {

            if (!dragging) {
                return;
            }

            const chart = Chart.getChart(canvas);

            if (!chart) {
                return;
            }

            const chartArea = chart.chartArea;

            const rect = canvas.getBoundingClientRect();

            const chartWidthCss = (
                chartArea.right - chartArea.left
            ) * (rect.width / canvas.width);

            if (chartWidthCss <= 0) {
                return;
            }

            const deltaX = (
                event.clientX - dragStartX
            );

            const pointsMoved = Math.round(
                (deltaX / chartWidthCss) *
                visiblePoints
            );

            startIndex = clampNumber(
                dragStartIndex - pointsMoved,
                0,
                Math.max(
                    0,
                    analyticsData.length - visiblePoints
                )
            );

            updateTimeline();

            updateCharts();

        }
    );


    // POINTER UP

    function stopDragging(event) {

        dragging = false;

        canvas.style.cursor = "grab";

        if (
            event &&
            canvas.hasPointerCapture(event.pointerId)
        ) {
            canvas.releasePointerCapture(
                event.pointerId
            );
        }

    }


    canvas.addEventListener(
        "pointerup",
        stopDragging
    );

    canvas.addEventListener(
        "pointercancel",
        stopDragging
    );

    canvas.addEventListener(
        "lostpointercapture",
        () => {
            dragging = false;
            canvas.style.cursor = "grab";
        }
    );


    // DEFAULT CURSOR

    canvas.style.cursor = "grab";

    // Allow horizontal touch gesture handling
    canvas.style.touchAction = "pan-y";

}


// ==========================================
// ENABLE NAVIGATION ON ALL THREE GRAPHS
// ==========================================

function initializeGraphNavigation() {

    enableGraphNavigation(
        "temperatureChart"
    );

    enableGraphNavigation(
        "motionChart"
    );

    enableGraphNavigation(
        "soundChart"
    );

}

// ==========================================
// EVENT LISTENERS
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeCharts();

        initializeGraphNavigation();

        document.querySelectorAll(
            ".analytics-range-btn"
        ).forEach(button => {

            button.addEventListener(
                "click",
                () => changeRange(
                    button.dataset.range
                )
            );

        });

        document.getElementById(
            "refreshAnalyticsBtn"
        ).addEventListener(
            "click",
            loadAnalytics
        );

        document.getElementById(
            "exportCsvBtn"
        ).addEventListener(
            "click",
            exportCSV
        );

        document.getElementById(
            "zoomInBtn"
        ).addEventListener(
            "click",
            zoomIn
        );

        document.getElementById(
            "zoomOutBtn"
        ).addEventListener(
            "click",
            zoomOut
        );

        document.getElementById(
            "resetZoomBtn"
        ).addEventListener(
            "click",
            resetZoom
        );

        document.getElementById(
            "timelineSlider"
        ).addEventListener(
            "input",
            event => {

                startIndex = Number(
                    event.target.value
                );

                updateCharts();

            }
        );

        // Start with 24-hour history
        updateActiveRangeButton();

        loadAnalytics();

    }
);
