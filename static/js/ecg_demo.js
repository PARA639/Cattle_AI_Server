(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", function () {

        const canvas = document.getElementById("ecgDemoChart");

        if (!canvas || typeof Chart === "undefined") {
            return;
        }

        const points = [];

        // Illustrative ECG-like pattern.
        // NOT a measured or predicted ECG waveform.

        for (let i = 0; i < 300; i++) {

            const phase = i % 60;

            let value = 0;

            // P-wave
            if (phase >= 8 && phase <= 15) {
                value = 0.1 * Math.sin(
                    ((phase - 8) / 7) * Math.PI
                );
            }

            // QRS complex
            if (phase === 23) value = -0.25;
            if (phase === 24) value = 1.2;
            if (phase === 25) value = -0.4;

            // T-wave
            if (phase >= 35 && phase <= 48) {
                value = 0.25 * Math.sin(
                    ((phase - 35) / 13) * Math.PI
                );
            }

            points.push(value);
        }

        new Chart(canvas, {
            type: "line",

            data: {
                labels: points.map((_, index) => index),

                datasets: [{
                    label: "Illustrative ECG Pattern",
                    data: points,
                    borderColor: "#ef4444",
                    backgroundColor: "rgba(239,68,68,0.08)",
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0,
                    fill: false
                }]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,

                plugins: {
                    legend: {
                        display: false
                    },

                    tooltip: {
                        enabled: false
                    }
                },

                scales: {
                    x: {
                        display: false
                    },

                    y: {
                        display: false,
                        suggestedMin: -0.5,
                        suggestedMax: 1.4
                    }
                }
            }
        });

    });

})();
