// OTOBI AI Chrome Extension - Content Script

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case "getSelectedText": {
      const text = window.getSelection()?.toString() || "";
      sendResponse({ text });
      break;
    }

    case "extractProduct": {
      const data = extractProductData();
      sendResponse({ data });
      break;
    }

    case "extractContact": {
      const data = extractContactData();
      sendResponse({ data });
      break;
    }

    case "getPageMeta": {
      const data = extractPageMeta();
      sendResponse({ data });
      break;
    }
  }
  return true;
});

// Extract product data from the current page
function extractProductData() {
  const title = document.querySelector('meta[property="og:title"]')?.content
    || document.querySelector('h1')?.textContent?.trim()
    || document.title;

  const description = document.querySelector('meta[property="og:description"]')?.content
    || document.querySelector('meta[name="description"]')?.content
    || document.querySelector('[itemprop="description"]')?.textContent?.trim()
    || "";

  const image = document.querySelector('meta[property="og:image"]')?.content
    || document.querySelector('[itemprop="image"]')?.src
    || document.querySelector('img[alt*="product"]')?.src
    || "";

  const price = document.querySelector('[itemprop="price"]')?.content
    || document.querySelector('.price')?.textContent?.trim()
    || document.querySelector('[class*="price"]')?.textContent?.trim()
    || "";

  const brand = document.querySelector('[itemprop="brand"]')?.textContent?.trim()
    || document.querySelector('meta[property="product:brand"]')?.content
    || "";

  return { title, description, image, price, brand, url: window.location.href };
}

// Extract contact/lead data from the current page
function extractContactData() {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const phoneRegex = /[\+]?[(]?[0-9]{1,4}[)]?[-\s\./0-9]{7,15}/g;

  const bodyText = document.body.innerText;
  const emails = bodyText.match(emailRegex) || [];
  const phones = bodyText.match(phoneRegex) || [];

  const name = document.querySelector('meta[property="og:site_name"]')?.content
    || document.querySelector('meta[name="author"]')?.content
    || document.title.split(/[-|–]/)[0].trim();

  const company = document.querySelector('meta[property="og:site_name"]')?.content
    || new URL(window.location.href).hostname.replace("www.", "");

  return {
    name,
    company,
    email: emails[0] || "",
    phone: phones[0] || "",
    url: window.location.href,
  };
}

// Extract page metadata
function extractPageMeta() {
  const meta = {};
  document.querySelectorAll("meta").forEach((el) => {
    const name = el.getAttribute("name") || el.getAttribute("property");
    if (name) meta[name] = el.content;
  });

  const headings = [];
  document.querySelectorAll("h1, h2, h3").forEach((el) => {
    headings.push({ tag: el.tagName, text: el.textContent?.trim() });
  });

  const links = [];
  document.querySelectorAll("a[href]").forEach((el) => {
    if (el.href && !el.href.startsWith("javascript:")) {
      links.push({ text: el.textContent?.trim(), href: el.href });
    }
  });

  return {
    title: document.title,
    url: window.location.href,
    meta,
    headings: headings.slice(0, 20),
    linkCount: links.length,
    wordCount: document.body.innerText.split(/\s+/).length,
  };
}
