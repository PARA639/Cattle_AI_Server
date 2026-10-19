// ==========================================
// CATTLE AI — GLOBAL DEVICE STATUS
// SETTINGS-CONTROLLED REFRESH
// ==========================================

(function () {
    "use strict";

    const REFRESH_KEY = "cattle_refresh_interval";

    let globalStatusTimer = null;
    let requestInProgress = false;

    function getRefreshInterval() {

        const seconds = Number(
            localStorage.getItem(REFRESH_KEY) || "15"
        );

        return [10, 15, 30, 60].includes(seconds)
            ? seconds * 1000
            : 15000;
    }

    async function updateGlobalStatus() {

        const badge = document.getElementById(
            "globalStatus"
        );

        if (!badge || requestInProgress) return;

        requestInProgress = true;

        try {

            const response = await fetch(
                "/api/live",
                { cache: "no-store" }
            );

            if (!response.ok) {
                throw new Error("API error");
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error("No sensor data");
            }

            badge.textContent = data.online
                ? "● ONLINE"
                : "● OFFLINE";

            badge.className = "device-badge " +
                (data.online ? "online" : "offline");

        } catch (error) {

            badge.textContent = "● CONNECTION ERROR";
            badge.className = "device-badge offline";

        } finally {

            requestInProgress = false;
        }
    }

    function startGlobalStatusMonitoring() {

        if (globalStatusTimer !== null) {
            clearInterval(globalStatusTimer);
        }

        updateGlobalStatus();

        globalStatusTimer = setInterval(
            updateGlobalStatus,
            getRefreshInterval()
        );

        console.log(
            "Global status refresh interval:",
            getRefreshInterval() / 1000,
            "seconds"
        );
    }

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            startGlobalStatusMonitoring();

            // Sync preferences changed in another tab.

            window.addEventListener(
                "storage",
                event => {

                    if (event.key === REFRESH_KEY) {
                        startGlobalStatusMonitoring();
                    }
                }
            );

            // Sync preferences changed in same tab.

            window.addEventListener(
                "cattle:settings-changed",
                startGlobalStatusMonitoring
            );
        }
    );

})();
