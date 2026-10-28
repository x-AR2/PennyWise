/**
 * PennyWise - Main Home Page Script
 */

document.addEventListener("DOMContentLoaded", () => {
  // Update nav badge counts from localStorage
  try {
    const wl = JSON.parse(localStorage.getItem("pennywise_wishlist") || "[]");
    const cmp = JSON.parse(localStorage.getItem("pennywise_compare") || "[]");
    const wlEl = document.getElementById("nav-wishlist-count");
    const cmpEl = document.getElementById("nav-compare-count");
    if (wlEl) wlEl.textContent = `(${wl.length})`;
    if (cmpEl) cmpEl.textContent = `(${cmp.length})`;
  } catch(e){}

  // Search form validation
  const searchForm = document.getElementById("search-form");
  const searchNameInput = document.getElementById("search-name");
  const searchBrandInput = document.getElementById("search-brand");
  const searchError = document.getElementById("search-error");

  if (searchForm && searchNameInput) {
    searchForm.addEventListener("submit", (e) => {
      const name = searchNameInput.value.trim();
      const brand = searchBrandInput ? searchBrandInput.value.trim() : "";

      if (name.length < 2) {
        e.preventDefault();
        if (searchError) searchError.classList.remove("hidden");
        searchNameInput.focus();
        return false;
      }

      if (searchError) searchError.classList.add("hidden");

      // Combine brand + name into the hidden query field
      let combinedQuery = name;
      if (brand && !name.toLowerCase().includes(brand.toLowerCase())) {
        combinedQuery = `${brand} ${name}`.trim();
      }
      const hiddenQ = document.getElementById("combined-query");
      if (hiddenQ) hiddenQ.value = combinedQuery;
    });

    searchNameInput.addEventListener("input", () => {
      if (searchNameInput.value.trim().length >= 2 && searchError) {
        searchError.classList.add("hidden");
      }
    });
  }

  // Quick search pills
  document.querySelectorAll(".quick-pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      const q = pill.getAttribute("data-query");
      if (q) {
        window.location.href = `pages/results.html?q=${encodeURIComponent(q)}&name=${encodeURIComponent(q)}`;
      }
    });
  });
});
