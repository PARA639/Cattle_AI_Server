// ==========================================
// CATTLE AI — WORKING SETTINGS
// ==========================================

(function () {
    "use strict";

    const KEYS = {
        theme: "cattle_theme",
        language: "cattle_language",
        refresh: "cattle_refresh_interval",
        notifications: "cattle_notifications"
    };

    const DEFAULTS = {
        theme: "dark",
        language: "en",
        refresh: "15",
        notifications: "off"
    };

    function el(id) {
        return document.getElementById(id);
    }

    function getSetting(key, fallback) {
        try {
            return localStorage.getItem(key) || fallback;
        } catch (error) {
            console.error("Storage error:", error);
            return fallback;
        }
    }

    function saveSetting(key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (error) {
            console.error("Storage save error:", error);
            return false;
        }
    }

    function applySelectedTheme(theme) {
        if (typeof setThemePreference === "function") {
            setThemePreference(theme);
            return true;
        }

        // Fallback if theme.js hasn't loaded correctly.
        const dark = theme === "dark" || (
            theme === "system" &&
            window.matchMedia("(prefers-color-scheme: dark)").matches
        );

        document.body.classList.toggle("dark", dark);

        if (typeof updateThemeButton === "function") {
            updateThemeButton();
        }

        return saveSetting(KEYS.theme, theme);
    }

    function applySelectedLanguage(language) {
        if (typeof setCattleLanguage === "function") {
            setCattleLanguage(language);
            return true;
        }

        console.error("i18n.js not loaded");
        return false;
    }

    function translate(key, fallback) {
        if (typeof cattleTranslate === "function") {
            return cattleTranslate(key);
        }
        return fallback;
    }

    function updateSummary() {
        const theme = getSetting(KEYS.theme, DEFAULTS.theme);
        const language = getSetting(KEYS.language, DEFAULTS.language);
        const refresh = getSetting(KEYS.refresh, DEFAULTS.refresh);
        const notifications = getSetting(
            KEYS.notifications,
            DEFAULTS.notifications
        );

        const themeLabels = {
            light: translate("settings.light", "Light"),
            dark: translate("settings.dark", "Dark"),
            system: translate("settings.system", "System")
        };

        const languageLabels = {
            en: "English",
            hi: "हिन्दी",
            mr: "मराठी",
            ta: "தமிழ்",
            te: "తెలుగు"
        };

        if (el("settingsCurrentTheme")) {
            el("settingsCurrentTheme").textContent =
                themeLabels[theme] || theme;
        }

        if (el("settingsCurrentLanguage")) {
            el("settingsCurrentLanguage").textContent =
                languageLabels[language] || language;
        }

        if (el("settingsCurrentRefresh")) {
            el("settingsCurrentRefresh").textContent =
                refresh + " seconds";
        }

        if (el("settingsCurrentNotifications")) {
            el("settingsCurrentNotifications").textContent =
                notifications === "on"
                    ? translate("settings.enabled", "Enabled")
                    : translate("settings.disabled", "Disabled");
        }
    }

    function showMessage(message, success = true) {
        const messageElement = el("settingsSaveMessage");

        if (!messageElement) return;

        messageElement.textContent = message;
        messageElement.style.color = success
            ? "#22c55e"
            : "#ef4444";
    }

    function loadSettings() {
        el("settingsTheme").value =
            getSetting(KEYS.theme, DEFAULTS.theme);

        el("settingsLanguage").value =
            getSetting(KEYS.language, DEFAULTS.language);

        el("settingsRefresh").value =
            getSetting(KEYS.refresh, DEFAULTS.refresh);

        el("settingsNotifications").value =
            getSetting(KEYS.notifications, DEFAULTS.notifications);

        updateSummary();
    }

    function saveAllSettings() {
        const theme = el("settingsTheme").value;
        const language = el("settingsLanguage").value;
        const refresh = el("settingsRefresh").value;
        const notifications = el("settingsNotifications").value;

        const saved = [
            saveSetting(KEYS.theme, theme),
            saveSetting(KEYS.language, language),
            saveSetting(KEYS.refresh, refresh),
            saveSetting(KEYS.notifications, notifications)
        ].every(Boolean);

        if (!saved) {
            showMessage(
                "Unable to save settings. Check browser storage permissions.",
                false
            );
            return;
        }

        applySelectedTheme(theme);
        applySelectedLanguage(language);
        updateSummary();

        showMessage(
            "✓ " + translate(
                "settings.saved",
                "Preferences saved successfully"
            )
        );

        console.log("CattleAI settings saved:", {
            theme,
            language,
            refresh,
            notifications
        });
    }

    function restoreDefaults() {
        el("settingsTheme").value = DEFAULTS.theme;
        el("settingsLanguage").value = DEFAULTS.language;
        el("settingsRefresh").value = DEFAULTS.refresh;
        el("settingsNotifications").value = DEFAULTS.notifications;

        saveAllSettings();
    }

    function initSettings() {
        const required = [
            "settingsTheme",
            "settingsLanguage",
            "settingsRefresh",
            "settingsNotifications",
            "settingsSaveBtn",
            "settingsResetBtn"
        ];

        const missing = required.filter(id => !el(id));

        if (missing.length) {
            console.error("Missing Settings elements:", missing);
            return;
        }

        loadSettings();

        // Apply theme immediately when selected.
        el("settingsTheme").addEventListener("change", function () {
            applySelectedTheme(this.value);
            updateSummary();
        });

        // Apply language immediately when selected.
        el("settingsLanguage").addEventListener("change", function () {
            applySelectedLanguage(this.value);
            updateSummary();
        });

        // Save all preferences.
        el("settingsSaveBtn").addEventListener("click", saveAllSettings);

        // Restore defaults.
        el("settingsResetBtn").addEventListener("click", restoreDefaults);

        window.addEventListener(
            "cattle:theme-changed",
            updateSummary
        );

        window.addEventListener(
            "cattle:language-applied",
            updateSummary
        );

        console.log("✅ CattleAI Settings initialized");
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initSettings);
    } else {
        initSettings();
    }
})();
