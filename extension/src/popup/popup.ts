// ============================================
// XEROVA Browser Guard — Popup Controller
// ============================================
// Manages the popup UI state machine and user interactions.
// States: idle → loading → success/error

import { analyzeURL, validateURL, AnalysisError } from "../shared/api.js";
import { CONFIG, xerovaURL, fullInvestigationURL } from "../shared/config.js";
import type { URLAnalysisResult, RiskFactor, AnalysisState } from "../shared/types.js";

// --- DOM References ---
const $ = (id: string) => document.getElementById(id)!;

// State sections
const stateIdle = $("state-idle");
const stateLoading = $("state-loading");
const stateResult = $("state-result");
const stateError = $("state-error");
const stateInvalid = $("state-invalid");

// UI elements
const currentURLEl = $("current-url");
const btnAnalyze = $("btn-analyze");
const btnRetry = $("btn-retry");
const btnOpenXerovaError = $("btn-open-xerova-error");
const btnFullInvestigation = $("btn-full-investigation");
const btnReanalyze = $("btn-reanalyze");
const errorMessageEl = $("error-message");
const invalidMessageEl = $("invalid-message");

// Result elements
const scoreNumberEl = $("score-number");
const scoreCircleEl = $("score-circle") as unknown as SVGCircleElement;
const verdictBadgeEl = $("verdict-badge");
const riskFactorsSection = $("risk-factors-section");
const riskFactorsList = $("risk-factors-list");
const sourcesSection = $("sources-section");
const sourcesList = $("sources-list");
const linkPrivacy = $("link-privacy");

// --- State ---
let currentTabURL = "";
let currentState: AnalysisState = "idle";

// ============================================
// Initialization
// ============================================

document.addEventListener("DOMContentLoaded", async () => {
  // Get current tab URL
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];

    if (tab?.url) {
      currentTabURL = tab.url;
      displayURL(currentTabURL);

      // Validate the URL
      const validation = validateURL(currentTabURL);
      if (!validation.valid) {
        showInvalid(validation.error || "This page cannot be analyzed.");
        return;
      }

      // Check cache for recent result
      const cached = await getCachedResult(currentTabURL);
      if (cached) {
        showResult(cached);
        return;
      }

      showIdle();
    } else {
      displayURL("—");
      showInvalid("Unable to detect the current page URL.");
    }
  } catch {
    displayURL("—");
    showInvalid("Unable to access the current tab.");
  }

  // --- Event Listeners ---
  btnAnalyze.addEventListener("click", handleAnalyze);
  btnRetry.addEventListener("click", handleAnalyze);
  btnReanalyze.addEventListener("click", handleAnalyze);
  btnOpenXerovaError.addEventListener("click", () => openXerovaURL("/"));
  btnFullInvestigation.addEventListener("click", handleFullInvestigation);
  linkPrivacy.addEventListener("click", (e) => {
    e.preventDefault();
    openXerovaURL(CONFIG.ROUTES.BROWSER_GUARD);
  });

  // Tool items
  document.querySelectorAll(".tool-item").forEach((item) => {
    item.addEventListener("click", () => {
      const route = (item as HTMLElement).dataset.route;
      if (route) openXerovaURL(route);
    });
  });
});

// ============================================
// State Management
// ============================================

function setState(state: AnalysisState) {
  currentState = state;
  stateIdle.classList.toggle("hidden", state !== "idle");
  stateLoading.classList.toggle("hidden", state !== "loading");
  stateResult.classList.toggle("hidden", state !== "success");
  stateError.classList.toggle("hidden", state !== "error");
  stateInvalid.classList.add("hidden");
}

function showIdle() {
  setState("idle");
}

function showLoading() {
  setState("loading");
}

function showResult(result: URLAnalysisResult) {
  setState("success");
  renderResult(result);
}

function showError(message: string) {
  setState("error");
  errorMessageEl.textContent = message;
  stateError.classList.add("animate-in");
}

function showInvalid(message: string) {
  stateIdle.classList.add("hidden");
  stateLoading.classList.add("hidden");
  stateResult.classList.add("hidden");
  stateError.classList.add("hidden");
  stateInvalid.classList.remove("hidden");
  invalidMessageEl.textContent = message;
}

// ============================================
// Analysis
// ============================================

async function handleAnalyze() {
  if (!currentTabURL || currentState === "loading") return;

  showLoading();

  try {
    const result = await analyzeURL(currentTabURL);

    // Cache the result
    await cacheResult(currentTabURL, result);

    showResult(result);
  } catch (err) {
    if (err instanceof AnalysisError) {
      showError(err.message);
    } else {
      showError("An unexpected error occurred during analysis.");
    }
  }
}

// ============================================
// Result Rendering
// ============================================

