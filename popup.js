const COMMONSTACK_API_URL = "https://api.commonstack.ai/v1/chat/completions";
const COMMONSTACK_API_KEY = "ak-e43c64d16d145039c30a480655f3930f4ec297203527000bf7caa182846c4a58";

const statusEl = document.getElementById("status");
const statusMessageEl = document.getElementById("status-message");
const resultEl = document.getElementById("vibe-result");
const statusBadgeEl = document.getElementById("status-badge");
const selectionPreviewEl = document.getElementById("selection-preview");
const selectionCountEl = document.getElementById("selection-count");
const analyzeButtonEl = document.getElementById("analyze-button");
const refreshButtonEl = document.getElementById("refresh-button");
const showVibeButtonEl = document.getElementById("show-vibe-button");
const showSourceButtonEl = document.getElementById("show-source-button");
const dataStatusEl = document.getElementById("data-status");
const statusDotEl = document.querySelector(".status-dot");
const tabButtons = Array.from(document.querySelectorAll(".tab-button"));
const panels = Array.from(document.querySelectorAll("[data-panel]"));

let latestSelection = "";

function setStatus(message, hidden = false) {
  statusMessageEl.textContent = message;
  statusEl.classList.toggle("hidden", hidden);
}

function setResult(message) {
  resultEl.textContent = message;
}

function setBadge(message) {
  statusBadgeEl.textContent = message;
  dataStatusEl.textContent = message;

  const isIdle = message.toLowerCase() === "idle";
  statusBadgeEl.classList.toggle("is-idle", isIdle);
  dataStatusEl.classList.toggle("is-idle", isIdle);
  statusDotEl.classList.toggle("is-idle", isIdle);
}

function setSelectionPreview(text) {
  latestSelection = text;
  selectionPreviewEl.textContent = text || "No text captured yet.";
  selectionCountEl.textContent = `${text.length} CHARS`;
}

function setLoadingState(isLoading) {
  analyzeButtonEl.disabled = isLoading;
  analyzeButtonEl.textContent = isLoading ? "Analyzing..." : "Analyze Selection";
  setBadge(isLoading ? "Live" : latestSelection ? "Ready" : "Idle");
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

async function getHighlightedText(tabId) {
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => window.getSelection().toString().trim(),
  });

  return result;
}

async function fetchVibeAnalysis(text) {
  if (!COMMONSTACK_API_KEY) {
    throw new Error("Add your Commonstack API key in popup.js before testing.");
  }

  const response = await fetch(COMMONSTACK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${COMMONSTACK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an internet anthropologist. Read the highlighted text and describe its vibe in one short, sarcastic, Gen-Z sentence. Keep it under 15 words.",
        },
        {
          role: "user",
          content: text,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Commonstack request failed with status ${response.status}.`);
  }

  const data = await response.json();
  return (
    data?.choices?.[0]?.message?.content ||
    data?.output_text ||
    "No vibe detected."
  );
}

async function run() {
  try {
    setLoadingState(true);
    setStatus("Reading highlighted text...");

    const activeTab = await getActiveTab();
    if (!activeTab?.id) {
      throw new Error("No active tab found.");
    }

    const selectedText = await getHighlightedText(activeTab.id);
    if (!selectedText) {
      throw new Error("Highlight some text first, then open the extension.");
    }

    setSelectionPreview(selectedText);
    setStatus("Analyzing...");
    setResult("Thinking...");

    const vibe = await fetchVibeAnalysis(selectedText);
    setResult(vibe);
    setStatus("", true);
    setBadge("Ready");
  } catch (error) {
    setResult(error.message || "Something went wrong.");
    setStatus("", true);
    setBadge("Error");
  } finally {
    setLoadingState(false);
  }
}

function activateTab(nextTab) {
  tabButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.tab === nextTab);
  });

  panels.forEach((panel) => {
    panel.classList.toggle("hidden", panel.dataset.panel !== nextTab);
  });
}

tabButtons.forEach((button) => {
  button.addEventListener("click", () => activateTab(button.dataset.tab));
});

analyzeButtonEl.addEventListener("click", run);
refreshButtonEl.addEventListener("click", run);
showVibeButtonEl.addEventListener("click", () => activateTab("vibe"));
showSourceButtonEl.addEventListener("click", () => activateTab("source"));

setBadge("Idle");
