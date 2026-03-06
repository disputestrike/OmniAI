// OmniMarket AI Chrome Extension - Popup Script

const API_BASE = "https://omnimarket-qkdagqf5.manus.space";

document.addEventListener("DOMContentLoaded", async () => {
  const connectBtn = document.getElementById("connect-btn");
  const notConnected = document.getElementById("not-connected");
  const connected = document.getElementById("connected");
  const authStatus = document.getElementById("auth-status");
  const openDashboard = document.getElementById("open-dashboard");
  const openSettings = document.getElementById("open-settings");

  // Check connection status
  const { apiUrl } = await chrome.storage.sync.get("apiUrl");
  const { sessionToken } = await chrome.storage.sync.get("sessionToken");

  if (sessionToken) {
    showConnected();
  }

  function showConnected() {
    notConnected.classList.add("hidden");
    connected.classList.remove("hidden");
    authStatus.textContent = "Connected";
    authStatus.className = "auth-badge connected";
  }

  function showNotConnected() {
    notConnected.classList.remove("hidden");
    connected.classList.add("hidden");
    authStatus.textContent = "Not Connected";
    authStatus.className = "auth-badge disconnected";
  }

  // Connect account
  connectBtn.addEventListener("click", () => {
    const baseUrl = apiUrl || API_BASE;
    chrome.tabs.create({ url: `${baseUrl}/dashboard` });
  });

  // Quick actions
  document.getElementById("analyze-page").addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      const baseUrl = apiUrl || API_BASE;
      chrome.tabs.create({ url: `${baseUrl}/intelligence?url=${encodeURIComponent(tab.url)}` });
    }
  });

  document.getElementById("extract-product").addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, { action: "extractProduct" }, (response) => {
      if (response?.data) {
        const baseUrl = apiUrl || API_BASE;
        const params = new URLSearchParams({
          name: response.data.title || "",
          url: tab.url || "",
          description: response.data.description || "",
        });
        chrome.tabs.create({ url: `${baseUrl}/products?import=${params.toString()}` });
      }
    });
  });

  document.getElementById("competitor-spy").addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      const baseUrl = apiUrl || API_BASE;
      chrome.tabs.create({ url: `${baseUrl}/competitor-spy?url=${encodeURIComponent(tab.url)}` });
    }
  });

  document.getElementById("generate-content").addEventListener("click", () => {
    const baseUrl = apiUrl || API_BASE;
    chrome.tabs.create({ url: `${baseUrl}/content` });
  });

  document.getElementById("seo-audit").addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      const baseUrl = apiUrl || API_BASE;
      chrome.tabs.create({ url: `${baseUrl}/seo-audits?url=${encodeURIComponent(tab.url)}` });
    }
  });

  document.getElementById("save-lead").addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, { action: "extractContact" }, (response) => {
      if (response?.data) {
        const baseUrl = apiUrl || API_BASE;
        const params = new URLSearchParams({
          name: response.data.name || "",
          email: response.data.email || "",
          source: tab.url || "",
        });
        chrome.tabs.create({ url: `${baseUrl}/leads?import=${params.toString()}` });
      }
    });
  });

  // Check for selected text
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "getSelectedText" }, (response) => {
        if (response?.text && response.text.trim()) {
          const section = document.getElementById("selected-text-section");
          const preview = document.getElementById("selected-text-preview");
          section.classList.remove("hidden");
          preview.textContent = response.text.substring(0, 200) + (response.text.length > 200 ? "..." : "");

          document.getElementById("remix-text").addEventListener("click", () => {
            const baseUrl = apiUrl || API_BASE;
            chrome.tabs.create({ url: `${baseUrl}/content?remix=${encodeURIComponent(response.text)}` });
          });

          document.getElementById("translate-text").addEventListener("click", () => {
            const baseUrl = apiUrl || API_BASE;
            chrome.tabs.create({ url: `${baseUrl}/translate?text=${encodeURIComponent(response.text)}` });
          });

          document.getElementById("improve-text").addEventListener("click", () => {
            const baseUrl = apiUrl || API_BASE;
            chrome.tabs.create({ url: `${baseUrl}/ai-agents?prompt=${encodeURIComponent("Improve this content: " + response.text)}` });
          });
        }
      });
    }
  });

  // Footer links
  openDashboard.addEventListener("click", (e) => {
    e.preventDefault();
    const baseUrl = apiUrl || API_BASE;
    chrome.tabs.create({ url: `${baseUrl}/dashboard` });
  });

  openSettings.addEventListener("click", (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });

  // Load recent activity
  const { recentActivity } = await chrome.storage.local.get("recentActivity");
  if (recentActivity && recentActivity.length > 0) {
    const list = document.getElementById("recent-activity");
    list.innerHTML = recentActivity.slice(0, 5).map(item =>
      `<div class="activity-item">
        <span>${item.icon}</span>
        <span>${item.text}</span>
      </div>`
    ).join("");
  }
});