function renderResult(result: URLAnalysisResult) {
  // --- Score Ring ---
  const score = Math.max(0, Math.min(100, result.riskScore));
  const circumference = 2 * Math.PI * 52; // r=52
  const offset = circumference - (score / 100) * circumference;

  scoreNumberEl.textContent = String(score);
  scoreCircleEl.style.strokeDasharray = String(circumference);
  scoreCircleEl.style.strokeDashoffset = String(offset);

  // Score color based on severity
  const scoreColor = getScoreColor(score);
  scoreCircleEl.style.stroke = scoreColor;
  scoreNumberEl.style.color = scoreColor;

  // --- Verdict Badge ---
  verdictBadgeEl.textContent = result.verdict;
  verdictBadgeEl.className = "verdict-badge";
  switch (result.verdict) {
    case "SAFE":
      verdictBadgeEl.classList.add("verdict-safe");
      break;
    case "SUSPICIOUS":
      verdictBadgeEl.classList.add("verdict-suspicious");
      break;
    case "MALICIOUS":
      verdictBadgeEl.classList.add("verdict-malicious");
      break;
  }

  // --- Risk Factors ---
  const topFactors = getTopRiskFactors(result.riskFactors, result.findings);
  if (topFactors.length > 0) {
    riskFactorsSection.classList.remove("hidden");
    riskFactorsList.innerHTML = "";
    for (const factor of topFactors) {
      riskFactorsList.appendChild(createRiskFactorEl(factor));
    }
  } else {
    riskFactorsSection.classList.add("hidden");
  }

  // --- Sources ---
  if (result.sources && result.sources.length > 0) {
    sourcesSection.classList.remove("hidden");
    sourcesList.innerHTML = "";
    for (const source of result.sources) {
      const badge = document.createElement("span");
      badge.className = "source-badge";
      badge.textContent = source;
      sourcesList.appendChild(badge);
    }
  } else {
    sourcesSection.classList.add("hidden");
  }

  // Animate in
  stateResult.classList.add("animate-in");
}

function getTopRiskFactors(
  riskFactors: RiskFactor[],
  findings: URLAnalysisResult["findings"]
): Array<{ text: string; severity: string; source: string }> {
  const items: Array<{ text: string; severity: string; source: string }> = [];

  // Add risk factors
  for (const rf of riskFactors.slice(0, 6)) {
    items.push({
      text: rf.reason,
      severity: rf.severity,
      source: rf.source,
    });
  }

  // Add findings if we haven't hit limit
  if (items.length < 6) {
    for (const finding of findings.slice(0, 6 - items.length)) {
      // Avoid duplicates
      const isDupe = items.some(
        (i) => i.text.toLowerCase() === finding.description.toLowerCase()
      );
      if (!isDupe) {
        items.push({
          text: finding.description,
          severity: finding.severity,
          source: finding.category,
        });
      }
    }
  }

  return items.slice(0, 8);
}

function createRiskFactorEl(factor: {
  text: string;
  severity: string;
  source: string;
}): HTMLElement {
  const item = document.createElement("div");
  item.className = "risk-factor-item";

  const icon = document.createElement("span");
  icon.className = `risk-factor-icon severity-${factor.severity.toLowerCase()}`;
  icon.textContent = getSeverityIcon(factor.severity);

  const content = document.createElement("div");
  content.style.flex = "1";

  const text = document.createElement("div");
  text.className = "risk-factor-text";
  text.textContent = factor.text;

  const source = document.createElement("div");
  source.className = "risk-factor-source";
  source.textContent = factor.source;

  content.appendChild(text);
  content.appendChild(source);
  item.appendChild(icon);
  item.appendChild(content);

  return item;
}

function getSeverityIcon(severity: string): string {
  switch (severity.toUpperCase()) {
    case "CRITICAL":
      return "🔴";
    case "HIGH":
      return "🟠";
    case "MEDIUM":
      return "🟡";
    case "LOW":
      return "🔵";
    default:
      return "⚪";
  }
}

function getScoreColor(score: number): string {
  if (score >= 75) return "#f43f5e"; // critical
  if (score >= 50) return "#fb923c"; // high
  if (score >= 25) return "#facc15"; // medium
  return "#34d399"; // safe
}

// ============================================
// URL Display
// ============================================

function displayURL(url: string) {
  try {
    if (url === "—" || !url) {
      currentURLEl.textContent = "—";
      return;
    }
    const parsed = new URL(url);
    // Show hostname + truncated path for readability
    let display = parsed.hostname;
    if (parsed.pathname && parsed.pathname !== "/") {
      const path = parsed.pathname;
      display += path.length > 40 ? path.slice(0, 40) + "…" : path;
    }
    currentURLEl.textContent = display;
    currentURLEl.title = url;
  } catch {
    currentURLEl.textContent = url.slice(0, 60);
    currentURLEl.title = url;
  }
}

// ============================================
// Navigation
// ============================================

function openXerovaURL(path: string) {
  chrome.tabs.create({ url: xerovaURL(path) });
}

function handleFullInvestigation() {
  if (!currentTabURL) return;
  chrome.tabs.create({ url: fullInvestigationURL(currentTabURL) });
}

// ============================================
// Caching
// ============================================

interface CacheEntry {
  url: string;
  result: URLAnalysisResult;
  timestamp: number;
}

async function getCachedResult(url: string): Promise<URLAnalysisResult | null> {
  try {
    const data = await chrome.storage.local.get("analysisCache");
    const cache: CacheEntry[] = data.analysisCache || [];
    const entry = cache.find((e) => e.url === url);

    if (entry && Date.now() - entry.timestamp < CONFIG.CACHE_TTL_MS) {
      return entry.result;
    }

    return null;
  } catch {
    return null;
  }
}

async function cacheResult(url: string, result: URLAnalysisResult): Promise<void> {
  try {
    const data = await chrome.storage.local.get("analysisCache");
    let cache: CacheEntry[] = data.analysisCache || [];

    // Remove existing entry for this URL
    cache = cache.filter((e) => e.url !== url);

    // Add new entry
    cache.unshift({ url, result, timestamp: Date.now() });

    // Trim to max size
    if (cache.length > CONFIG.MAX_CACHED_RESULTS) {
      cache = cache.slice(0, CONFIG.MAX_CACHED_RESULTS);
    }

    await chrome.storage.local.set({ analysisCache: cache });
  } catch {
    // Non-critical — continue without caching
  }
}
