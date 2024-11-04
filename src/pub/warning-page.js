document.addEventListener("DOMContentLoaded", () => {
  // Cross-browser compatibility shim
  const browserAPI = typeof browser !== "undefined" ? browser : chrome;

  const urlParams = new URLSearchParams(window.location.search);
  const unsafeUrl = urlParams.get("url") || "unknown site";
  document.getElementById("unsafeUrl").textContent = unsafeUrl;
  console.log(`Warning page loaded for URL: ${unsafeUrl}`);

  document.getElementById("goBack").addEventListener("click", () => {
    console.log("User clicked Go Back.");
    // Go back twice to skip over the warning page
    window.history.go(-2);
  });

  document.getElementById("proceed").addEventListener("click", async () => {
    if (confirm("Are you sure you want to proceed? This site may be unsafe.")) {
      const [tab] = await browserAPI.tabs.query({
        active: true,
        currentWindow: true,
      });

      console.log(`Sending proceedAnyway message for tab ${tab.id}`);
      await browserAPI.runtime.sendMessage({
        action: "proceedAnyway",
        tabId: tab.id,
      });

      console.log("Proceed flag set, navigating to unsafe URL...");
      await browserAPI.tabs.update(tab.id, { url: unsafeUrl });
    }
  });
});
