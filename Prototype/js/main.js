/**
 * PennyWise Prototype - Main Home Page Script
 */

document.addEventListener("DOMContentLoaded", () => {
  const searchForm = document.getElementById("search-form");
  const searchInput = document.getElementById("search-input");
  const searchError = document.getElementById("search-error");
  const quickPills = document.querySelectorAll(".quick-pill");

  // Handle Form Submission
  if (searchForm && searchInput) {
    searchForm.addEventListener("submit", (e) => {
      const query = searchInput.value.trim();

      // Check Section 6.1: Empty or under 2 characters rejected with clear message
      if (query.length < 2) {
        e.preventDefault();
        if (searchError) {
          searchError.textContent = "Please enter at least 2 characters to search.";
          searchError.classList.remove("hidden");
        }
        searchInput.focus();
        return false;
      }

      if (searchError) {
        searchError.classList.add("hidden");
      }
    });

    // Real-time input listener to clear error
    searchInput.addEventListener("input", () => {
      if (searchInput.value.trim().length >= 2 && searchError) {
        searchError.classList.add("hidden");
      }
    });
  }

  // Handle Quick Search Pills
  quickPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      const q = pill.getAttribute("data-query");
      if (q) {
        window.location.href = `results.html?q=${encodeURIComponent(q)}`;
      }
    });
  });

  // Spline 3D Fallback Monitor
  const splineViewer = document.getElementById("spline-viewer-hero");
  const splineFallback = document.getElementById("spline-fallback");

  if (splineViewer && splineFallback) {
    // Hide fallback once spline loaded event fires
    splineViewer.addEventListener("load", () => {
      splineFallback.style.display = "none";
    });

    // If spline takes longer than 4 seconds or fails, keep fallback visible
    setTimeout(() => {
      try {
        // If spline canvas is not present, fallback remains visible
        const shadowRoot = splineViewer.shadowRoot;
        if (!shadowRoot || !shadowRoot.querySelector("canvas")) {
          splineFallback.style.display = "flex";
        }
      } catch (err) {
        splineFallback.style.display = "flex";
      }
    }, 4000);
  }
});
