/**
 * PennyWise Prototype - Results Page Controller & Live Crawler Consumer
 * Styled with Pigeon's Mission Design System (Retro Arcade + Neo-Brutalism)
 * Connects directly to FastAPI Backend (/api/search)
 */

document.addEventListener("DOMContentLoaded", () => {
  // Main DOM Elements
  const queryDisplay = document.getElementById("query-display");
  const countText = document.getElementById("results-count-text");
  const cardsContainer = document.getElementById("cards-container");
  const sortSelect = document.getElementById("sort-select");
  const resultsSearchForm = document.getElementById("results-search-form");
  const resultsSearchInput = document.getElementById("results-search-input");
  const btnSearchSubmit = document.getElementById("btn-search-submit");

  // State Containers
  const stateResults = document.getElementById("state-results");
  const stateLoading = document.getElementById("state-loading");
  const stateEmpty = document.getElementById("state-empty");
  const stateError = document.getElementById("state-error");
  const errorMessageText = document.getElementById("error-message-text");
  const bestDealSummary = document.getElementById("best-deal-summary");
  const savingsTag = document.getElementById("savings-tag");

  // Crawler Status & Metrics Elements
  const crawlerStatusDot = document.getElementById("crawler-status-dot");
  const crawlerStatusLabel = document.getElementById("crawler-status-label");
  const chipDuration = document.getElementById("chip-duration");
  const chipCrawled = document.getElementById("chip-crawled");
  const chipCache = document.getElementById("chip-cache");
  const btnForceRefresh = document.getElementById("btn-force-refresh");
  const btnRetry = document.getElementById("btn-retry-search");
  const btnEmptyRetry = document.getElementById("btn-empty-retry");

  // Crawler Inspector Elements
  const btnToggleInspector = document.getElementById("btn-toggle-inspector");
  const btnCloseInspector = document.getElementById("btn-close-inspector");
  const inspectorBtnText = document.getElementById("inspector-btn-text");
  const crawlerInspectorPanel = document.getElementById("crawler-inspector-panel");
  const tabBtnLogs = document.getElementById("tab-btn-logs");
  const tabBtnJson = document.getElementById("tab-btn-json");
  const tabContentLogs = document.getElementById("tab-content-logs");
  const tabContentJson = document.getElementById("tab-content-json");
  const crawlerLogsTbody = document.getElementById("crawler-logs-tbody");
  const rawJsonViewer = document.getElementById("raw-json-viewer");
  const btnCopyJson = document.getElementById("btn-copy-json");

  // Quick Tags
  const quickTags = document.querySelectorAll(".quick-tag");

  // Internal State
  let currentResults = [];
  let currentPayload = null;
  let currentQuery = "";
  let isInspectorOpen = false;

  // Format PKR Currency
  function formatPKR(num) {
    if (num === null || num === undefined || isNaN(num)) return "Price on Store";
    return "Rs. " + Number(num).toLocaleString("en-PK");
  }

  // Parse Initial Query String from URL
  const urlParams = new URLSearchParams(window.location.search);
  currentQuery = (urlParams.get("q") || "iPhone 15").trim();

  if (resultsSearchInput) {
    resultsSearchInput.value = currentQuery;
  }

  // UI State Switcher
  function showState(state) {
    stateResults.classList.add("hidden");
    stateLoading.classList.add("hidden");
    stateEmpty.classList.add("hidden");
    stateError.classList.add("hidden");

    if (state === "loading") {
      stateLoading.classList.remove("hidden");
      crawlerStatusDot.className = "w-3 h-3 rounded-full bg-[#F5B72B] border-2 border-[#221636] animate-ping";
      crawlerStatusLabel.textContent = "CRAWLING STORES...";
      if (btnSearchSubmit) btnSearchSubmit.disabled = true;
    } else if (state === "empty") {
      stateEmpty.classList.remove("hidden");
      crawlerStatusDot.className = "w-3 h-3 rounded-full bg-gray-400 border-2 border-[#221636]";
      crawlerStatusLabel.textContent = "COMPLETED (0 FOUND)";
      if (btnSearchSubmit) btnSearchSubmit.disabled = false;
    } else if (state === "error") {
      stateError.classList.remove("hidden");
      crawlerStatusDot.className = "w-3 h-3 rounded-full bg-[#EE2D2B] border-2 border-[#221636]";
      crawlerStatusLabel.textContent = "ERROR";
      if (btnSearchSubmit) btnSearchSubmit.disabled = false;
    } else {
      stateResults.classList.remove("hidden");
      crawlerStatusDot.className = "w-3 h-3 rounded-full bg-[#96D4C7] border-2 border-[#221636]";
      crawlerStatusLabel.textContent = "CRAWL COMPLETE";
      if (btnSearchSubmit) btnSearchSubmit.disabled = false;
    }
  }

  // Update Metrics Bar
  function updateMetrics(payload) {
    if (!payload || !payload.crawler_metrics) {
      chipDuration.textContent = "⏱ --";
      chipCrawled.textContent = "🌐 0 Pages";
      chipCache.textContent = payload && payload.cached ? "⚡ Memory Cached" : "⚡ Fresh Crawl";
      return;
    }

    const metrics = payload.crawler_metrics;
    const durSec = (metrics.total_duration_ms / 1000).toFixed(1);
    chipDuration.textContent = `⏱ ${durSec}s (${metrics.total_duration_ms}ms)`;
    chipCrawled.textContent = `🌐 ${metrics.successful_extractions}/${metrics.pages_crawled} Extracted`;
    
    if (payload.cached) {
      chipCache.className = "pm-tag pm-tag-white py-1 px-3 text-[11px]";
      chipCache.textContent = "💾 Memory Cached";
    } else {
      chipCache.className = "pm-tag pm-tag-sky py-1 px-3 text-[11px]";
      chipCache.textContent = "⚡ Fresh Live Crawl";
    }
  }

  // Update Inspector Diagnostics & Logs
  function updateInspector(payload) {
    if (!payload) return;

    // 1. Raw JSON
    rawJsonViewer.textContent = JSON.stringify(payload, null, 2);

    // 2. Log Table
    const logs = payload.crawler_metrics ? payload.crawler_metrics.logs : [];
    if (!logs || logs.length === 0) {
      crawlerLogsTbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-gray-400">No URL logs available for this query.</td></tr>`;
      return;
    }

    crawlerLogsTbody.innerHTML = "";
    logs.forEach((log) => {
      const tr = document.createElement("tr");
      tr.className = "hover:bg-[#221636] border-b border-[#4C4066] transition-colors";

      const statusBadge = log.http_status === 200
        ? `<span class="text-[#96D4C7] font-bold">200 OK</span>`
        : `<span class="text-[#EE2D2B] font-bold">${log.http_status || "Failed"}</span>`;

      const methodBadge = log.method
        ? `<span class="bg-[#F5B72B] text-[#221636] px-2 py-0.5 font-bold rounded-sm text-[10px] border border-[#221636]">${escapeHtml(log.method)}</span>`
        : `<span class="text-gray-500 text-[10px]">None</span>`;

      const priceText = log.price ? formatPKR(log.price) : `<span class="text-gray-500">N/A</span>`;
      const titleSnippet = log.title ? escapeHtml(log.title.substring(0, 45)) : `<span class="text-gray-400">${escapeHtml(log.error || "No match")}</span>`;

      tr.innerHTML = `
        <td class="p-3 font-bold text-white">${escapeHtml(log.store || "Unknown")}</td>
        <td class="p-3">${statusBadge}</td>
        <td class="p-3">${methodBadge}</td>
        <td class="p-3 text-gray-200">
          <div class="font-bold text-white text-xs">${priceText}</div>
          <div class="text-[10px] text-gray-400 truncate max-w-xs">${titleSnippet}</div>
        </td>
        <td class="p-3 text-[#BBDCF4]">${log.duration_ms || 0}ms</td>
        <td class="p-3">
          <a href="${escapeHtml(log.url)}" target="_blank" rel="noopener noreferrer" class="text-[#BBDCF4] hover:text-white hover:underline flex items-center gap-1 font-bold" title="${escapeHtml(log.url)}">
            <span>Link ↗</span>
          </a>
        </td>
      `;
      crawlerLogsTbody.appendChild(tr);
    });
  }

  // Render Product Cards as Tactile Polaroid Sketchbook Cards
  function renderCards(items) {
    cardsContainer.innerHTML = "";

    if (!items || items.length === 0) {
      showState("empty");
      countText.textContent = "Found 0 verified store listings";
      return;
    }

    showState("normal");
    countText.textContent = `Found ${items.length} verified store listings in Pakistan`;

    // Lowest Price Identification
    const validPrices = items.map(i => i.price).filter(p => p > 0);
    const lowestPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;
    const highestPrice = validPrices.length > 0 ? Math.max(...validPrices) : 0;
    const cheapestItem = items.find(i => i.price === lowestPrice);

    // Update Deal Banner
    if (cheapestItem) {
      bestDealSummary.textContent = `Lowest price is ${formatPKR(lowestPrice)} at ${cheapestItem.store}`;
      const diff = highestPrice - lowestPrice;
      if (diff > 0) {
        savingsTag.textContent = `Save up to ${formatPKR(diff)}`;
        savingsTag.classList.remove("hidden");
      } else {
        savingsTag.classList.add("hidden");
      }
    }

    // Render Cards
    items.forEach((item, index) => {
      const isLowest = item.price === lowestPrice;
      const card = document.createElement("div");
      // Alternate slight tactile rotation: -1deg on even, 1deg on odd
      const rotation = index % 2 === 0 ? "-1deg" : "1deg";
      
      card.className = `pm-polaroid flex flex-col justify-between ${
        isLowest ? "ring-4 ring-[#F5B72B] bg-[#FFFDF5]" : "bg-white"
      }`;
      card.style.transform = `rotate(${rotation})`;

      // Sticker ranking badge
      const stickerHtml = `
        <div class="pm-sticker-number" style="background:${isLowest ? '#F5B72B' : '#FFFFFF'};">
          ${isLowest ? '★' : index + 1}
        </div>
      `;

      // Washi tape at top center
      const washiHtml = `
        <div class="pm-washi" style="background:${isLowest ? '#F5B72B' : '#96D4C7'};"></div>
      `;

      // Badge logic
      const dealBadge = isLowest 
        ? `<span class="pm-tag pm-tag-gold font-display text-[10px]">★ #1 LOWEST DEAL</span>`
        : `<span class="pm-tag pm-tag-white text-[10px]">VERIFIED STORE</span>`;

      // Extraction strategy tag
      const methodText = item.extraction_method || "JSON-LD";
      const methodBadge = `<span class="pm-tag pm-tag-sky text-[10px]" title="Extracted via ${escapeHtml(methodText)}">${escapeHtml(methodText)}</span>`;

      // Framed Image HTML
      const imageHtml = item.image 
        ? `<div class="w-full h-44 bg-[#F8F7FA] border-2 border-[#221636] rounded-lg mb-3.5 flex items-center justify-center overflow-hidden p-3 relative">
             <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" class="max-h-full max-w-full object-contain" onerror="this.parentElement.style.display='none'">
           </div>`
        : "";

      card.innerHTML = `
        ${stickerHtml}
        ${washiHtml}
        <div>
          <!-- Header: Store Badge & Lowest Price -->
          <div class="flex items-center justify-between gap-2 mb-3.5 pl-6 pt-1">
            <span class="pm-tag pm-tag-mint text-xs font-black">${escapeHtml(item.store)}</span>
            ${dealBadge}
          </div>

          ${imageHtml}

          <!-- Product Title -->
          <h3 class="font-bold text-lg text-[#221636] mb-2.5 line-clamp-2 leading-snug" title="${escapeHtml(item.title)}">
            ${escapeHtml(item.title)}
          </h3>

          <!-- Details & Stock -->
          <div class="text-xs font-semibold text-[#4C4066] mb-4 flex items-center gap-2">
            ${methodBadge}
            <span>•</span>
            <span class="${item.inStock ? "text-[#1C75BC]" : "text-[#EE2D2B]"} font-bold">
              ${item.inStock ? "✓ In Stock" : "Limited / Unknown"}
            </span>
          </div>
        </div>

        <!-- Footer: Price & Direct Store Link -->
        <div class="pt-4 border-t-3 border-[#221636] mt-2">
          <div class="text-[11px] font-bold uppercase tracking-wider text-[#4C4066] mb-0.5">Verified Price in Pakistan</div>
          <div class="font-display text-2xl sm:text-3xl text-[#221636] mb-4">
            ${formatPKR(item.price)}
          </div>

          <a 
            href="${escapeHtml(item.url)}" 
            target="_blank" 
            rel="noopener noreferrer" 
            class="w-full pm-btn ${isLowest ? "pm-btn-primary" : "pm-btn-gold"} py-3.5 text-sm flex items-center justify-center gap-2"
          >
            <span>OPEN ${escapeHtml(item.store).toUpperCase()}</span>
            <svg class="w-4 h-4 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
            </svg>
          </a>
        </div>
      `;

      cardsContainer.appendChild(card);
    });
  }

  // Sort & Render
  function applySortAndRender() {
    const sortVal = sortSelect ? sortSelect.value : "lowest";
    const sorted = [...currentResults].sort((a, b) => {
      return sortVal === "highest" ? b.price - a.price : a.price - b.price;
    });
    renderCards(sorted);
  }

  // Execute Live Real-Time Crawl via FastAPI Endpoint
  async function executeLiveSearch(query, forceRefresh = false) {
    if (!query || query.trim().length < 2) return;

    currentQuery = query.trim();
    queryDisplay.textContent = `"${currentQuery}"`;
    showState("loading");

    try {
      const url = `/api/search?q=${encodeURIComponent(currentQuery)}${forceRefresh ? "&refresh=true" : ""}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Server returned status HTTP ${response.status}`);
      }

      const data = await response.json();
      currentPayload = data;
      currentResults = data.results || [];

      // Update Inspector & Metrics
      updateMetrics(data);
      updateInspector(data);

      if (currentResults.length === 0) {
        showState("empty");
        countText.textContent = "Found 0 verified store listings";
      } else {
        applySortAndRender();
      }
    } catch (err) {
      console.error("Crawler fetch failed:", err);
      errorMessageText.textContent = `Backend crawler encountered an issue: ${err.message}. Please check connection or retry.`;
      showState("error");
    }
  }

  // Search Form Submit
  if (resultsSearchForm && resultsSearchInput) {
    resultsSearchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = resultsSearchInput.value.trim();
      if (q.length >= 2) {
        const newUrl = `${window.location.pathname}?q=${encodeURIComponent(q)}`;
        window.history.pushState({ path: newUrl }, "", newUrl);
        executeLiveSearch(q, false);
      }
    });
  }

  // Force Refresh Button
  if (btnForceRefresh) {
    btnForceRefresh.addEventListener("click", () => {
      executeLiveSearch(currentQuery, true);
    });
  }

  // Retry Buttons
  if (btnRetry) {
    btnRetry.addEventListener("click", () => {
      executeLiveSearch(currentQuery, true);
    });
  }
  if (btnEmptyRetry) {
    btnEmptyRetry.addEventListener("click", () => {
      if (resultsSearchInput) {
        resultsSearchInput.focus();
        resultsSearchInput.select();
      }
    });
  }

  // Quick Search Tags
  quickTags.forEach((btn) => {
    btn.addEventListener("click", () => {
      const q = btn.getAttribute("data-q");
      if (q) {
        if (resultsSearchInput) resultsSearchInput.value = q;
        const newUrl = `${window.location.pathname}?q=${encodeURIComponent(q)}`;
        window.history.pushState({ path: newUrl }, "", newUrl);
        executeLiveSearch(q, false);
      }
    });
  });

  // Sorting Control Change
  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      applySortAndRender();
    });
  }

  // Inspector Panel Toggle
  function toggleInspector(show) {
    isInspectorOpen = typeof show === "boolean" ? show : !isInspectorOpen;
    if (isInspectorOpen) {
      crawlerInspectorPanel.classList.remove("hidden");
      inspectorBtnText.textContent = "HIDE CRAWLER LOGS";
    } else {
      crawlerInspectorPanel.classList.add("hidden");
      inspectorBtnText.textContent = "SHOW CRAWLER LOGS";
    }
  }

  if (btnToggleInspector) {
    btnToggleInspector.addEventListener("click", () => toggleInspector());
  }
  if (btnCloseInspector) {
    btnCloseInspector.addEventListener("click", () => toggleInspector(false));
  }

  // Inspector Tab Switching
  if (tabBtnLogs && tabBtnJson) {
    tabBtnLogs.addEventListener("click", () => {
      tabBtnLogs.className = "pm-btn pm-btn-gold pm-btn-sm";
      tabBtnJson.className = "pm-btn pm-btn-dark pm-btn-sm";
      tabContentLogs.classList.remove("hidden");
      tabContentJson.classList.add("hidden");
    });

    tabBtnJson.addEventListener("click", () => {
      tabBtnJson.className = "pm-btn pm-btn-gold pm-btn-sm";
      tabBtnLogs.className = "pm-btn pm-btn-dark pm-btn-sm";
      tabContentJson.classList.remove("hidden");
      tabContentLogs.classList.add("hidden");
    });
  }

  // Copy Raw JSON to Clipboard
  if (btnCopyJson) {
    btnCopyJson.addEventListener("click", async () => {
      if (!currentPayload) return;
      try {
        await navigator.clipboard.writeText(JSON.stringify(currentPayload, null, 2));
        btnCopyJson.innerHTML = "<span>✓ COPIED JSON!</span>";
        setTimeout(() => {
          btnCopyJson.innerHTML = "<span>📋 COPY RAW JSON</span>";
        }, 2000);
      } catch (err) {
        console.error("Clipboard error:", err);
      }
    });
  }

  // Helper Escape Function
  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Initial Execution on Page Load
  executeLiveSearch(currentQuery, false);
});
