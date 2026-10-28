/**
 * PennyWise - Results Page Controller
 * Connects to FastAPI backend (/api/search)
 */

document.addEventListener("DOMContentLoaded", () => {
  // DOM references
  const queryDisplay     = document.getElementById("query-display");
  const countText        = document.getElementById("results-count-text");
  const cardsContainer   = document.getElementById("cards-container");
  const sortSelect       = document.getElementById("sort-select");
  const resultsSearchForm  = document.getElementById("results-search-form");
  const resultsSearchInput = document.getElementById("results-search-name");
  const resultsSearchBrand = document.getElementById("results-search-brand");
  const btnSearchSubmit    = document.getElementById("btn-search-submit");
  const stateResults = document.getElementById("state-results");
  const stateLoading = document.getElementById("state-loading");
  const stateEmpty   = document.getElementById("state-empty");
  const stateError   = document.getElementById("state-error");
  const errorMessageText = document.getElementById("error-message-text");
  const bestDealSummary  = document.getElementById("best-deal-summary");
  const crawlerStatusDot   = document.getElementById("crawler-status-dot");
  const crawlerStatusLabel = document.getElementById("crawler-status-label");
  const chipDuration = document.getElementById("chip-duration");
  const chipCrawled  = document.getElementById("chip-crawled");
  const chipCache    = document.getElementById("chip-cache");
  const btnForceRefresh = document.getElementById("btn-force-refresh");
  const btnRetry        = document.getElementById("btn-retry-search");
  const btnEmptyRetry   = document.getElementById("btn-empty-retry");

  // Internal state
  let currentResults = [];
  let currentQuery   = "";

  // Nav badge update
  function updateNavBadges() {
    try {
      const wl  = JSON.parse(localStorage.getItem("pennywise_wishlist") || "[]");
      const cmp = JSON.parse(localStorage.getItem("pennywise_compare")  || "[]");
      const wlEl  = document.getElementById("nav-wishlist-count");
      const cmpEl = document.getElementById("nav-compare-count");
      if (wlEl)  wlEl.textContent  = `(${wl.length})`;
      if (cmpEl) cmpEl.textContent = `(${cmp.length})`;
    } catch(e){}
  }
  updateNavBadges();

  // Format PKR currency
  function formatPKR(num) {
    if (num === null || num === undefined || isNaN(num)) return "Price on Store";
    return "Rs. " + Number(num).toLocaleString("en-PK");
  }

  // Parse URL params
  const urlParams = new URLSearchParams(window.location.search);
  const paramName  = (urlParams.get("name")  || "").trim();
  const paramBrand = (urlParams.get("brand") || "").trim();
  const paramQ     = (urlParams.get("q")     || "").trim();

  if (paramQ) {
    currentQuery = paramQ;
  } else if (paramName) {
    currentQuery = (paramBrand && !paramName.toLowerCase().includes(paramBrand.toLowerCase()))
      ? `${paramBrand} ${paramName}`.trim()
      : paramName;
  } else {
    currentQuery = "Men Casual Shirt";
  }

  if (resultsSearchInput) resultsSearchInput.value = paramName || currentQuery;
  if (resultsSearchBrand && paramBrand) resultsSearchBrand.value = paramBrand;

  // Show/hide UI states
  function showState(state) {
    stateResults.classList.add("hidden");
    stateLoading.classList.add("hidden");
    stateEmpty.classList.add("hidden");
    stateError.classList.add("hidden");

    if (state === "loading") {
      stateLoading.classList.remove("hidden");
      if (crawlerStatusDot) crawlerStatusDot.className = "w-2.5 h-2.5 rounded-full bg-[#c8a96e] border border-[rgba(255,255,255,0.1)] animate-ping";
      if (crawlerStatusLabel) crawlerStatusLabel.textContent = "CRAWLING STORES...";
      if (btnSearchSubmit) btnSearchSubmit.disabled = true;
    } else if (state === "empty") {
      stateEmpty.classList.remove("hidden");
      if (crawlerStatusDot) crawlerStatusDot.className = "w-2.5 h-2.5 rounded-full bg-[#555] border border-[rgba(255,255,255,0.1)]";
      if (crawlerStatusLabel) crawlerStatusLabel.textContent = "COMPLETED (0 FOUND)";
      if (btnSearchSubmit) btnSearchSubmit.disabled = false;
    } else if (state === "error") {
      stateError.classList.remove("hidden");
      if (crawlerStatusDot) crawlerStatusDot.className = "w-2.5 h-2.5 rounded-full bg-[#cc3333] border border-[rgba(255,255,255,0.1)]";
      if (crawlerStatusLabel) crawlerStatusLabel.textContent = "ERROR";
      if (btnSearchSubmit) btnSearchSubmit.disabled = false;
    } else {
      stateResults.classList.remove("hidden");
      if (crawlerStatusDot) crawlerStatusDot.className = "w-2.5 h-2.5 rounded-full bg-[#4a9e6e] border border-[rgba(255,255,255,0.1)]";
      if (crawlerStatusLabel) crawlerStatusLabel.textContent = "CRAWL COMPLETE";
      if (btnSearchSubmit) btnSearchSubmit.disabled = false;
    }
  }

  // Update metrics bar
  function updateMetrics(payload) {
    if (!payload || !payload.crawler_metrics) {
      if (chipDuration) chipDuration.textContent = "--";
      if (chipCrawled)  chipCrawled.textContent  = "0 Pages";
      if (chipCache)    chipCache.textContent     = payload && payload.cached ? "Memory Cached" : "Fresh Crawl";
      return;
    }
    const m = payload.crawler_metrics;
    if (chipDuration) chipDuration.textContent = `${(m.total_duration_ms / 1000).toFixed(1)}s`;
    if (chipCrawled)  chipCrawled.textContent  = `${m.successful_extractions}/${m.pages_crawled} Extracted`;
    if (chipCache)    chipCache.textContent    = payload.cached ? "Memory Cached" : "Fresh Live Crawl";
  }

  // Product image fallback HTML
  function getProductFallbackHtml() {
    return `
      <div class="product-fallback-box w-full h-44 bg-[#111] border border-[rgba(255,255,255,0.06)] rounded-lg mb-3.5 flex flex-col items-center justify-center text-center p-3">
        <svg class="w-10 h-10 mb-2 text-[#444]" viewBox="0 0 64 64" fill="none">
          <rect x="8" y="12" width="46" height="38" rx="6" stroke="currentColor" stroke-width="1.5"/>
          <circle cx="31" cy="31" r="10" stroke="currentColor" stroke-width="1.5"/>
          <line x1="24" y1="38" x2="38" y2="24" stroke="#cc3333" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <span class="text-[9px] font-medium text-[#666] uppercase tracking-[0.1em]">Photo Unavailable</span>
        <span class="text-[9px] text-[#555] mt-1">Open store link to view</span>
      </div>
    `.trim();
  }
  window.getProductFallbackHtml = getProductFallbackHtml;

  // HTML escape helper
  function esc(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Render product cards
  function renderCards(items) {
    cardsContainer.innerHTML = "";

    if (!items || items.length === 0) {
      showState("empty");
      if (countText) countText.textContent = "Found 0 verified store listings";
      return;
    }

    showState("normal");
    if (countText) countText.textContent = `Found ${items.length} verified store listings in Pakistan`;

    const validPrices = items.map(i => i.price).filter(p => p > 0);
    const lowestPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;
    const cheapestItem = items.find(i => i.price === lowestPrice);

    if (bestDealSummary && cheapestItem) {
      bestDealSummary.textContent = `Lowest price is ${formatPKR(lowestPrice)} at ${cheapestItem.store}`;
    }

    items.forEach((item, index) => {
      const isLowest = item.price === lowestPrice;
      const card = document.createElement("div");
      card.className = `pm-polaroid flex flex-col justify-between ${isLowest ? "border-[rgba(200,169,110,0.4)]" : ""} bg-[#1a1a1a]`;

      // Read wishlist/compare state
      let wlItems = [], cmpItems = [];
      try {
        wlItems  = JSON.parse(localStorage.getItem("pennywise_wishlist") || "[]");
        cmpItems = JSON.parse(localStorage.getItem("pennywise_compare")  || "[]");
      } catch(e){}

      const isWishlisted = wlItems.some(w => w.title === item.title || (w.url && w.url === item.url));
      const isCompared   = cmpItems.some(c => c.title === item.title);

      const detailUrl = `product.html?title=${encodeURIComponent(item.title)}&price=${item.price}&store=${encodeURIComponent(item.store)}&url=${encodeURIComponent(item.url)}&image=${encodeURIComponent(item.image || "")}&q=${encodeURIComponent(currentQuery)}`;

      const imageHtml = item.image
        ? `<div class="product-img-wrapper w-full h-44 bg-[#111] border border-[rgba(255,255,255,0.06)] rounded-lg mb-3.5 flex items-center justify-center overflow-hidden p-2.5">
             <img src="${esc(item.image)}" alt="${esc(item.title)}" referrerpolicy="no-referrer" loading="lazy"
               class="product-real-img max-h-full max-w-full object-contain"
               onerror="this.onerror=null; this.closest('.product-img-wrapper').outerHTML=window.getProductFallbackHtml();">
           </div>`
        : getProductFallbackHtml();

      card.innerHTML = `
        <div class="pm-sticker-number text-[10px]" style="background:${isLowest ? "#c8a96e" : "#333"};">
          ${isLowest ? "TOP" : index + 1}
        </div>
        <div class="pm-washi" style="background:linear-gradient(90deg,transparent,${isLowest ? "#c8a96e" : "rgba(255,255,255,0.1)"},transparent);"></div>
        <div>
          <div class="flex items-center justify-between gap-2 mb-3 pl-6 pt-1">
            <span class="pm-tag pm-tag-mint text-[8px]">${esc(item.store)}</span>
            <div class="flex items-center gap-2">
              ${isLowest ? `<span class="pm-tag pm-tag-gold text-[8px]">#1 LOWEST</span>` : `<span class="pm-tag text-[8px]">VERIFIED</span>`}
              <button type="button" class="btn-card-wishlist w-7 h-7 rounded border border-[rgba(255,255,255,0.12)] flex items-center justify-center transition-colors ${isWishlisted ? "text-[#ff3355] border-[#ff3355] bg-[rgba(255,51,85,0.1)]" : "text-[#888] hover:text-[#ff3355]"}" title="${isWishlisted ? "Remove from Wishlist" : "Save to Wishlist"}">
                <svg class="w-3.5 h-3.5 ${isWishlisted ? "fill-current" : "fill-none stroke-current"}" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </button>
            </div>
          </div>
          ${imageHtml}
          <a href="${detailUrl}" class="block group">
            <h3 class="font-medium text-sm text-white group-hover:text-[#c8a96e] transition-colors mb-2 line-clamp-2 leading-snug" title="${esc(item.title)}">${esc(item.title)}</h3>
          </a>
          <div class="text-[10px] text-[#888] mb-4 flex items-center justify-between gap-2">
            <span class="${item.inStock ? "text-[#4a9e6e]" : "text-[#cc3333]"} font-medium">${item.inStock ? "In Stock" : "Limited"}</span>
            <button type="button" class="btn-card-compare text-[9px] font-semibold uppercase px-2 py-0.5 rounded border ${isCompared ? "bg-[#c8a96e] text-[#0a0a0a] border-[#c8a96e]" : "border-[rgba(255,255,255,0.15)] text-[#aaa] hover:border-[#c8a96e]"}">
              ${isCompared ? "✓ COMPARED" : "+ COMPARE"}
            </button>
          </div>
        </div>
        <div class="pt-4 border-t border-[rgba(255,255,255,0.06)] mt-2">
          <div class="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#666] mb-0.5">Verified Price in Pakistan</div>
          <div class="font-display text-2xl sm:text-3xl text-white mb-3">${formatPKR(item.price)}</div>
          <div class="grid grid-cols-2 gap-2">
            <a href="${detailUrl}" class="pm-btn pm-btn-white py-2.5 text-[9px] flex items-center justify-center gap-1">
              <span>DETAILS</span><span>→</span>
            </a>
            <a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer" class="pm-btn ${isLowest ? "pm-btn-primary" : "pm-btn-gold"} py-2.5 text-[9px] flex items-center justify-center gap-1">
              <span>STORE</span>
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
            </a>
          </div>
        </div>
      `;

      // Wishlist button
      const wlBtn = card.querySelector(".btn-card-wishlist");
      if (wlBtn) {
        wlBtn.addEventListener("click", (e) => {
          e.preventDefault(); e.stopPropagation();
          let list = JSON.parse(localStorage.getItem("pennywise_wishlist") || "[]");
          const idx = list.findIndex(w => w.title === item.title);
          if (idx >= 0) {
            list.splice(idx, 1);
            wlBtn.className = "btn-card-wishlist w-7 h-7 rounded border border-[rgba(255,255,255,0.12)] flex items-center justify-center transition-colors text-[#888] hover:text-[#ff3355]";
            wlBtn.innerHTML = `<svg class="w-3.5 h-3.5 fill-none stroke-current" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;
          } else {
            list.push({ title: item.title, store: item.store, price: item.price, url: item.url, image: item.image });
            wlBtn.className = "btn-card-wishlist w-7 h-7 rounded border border-[#ff3355] bg-[rgba(255,51,85,0.1)] flex items-center justify-center transition-colors text-[#ff3355]";
            wlBtn.innerHTML = `<svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;
          }
          localStorage.setItem("pennywise_wishlist", JSON.stringify(list));
          updateNavBadges();
        });
      }

      // Compare button
      const cmpBtn = card.querySelector(".btn-card-compare");
      if (cmpBtn) {
        cmpBtn.addEventListener("click", (e) => {
          e.preventDefault(); e.stopPropagation();
          let list = JSON.parse(localStorage.getItem("pennywise_compare") || "[]");
          const idx = list.findIndex(c => c.title === item.title);
          if (idx >= 0) {
            list.splice(idx, 1);
            cmpBtn.className = "btn-card-compare text-[9px] font-semibold uppercase px-2 py-0.5 rounded border border-[rgba(255,255,255,0.15)] text-[#aaa] hover:border-[#c8a96e]";
            cmpBtn.textContent = "+ COMPARE";
          } else {
            if (list.length >= 3) { alert("You can compare up to 3 items. Open Compare to manage."); return; }
            list.push({ title: item.title, store: item.store, price: item.price, url: item.url, image: item.image });
            cmpBtn.className = "btn-card-compare text-[9px] font-semibold uppercase px-2 py-0.5 rounded border bg-[#c8a96e] text-[#0a0a0a] border-[#c8a96e]";
            cmpBtn.textContent = "✓ COMPARED";
          }
          localStorage.setItem("pennywise_compare", JSON.stringify(list));
          updateNavBadges();
        });
      }

      cardsContainer.appendChild(card);
    });
  }

  // Sort and render
  function applySortAndRender() {
    const sortVal = sortSelect ? sortSelect.value : "lowest";
    const sorted = [...currentResults].sort((a, b) =>
      sortVal === "highest" ? b.price - a.price : a.price - b.price
    );
    renderCards(sorted);
  }

  // Fetch from backend
  async function executeLiveSearch(query, forceRefresh = false) {
    if (!query || query.trim().length < 2) return;
    currentQuery = query.trim();
    if (queryDisplay) queryDisplay.textContent = `"${currentQuery}"`;
    showState("loading");

    try {
      const url = `/api/search?q=${encodeURIComponent(currentQuery)}${forceRefresh ? "&refresh=true" : ""}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      currentResults = data.results || [];
      updateMetrics(data);

      // AI Insights
      const aiBox  = document.getElementById("ai-insights-box");
      const aiText = document.getElementById("ai-insights-text");
      if (aiBox && aiText) {
        if (data.ai_insights) {
          aiText.textContent = data.ai_insights;
          aiBox.classList.remove("hidden");
        } else {
          aiBox.classList.add("hidden");
        }
      }

      if (currentResults.length === 0) {
        showState("empty");
        if (countText) countText.textContent = "Found 0 verified store listings";
      } else {
        applySortAndRender();
      }
    } catch (err) {
      console.error("Crawl failed:", err);
      if (errorMessageText) errorMessageText.textContent = `Crawler error: ${err.message}`;
      showState("error");
    }
  }
  window.executeLiveSearch = executeLiveSearch;

  // Search form submit
  if (resultsSearchForm && resultsSearchInput) {
    resultsSearchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name  = resultsSearchInput.value.trim();
      const brand = resultsSearchBrand ? resultsSearchBrand.value.trim() : "";
      if (name.length < 2) { resultsSearchInput.focus(); return; }

      let combinedQuery = name;
      if (brand && !name.toLowerCase().includes(brand.toLowerCase())) {
        combinedQuery = `${brand} ${name}`.trim();
      }

      const params = new URLSearchParams();
      params.set("name", name);
      if (brand) params.set("brand", brand);
      params.set("q", combinedQuery);
      window.history.pushState({}, "", `${window.location.pathname}?${params}`);
      executeLiveSearch(combinedQuery, false);
    });
  }

  // Buttons
  if (btnForceRefresh) btnForceRefresh.addEventListener("click", () => executeLiveSearch(currentQuery, true));
  if (btnRetry)        btnRetry.addEventListener("click",        () => executeLiveSearch(currentQuery, true));
  if (btnEmptyRetry)   btnEmptyRetry.addEventListener("click",   () => resultsSearchInput && resultsSearchInput.focus());

  // Quick search tags
  document.querySelectorAll(".quick-tag").forEach((btn) => {
    btn.addEventListener("click", () => {
      const q = btn.getAttribute("data-q");
      if (!q) return;
      if (resultsSearchInput) resultsSearchInput.value = q;
      if (resultsSearchBrand) resultsSearchBrand.value = "";
      const params = new URLSearchParams({ name: q, q });
      window.history.pushState({}, "", `${window.location.pathname}?${params}`);
      executeLiveSearch(q, false);
    });
  });

  // Sort change
  if (sortSelect) sortSelect.addEventListener("change", applySortAndRender);

  // Initial load
  executeLiveSearch(currentQuery, false);
});
