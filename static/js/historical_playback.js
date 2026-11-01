// ======================================================
// CATTLEAI OVERVIEW — LIVE + HISTORICAL PLAYBACK
// Uses genuine ESP32 measurements from Firebase
// ======================================================

(function () {
    "use strict";

    const HISTORY_URL = "/api/analytics-history?range=7d";
    const LIVE_URL = "/api/live";

    let mode = "playback";
    let playing = false;

    let records = [];
    let currentIndex = 0;

    let playbackTimer = null;
    let liveTimer = null;

    let currentSpeed = 1500;
    let loadingHistory = false;

    // Prevent overlapping requests and late responses.
    let requestGeneration = 0;


    // ==================================================
    // HELPERS
    // ==================================================

    function el(id) {
        return document.getElementById(id);
    }

    function setText(id, value) {
        const target = el(id);

        if (target) {
            target.textContent = value;
        }
    }

    function number(value) {
        if (
            value === null ||
            value === undefined ||
            value === "" ||
            typeof value === "boolean"
        ) {
            return null;
        }

        const parsed = Number(value);

        return Number.isFinite(parsed)
            ? parsed
            : null;
    }

    function formatDate(timestamp) {
        const seconds = number(timestamp);

        if (seconds === null || seconds <= 0) {
            return "Unknown";
        }

        return new Date(seconds * 1000).toLocaleString(
            "en-IN",
            {
                timeZone: "Asia/Kolkata",
                dateStyle: "medium",
                timeStyle: "medium"
            }
        );
    }

    function refreshSeconds() {
        const seconds = Number(
            localStorage.getItem(
                "cattle_refresh_interval"
            ) || "15"
        );

        return [10, 15, 30, 60].includes(seconds)
            ? seconds
            : 15;
    }


    // ==================================================
    // SENSOR CARD RENDERING
    // ==================================================

    function renderMeasurements(data) {
        const temperature = number(
            data.temperature
        );

        const acceleration = number(
            data.accel_mag
        );

        const sound = number(
            data.sound_peak
        );

        setText(
            "temperature",
            data.temp_valid === true &&
            temperature !== null
                ? temperature.toFixed(2)
                : "--"
        );

        setText(
            "acceleration",
            data.mpu_valid === false ||
            acceleration === null
                ? "--"
                : acceleration.toFixed(2)
        );

        setText(
            "sound",
            sound === null
                ? "--"
                : String(sound)
        );

        // Heart rate can only be shown when genuinely
        // measured using appropriate cardiac hardware.

        const heartRate = number(
            data.heart_rate_bpm
        );

        setText(
            "heartRate",
            data.heart_rate_source === "measured" &&
            heartRate !== null &&
            heartRate > 0
                ? heartRate.toFixed(0)
                : "--"
        );
    }


    // ==================================================
    // HISTORICAL PLAYBACK
    // ==================================================

    function renderHistoricalRecord(record) {
        renderMeasurements(record);

        setText(
            "playbackTimestamp",
            "Recorded: " +
            formatDate(record.timestamp)
        );

        setText(
            "playbackProgress",
            `${currentIndex + 1} / ${records.length} records`
        );

        // Historical sensor records do not contain
        // matching AI results.

        setText(
            "healthStatus",
            "HISTORICAL"
        );

        setText(
            "riskScore",
            "--"
        );

        setText(
            "anomalyStatus",
            "NOT EVALUATED"
        );
    }

    function playbackStep() {
        if (
            mode !== "playback" ||
            records.length === 0
        ) {
            return;
        }

        renderHistoricalRecord(
            records[currentIndex]
        );

        currentIndex = (
            currentIndex + 1
        ) % records.length;
    }

    function stopPlaybackTimer() {
        playing = false;

        if (playbackTimer !== null) {
            clearInterval(playbackTimer);
            playbackTimer = null;
        }
    }

    function startPlayback() {
        if (
            mode !== "playback" ||
            records.length === 0 ||
            playing
        ) {
            return;
        }

        stopPlaybackTimer();

        playing = true;

        setText(
            "playbackState",
            "▶ Playing actual recorded sensor data"
        );

        playbackStep();

        playbackTimer = setInterval(
            playbackStep,
            currentSpeed
        );
    }

    function pausePlayback() {
        stopPlaybackTimer();

        setText(
            "playbackState",
            "⏸ Playback Paused"
        );
    }


    // ==================================================
    // LOAD FIREBASE HISTORY
    // ==================================================

    async function loadHistoricalRecords() {
        if (loadingHistory) {
            return;
        }

        loadingHistory = true;

        setText(
            "playbackState",
            "Loading genuine Firebase history..."
        );

        try {
            const response = await fetch(
                HISTORY_URL,
                { cache: "no-store" }
            );

            if (!response.ok) {
                throw new Error(
                    "History API HTTP " +
                    response.status
                );
            }

            const result = await response.json();

            if (
                !result.success ||
                !Array.isArray(result.history)
            ) {
                throw new Error(
                    "Invalid history response"
                );
            }

            records = result.history
                .filter(record =>
                    number(record.timestamp) !== null
                )
                .sort((a, b) =>
                    Number(a.timestamp) -
                    Number(b.timestamp)
                );

            if (records.length === 0) {
                setText(
                    "playbackState",
                    "No historical measurements found"
                );

                return;
            }

            currentIndex = 0;

            setText(
                "playbackProgress",
                records.length +
                " genuine sensor records loaded"
            );

            if (mode === "playback") {
                startPlayback();
            }

        } catch (error) {
            console.error(
                "Historical playback error:",
                error
            );

            setText(
                "playbackState",
                "Unable to load Firebase history"
            );

        } finally {
            loadingHistory = false;
        }
    }


    // ==================================================
    // LATEST FIREBASE DATA
    // ==================================================

    async function loadLatestData() {
        if (mode !== "live") {
            return;
        }

        const generation = requestGeneration;

        try {
            const response = await fetch(
                LIVE_URL,
                { cache: "no-store" }
            );

            if (!response.ok) {
                throw new Error(
                    "Live API HTTP " +
                    response.status
                );
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(
                    "Live API unsuccessful"
                );
            }

            if (
                mode !== "live" ||
                generation !== requestGeneration
            ) {
                return;
            }

            renderMeasurements(
                result.live || {}
            );

            const ai = result.ai || {};

            const liveTimestamp = number(
                result.live?.timestamp
            );

            const aiTimestamp = number(
                ai.source_timestamp
            );

            const aiCurrent = (
                result.online === true &&
                liveTimestamp !== null &&
                aiTimestamp !== null &&
                Math.abs(
                    liveTimestamp - aiTimestamp
                ) <= 15
            );

            if (!result.online) {
                setText(
                    "healthStatus",
                    "OFFLINE"
                );

                setText("riskScore", "--");

                setText(
                    "anomalyStatus",
                    "OLD DATA"
                );

            } else if (!aiCurrent) {
                setText(
                    "healthStatus",
                    "AI PENDING"
                );

                setText("riskScore", "--");

                setText(
                    "anomalyStatus",
                    "AI PENDING"
                );

            } else {
                setText(
                    "healthStatus",
                    String(
                        ai.health_status || "UNKNOWN"
                    )
                );

                const risk = number(
                    ai.risk_score
                );

                setText(
                    "riskScore",
                    risk === null
                        ? "--"
                        : String(risk)
                );

                setText(
                    "anomalyStatus",
                    ai.model_trained !== true
                        ? "NOT READY"
                        : ai.is_anomaly === true
                            ? "DETECTED"
                            : "NORMAL"
                );
            }

            setText(
                "playbackTimestamp",
                "Latest reading: " +
                formatDate(liveTimestamp)
            );

        } catch (error) {
            console.error(
                "Latest data error:",
                error
            );

            setText(
                "healthStatus",
                "UNAVAILABLE"
            );

            setText("riskScore", "--");
            setText(
                "anomalyStatus",
                "--"
            );
        }
    }


    // ==================================================
    // MONITORING MODE SWITCH
    // ==================================================

    function stopLiveTimer() {
        if (liveTimer !== null) {
            clearInterval(liveTimer);
            liveTimer = null;
        }
    }

    function startLiveTimer() {
        stopLiveTimer();

        loadLatestData();

        liveTimer = setInterval(
            loadLatestData,
            refreshSeconds() * 1000
        );
    }

    function updateModeButtons() {
        const liveButton = el("liveModeBtn");
        const playbackButton = el(
            "playbackModeBtn"
        );

        if (liveButton) {
            liveButton.classList.toggle(
                "active",
                mode === "live"
            );
        }

        if (playbackButton) {
            playbackButton.classList.toggle(
                "active",
                mode === "playback"
            );
        }
    }

    function switchMode(newMode) {
        if (
            newMode !== "live" &&
            newMode !== "playback"
        ) {
            return;
        }

        requestGeneration++;

        stopPlaybackTimer();
        stopLiveTimer();

        mode = newMode;

        updateModeButtons();

        const controls = el(
            "playbackControls"
        );

        if (controls) {
            controls.style.display =
                mode === "playback"
                    ? "block"
                    : "none";
        }

        if (mode === "live") {
            setText(
                "playbackState",
                "Latest Firebase monitoring mode"
            );

            startLiveTimer();
        } else {
            if (records.length > 0) {
                startPlayback();
            } else {
                loadHistoricalRecords();
            }
        }
    }


    // ==================================================
    // INITIALIZATION
    // ==================================================

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            const liveButton = el(
                "liveModeBtn"
            );

            const playbackButton = el(
                "playbackModeBtn"
            );

            const playButton = el(
                "startPlaybackBtn"
            );

            const pauseButton = el(
                "pausePlaybackBtn"
            );

            const speedSelector = el(
                "playbackSpeed"
            );

            if (liveButton) {
                liveButton.addEventListener(
                    "click",
                    () => switchMode("live")
                );
            }

            if (playbackButton) {
                playbackButton.addEventListener(
                    "click",
                    () => switchMode("playback")
                );
            }

            if (playButton) {
                playButton.addEventListener(
                    "click",
                    startPlayback
                );
            }

            if (pauseButton) {
                pauseButton.addEventListener(
                    "click",
                    pausePlayback
                );
            }

            if (speedSelector) {
                currentSpeed = Number(
                    speedSelector.value
                ) || 1500;

                speedSelector.addEventListener(
                    "change",
                    () => {

                        currentSpeed = Number(
                            speedSelector.value
                        ) || 1500;

                        if (playing) {
                            stopPlaybackTimer();
                            startPlayback();
                        }
                    }
                );
            }

            window.addEventListener(
                "cattle:settings-changed",
                () => {
                    if (mode === "live") {
                        startLiveTimer();
                    }
                }
            );

            window.addEventListener(
                "storage",
                event => {
                    if (
                        event.key ===
                        "cattle_refresh_interval" &&
                        mode === "live"
                    ) {
                        startLiveTimer();
                    }
                }
            );

            // Default to historical playback
            // for exhibition demonstration.

            switchMode("playback");
        }
    );

})();
