(function () {
    "use strict";

    const API_URL = "/api/profile";

    function findElement(...selectors) {
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) return element;
        }
        return null;
    }

    function showMessage(message, isError = false) {
        const status = findElement(
            "#profile-status",
            "#profileStatus",
            "#save-status",
            "#saveStatus",
            ".profile-status"
        );

        if (status) {
            status.textContent = message;
            status.style.color = isError ? "#ef4444" : "#22c55e";
        } else {
            console.log(message);
        }
    }

    async function loadProfile() {
        try {
            const response = await fetch(API_URL, {
                cache: "no-store"
            });

            if (!response.ok) {
                throw new Error("HTTP " + response.status);
            }

            const result = await response.json();

            const profile = result.profile || result.data || result;

            const nameInput = findElement(
                "#cattle-name",
                "#cattleName",
                "#name"
            );

            const breedInput = findElement(
                "#cattle-breed",
                "#cattleBreed",
                "#breed"
            );

            const ageInput = findElement(
                "#cattle-age",
                "#cattleAge",
                "#age"
            );

            const imageElement = findElement(
                "#profile-image",
                "#profileImage",
                "#cattle-image",
                "#cattleImage"
            );

            if (nameInput) {
                nameInput.value = profile.name || profile.cattle_name || "";
            }

            if (breedInput) {
                breedInput.value = profile.breed || "";
            }

            if (ageInput) {
                ageInput.value = profile.age || "";
            }

            if (imageElement && (profile.image || profile.image_url)) {
                imageElement.src = profile.image || profile.image_url;
            }

            showMessage("Cattle profile loaded successfully.");

        } catch (error) {
            console.error("Profile loading error:", error);
            showMessage("Unable to load cattle profile.", true);
        }
    }

    function readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(
                new Error("Failed to read image")
            );

            reader.readAsDataURL(file);
        });
    }

    async function saveProfile(event) {
        if (event) event.preventDefault();

        const nameInput = findElement(
            "#cattle-name",
            "#cattleName",
            "#name"
        );

        const breedInput = findElement(
            "#cattle-breed",
            "#cattleBreed",
            "#breed"
        );

        const ageInput = findElement(
            "#cattle-age",
            "#cattleAge",
            "#age"
        );

        const imageInput = findElement(
            "#profile-image-upload",
            "#profileImageUpload",
            "#image-upload",
            "#imageUpload",
            'input[type="file"]'
        );

        const payload = {
            name: nameInput ? nameInput.value.trim() : "",
            breed: breedInput ? breedInput.value.trim() : "",
            age: ageInput ? ageInput.value.trim() : ""
        };

        try {
            if (imageInput && imageInput.files.length > 0) {
                payload.image = await readFileAsDataURL(
                    imageInput.files[0]
                );
            }

            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (!response.ok || result.success === false) {
                throw new Error(
                    result.error || "Unable to save profile"
                );
            }

            showMessage("Cattle profile saved successfully.");
            await loadProfile();

        } catch (error) {
            console.error("Profile saving error:", error);
            showMessage(error.message, true);
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        loadProfile();

        const form = findElement(
            "#profile-form",
            "#profileForm",
            "form"
        );

        if (form) {
            form.addEventListener("submit", saveProfile);
        }

        const saveButton = findElement(
            "#save-profile",
            "#saveProfile",
            "#saveProfileBtn"
        );

        if (saveButton && !form) {
            saveButton.addEventListener("click", saveProfile);
        }
    });

})();
