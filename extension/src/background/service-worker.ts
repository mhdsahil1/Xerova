// ============================================
// XEROVA Browser Guard — Background Service Worker
// ============================================
// Manifest V3 service worker for extension lifecycle management.
// Keeps the extension lightweight — no polling, no continuous scanning.

// --- Installation ---
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    console.log("[XEROVA Browser Guard] Extension installed.");

    // Set default settings
    chrome.storage.local.set({
      settings: {
        xerovaBaseURL: "https://xerova-lab.vercel.app",
        cacheEnabled: true,
      },
      analysisCache: [],
    });
  } else if (details.reason === "update") {
    console.log(
      `[XEROVA Browser Guard] Updated to v${chrome.runtime.getManifest().version}`
    );
  }
});

// --- Message Handler ---
// Handles messages from the popup or content scripts (future use).
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "GET_VERSION") {
    sendResponse({ version: chrome.runtime.getManifest().version });
    return true;
  }

  if (message.type === "CLEAR_CACHE") {
    chrome.storage.local.set({ analysisCache: [] }).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }

  return false;
});
