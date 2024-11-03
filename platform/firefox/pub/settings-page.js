document.addEventListener("DOMContentLoaded", () => {
  // Get all DOM elements
  const themeSelect = document.getElementById("themeSelect");
  const warningToggle = document.getElementById("warningToggle");
  const updateFrequency = document.getElementById("updateFrequency");
  const saveButton = document.getElementById("saveSettings");
  const notification = document.getElementById("notification");
  const lastUpdated = document.getElementById("lastUpdated");
  const updateStatus = document.getElementById("updateStatus");

  // Theme application function
  function applyTheme(theme) {
    if (theme === "system") {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      document.body.setAttribute("data-theme", prefersDark ? "dark" : "light");
    } else {
      document.body.setAttribute("data-theme", theme);
    }
  }

  // Format date function
  function formatDate(date) {
    if (!date) return "Never";
    const d = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now - d);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return (
        "Today at " +
        d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    } else if (diffDays === 1) {
      return (
        "Yesterday at " +
        d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    } else {
      return (
        d.toLocaleDateString() +
        " " +
        d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    }
  }

  // Calculate next update time
  function calculateNextUpdate(lastUpdate, frequency) {
    if (!lastUpdate) return "Not scheduled";
    const lastUpdateDate = new Date(lastUpdate);
    let nextUpdate = new Date(lastUpdateDate);

    switch (frequency) {
      case "daily":
        nextUpdate.setDate(nextUpdate.getDate() + 1);
        nextUpdate.setHours(0, 0, 0, 0);
        break;
      case "weekly":
        nextUpdate.setDate(nextUpdate.getDate() + 7);
        nextUpdate.setHours(0, 0, 0, 0);
        break;
      case "monthly":
        nextUpdate.setMonth(nextUpdate.getMonth() + 1);
        nextUpdate.setHours(0, 0, 0, 0);
        break;
      default:
        return "Not scheduled";
    }

    const now = new Date();
    if (nextUpdate < now) {
      return "Update pending...";
    }

    // Format the next update time
    const timeUntil = nextUpdate - now;
    const hoursUntil = Math.floor(timeUntil / (1000 * 60 * 60));
    const minutesUntil = Math.floor(
      (timeUntil % (1000 * 60 * 60)) / (1000 * 60)
    );

    if (hoursUntil < 24) {
      if (hoursUntil === 0) {
        return `in ${minutesUntil} minutes`;
      } else {
        return `in ${hoursUntil}h ${minutesUntil}m`;
      }
    } else {
      const days = Math.floor(hoursUntil / 24);
      if (days === 1) {
        return "tomorrow";
      } else {
        return `in ${days} days`;
      }
    }
  }

  // Update the UI with next update time
  async function updateNextUpdateStatus() {
    try {
      const stats = await browser.storage.local.get({
        lastUpdated: null,
      });
      const settings = await browser.storage.sync.get({
        updateFrequency: "daily",
      });

      const nextUpdateText = calculateNextUpdate(
        stats.lastUpdated,
        settings.updateFrequency
      );

      if (updateStatus) {
        updateStatus.innerHTML = `
                <svg class="update-icon" viewBox="0 0 24 24" width="16" height="16">
                    <path fill="currentColor" d="M12 4V2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12H20C20 16.418 16.418 20 12 20C7.582 20 4 16.418 4 12C4 7.582 7.582 4 12 4Z"/>
                </svg>
                Next update ${nextUpdateText}
            `;
      }
    } catch (error) {
      console.error("Error updating next update status:", error);
      if (updateStatus) {
        updateStatus.textContent = "Unable to check next update time";
      }
    }
  }

  // Load filterlist stats
  async function loadFilterlistStats() {
    try {
      const stats = await browser.storage.local.get({
        unsafeFilterCount: 0,
        potentiallyUnsafeFilterCount: 0,
        safeSiteCount: 0,
        lastUpdated: null,
      });

      console.log("Fetched stats:", stats);

      document.getElementById("unsafeFilterCount").textContent =
        stats.unsafeFilterCount;
      document.getElementById("potentiallyUnsafeFilterCount").textContent =
        stats.potentiallyUnsafeFilterCount;
      document.getElementById("safeSiteCount").textContent =
        stats.safeSiteCount;
      document.getElementById("lastUpdated").textContent = formatDate(
        stats.lastUpdated
      );

      // Update the next update status
      await updateNextUpdateStatus();
    } catch (error) {
      console.error("Error loading filterlist stats:", error);
      document.getElementById("unsafeFilterCount").textContent = "Error";
      document.getElementById("potentiallyUnsafeFilterCount").textContent =
        "Error";
      document.getElementById("safeSiteCount").textContent = "Error";
      document.getElementById("lastUpdated").textContent = "Error";
    }
  }

  // Load settings function
  async function loadSettings() {
    try {
      const savedSettings = await browser.storage.sync.get({
        theme: "system",
        warningPage: true,
        updateFrequency: "daily",
      });

      if (themeSelect) themeSelect.value = savedSettings.theme;
      if (warningToggle) warningToggle.checked = savedSettings.warningPage;
      if (updateFrequency)
        updateFrequency.value = savedSettings.updateFrequency;

      // Apply theme
      applyTheme(savedSettings.theme);

      // Load filterlist stats after settings are loaded
      await loadFilterlistStats();
    } catch (error) {
      console.error("Error loading settings:", error);
      showNotification("Error loading settings", true);
    }
  }

  // Show notification function
  function showNotification(message, isError = false) {
    if (notification) {
      notification.textContent = message;
      if (isError) {
        notification.style.background =
          "linear-gradient(120deg, #ff6b6b, #ff8787)";
      } else {
        notification.style.background =
          "linear-gradient(120deg, var(--accent-purple), var(--accent-blue))";
      }
      notification.classList.add("show");
      setTimeout(() => {
        notification.classList.remove("show");
      }, 3000);
    }
  }

  // Save settings function
  async function saveSettings() {
    try {
      const settings = {
        theme: themeSelect.value,
        warningPage: warningToggle.checked,
        updateFrequency: updateFrequency.value,
      };

      await browser.storage.sync.set(settings);

      // Show success notification
      showNotification("Settings saved successfully!");

      // Apply theme immediately
      applyTheme(settings.theme);

      // Update next update status
      await updateNextUpdateStatus();

      // Notify background script about settings change
      await browser.runtime.sendMessage({
        type: "settingsUpdated",
        settings: settings,
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      showNotification("Error saving settings", true);
    }
  }

  // Event Listeners
  if (saveButton) {
    saveButton.addEventListener("click", saveSettings);
  }

  if (themeSelect) {
    themeSelect.addEventListener("change", (e) => {
      applyTheme(e.target.value);
    });
  }

  // System theme change listener
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (e) => {
      if (themeSelect && themeSelect.value === "system") {
        applyTheme("system");
      }
    });

  // Listen for filterlist updates from background script
  browser.runtime.onMessage.addListener((message) => {
    if (message.type === "filterlistUpdated") {
      loadFilterlistStats();
    }
  });

  // Update the status every minute
  setInterval(updateNextUpdateStatus, 60000);

  // Load settings when page loads
  loadSettings();
});