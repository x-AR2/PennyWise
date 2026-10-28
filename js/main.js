/**
 * PennyWise Prototype - Main Home Page Script
 */

document.addEventListener("DOMContentLoaded", () => {
  // Update Header Badges for Wishlist & Compare
  try {
    const wl = JSON.parse(localStorage.getItem("pennywise_wishlist") || "[]");
    const cmp = JSON.parse(localStorage.getItem("pennywise_compare") || "[]");
    const wlEl = document.getElementById("nav-wishlist-count");
    const cmpEl = document.getElementById("nav-compare-count");
    if (wlEl) wlEl.textContent = `(${wl.length})`;
    if (cmpEl) cmpEl.textContent = `(${cmp.length})`;
  } catch(e){}

  const searchForm = document.getElementById("search-form");
  const searchNameInput = document.getElementById("search-name") || document.getElementById("search-input");
  const searchBrandInput = document.getElementById("search-brand");
  const searchError = document.getElementById("search-error");
  const quickPills = document.querySelectorAll(".quick-pill");

  // Handle Streamlined 2-Field Search Submission (Product Name + Optional Brand/Store)
  if (searchForm && searchNameInput) {
    searchForm.addEventListener("submit", (e) => {
      const name = searchNameInput.value.trim();
      const brand = searchBrandInput ? searchBrandInput.value.trim() : "";

      // Section 6.1: Reject under 2 characters
      if (name.length < 2) {
        e.preventDefault();
        if (searchError) {
          searchError.textContent = "Please enter at least 2 characters for the product name.";
          searchError.classList.remove("hidden");
        }
        searchNameInput.focus();
        return false;
      }

      if (searchError) {
        searchError.classList.add("hidden");
      }

      // Combine brand + name for crawler query 'q'
      let combinedQuery = name;
      if (brand && !name.toLowerCase().includes(brand.toLowerCase())) {
        combinedQuery = `${brand} ${name}`.trim();
      }

      const hiddenQ = document.getElementById("combined-query");
      if (hiddenQ) {
        hiddenQ.value = combinedQuery;
      }
    });

    // Real-time input listener to clear error
    searchNameInput.addEventListener("input", () => {
      if (searchNameInput.value.trim().length >= 2 && searchError) {
        searchError.classList.add("hidden");
      }
    });
  }

  // Dynamic Multi-Category Rotating Placeholders for Product Name
  if (searchNameInput) {
    const rotatingPlaceholders = [
      "Enter product (e.g. Cotton Linen Shirt)...",
      "Enter product (e.g. Dawlance Air Fryer)...",
      "Enter product (e.g. Nike Running Shoes)...",
      "Enter product (e.g. iPhone 15 Pro Max)...",
      "Enter product (e.g. Summer Lawn Dress)...",
      "Enter product (e.g. 1.5 Ton Inverter AC)..."
    ];
    let placeholderIdx = 0;
    setInterval(() => {
      if (document.activeElement !== searchNameInput && !searchNameInput.value) {
        placeholderIdx = (placeholderIdx + 1) % rotatingPlaceholders.length;
        searchNameInput.placeholder = rotatingPlaceholders[placeholderIdx];
      }
    }, 3200);
  }

  // Handle Quick Search Pills
  quickPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      const q = pill.getAttribute("data-query");
      if (q) {
        window.location.href = `pages/results.html?q=${encodeURIComponent(q)}&name=${encodeURIComponent(q)}`;
      }
    });
  });
});
