// OTOBI AI Chrome Extension - Background Service Worker

const DEFAULT_API_BASE = "https://omnimarket-qkdagqf5.manus.space";

// Context menu items
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "omnimarket-analyze",
    title: "Analyze with OTOBI AI",
    contexts: ["page", "link"],
  });

  chrome.contextMenus.create({
    id: "omnimarket-remix",
    title: "Remix this content",
    contexts: ["selection"],
  });

  chrome.contextMenus.create({
    id: "omnimarket-translate",
    title: "Translate with OTOBI AI",
    contexts: ["selection"],
  });

  chrome.contextMenus.create({
    id: "omnimarket-generate-ad",
    title: "Generate ad from this text",
    contexts: ["selection"],
  });

  chrome.contextMenus.create({
    id: "omnimarket-save-lead",
    title: "Save page as lead",
    contexts: ["page"],
  });

  chrome.contextMenus.create({
    id: "omnimarket-competitor-spy",
    title: "Spy on this competitor",
    contexts: ["page", "link"],
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const { apiUrl } = await chrome.storage.sync.get("apiUrl");
  const baseUrl = apiUrl || DEFAULT_API_BASE;

  switch (info.menuItemId) {
    case "omnimarket-analyze": {
      const url = info.linkUrl || tab.url;
      chrome.tabs.create({ url: `${baseUrl}/intelligence?url=${encodeURIComponent(url)}` });
      addActivity("🔍", `Analyzed: ${new URL(url).hostname}`);
      break;
    }
    case "omnimarket-remix": {
      if (info.selectionText) {
        chrome.tabs.create({ url: `${baseUrl}/content?remix=${encodeURIComponent(info.selectionText)}` });
        addActivity("✍️", `Remixed content (${info.selectionText.substring(0, 30)}...)`);
      }
      break;
    }
    case "omnimarket-translate": {
      if (info.selectionText) {
        chrome.tabs.create({ url: `${baseUrl}/translate?text=${encodeURIComponent(info.selectionText)}` });
        addActivity("🌐", `Translated content`);
      }
      break;
    }
    case "omnimarket-generate-ad": {
      if (info.selectionText) {
        chrome.tabs.create({ url: `${baseUrl}/content?type=ad_copy_short&context=${encodeURIComponent(info.selectionText)}` });
        addActivity("📢", `Generated ad from selection`);
      }
      break;
    }
    case "omnimarket-save-lead": {
      chrome.tabs.create({ url: `${baseUrl}/leads?source=${encodeURIComponent(tab.url)}` });
      addActivity("👤", `Saved lead from: ${new URL(tab.url).hostname}`);
      break;
    }
    case "omnimarket-competitor-spy": {
      const url = info.linkUrl || tab.url;
      chrome.tabs.create({ url: `${baseUrl}/competitor-spy?url=${encodeURIComponent(url)}` });
      addActivity("🕵️", `Spied on: ${new URL(url).hostname}`);
      break;
    }
  }
});

// Track recent activity
async function addActivity(icon, text) {
  const { recentActivity = [] } = await chrome.storage.local.get("recentActivity");
  recentActivity.unshift({ icon, text, timestamp: Date.now() });
  // Keep only last 20 items
  await chrome.storage.local.set({ recentActivity: recentActivity.slice(0, 20) });
}

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "openDashboard") {
    chrome.storage.sync.get("apiUrl").then(({ apiUrl }) => {
      const baseUrl = apiUrl || DEFAULT_API_BASE;
      chrome.tabs.create({ url: `${baseUrl}/dashboard` });
    });
  }
  return true;
});
