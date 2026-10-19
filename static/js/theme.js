// ==========================================
// CATTLE AI — THEME MANAGEMENT
// ==========================================

const CATTLE_THEME_KEY = "cattle_theme";

function getThemePreference() {
    return localStorage.getItem(CATTLE_THEME_KEY) || "dark";
}

function resolveDarkTheme(preference) {

    if (preference === "system") {
        return window.matchMedia(
            "(prefers-color-scheme: dark)"
        ).matches;
    }

    return preference === "dark";
}

function applyTheme() {

    const preference = getThemePreference();
    const dark = resolveDarkTheme(preference);

    document.body.classList.toggle("dark", dark);

    document.documentElement.classList.remove(
        "theme-preload-dark"
    );

    updateThemeButton();
}

function setThemePreference(preference) {

    if (!["light", "dark", "system"].includes(preference)) {
        return;
    }

    localStorage.setItem(
        CATTLE_THEME_KEY,
        preference
    );

    applyTheme();

    window.dispatchEvent(
        new CustomEvent("cattle:theme-changed", {
            detail: { theme: preference }
        })
    );
}

// Existing header toggle will keep working.
// It switches between the effective dark/light states.

function toggleTheme() {

    const dark = document.body.classList.contains("dark");

    setThemePreference(
        dark ? "light" : "dark"
    );
}

function updateThemeButton() {

    const btn = document.getElementById("themeToggle");

    if (!btn) return;

    const dark = document.body.classList.contains("dark");

    btn.textContent = dark
        ? "☀️ Light"
        : "🌙 Dark";
}

// Apply immediately so pages don't flash wrong theme.

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        applyTheme
    );

} else {

    applyTheme();
}

document.addEventListener("DOMContentLoaded", () => {

    const currentPath = window.location.pathname;

    document.querySelectorAll(".nav-link").forEach(link => {

        link.classList.toggle(
            "active",
            link.getAttribute("href") === currentPath
        );

    });

});

// Follow OS theme when "system" is selected.

window.matchMedia(
    "(prefers-color-scheme: dark)"
).addEventListener("change", () => {

    if (getThemePreference() === "system") {
        applyTheme();
    }

});
