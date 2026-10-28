/**
 * PennyWise - Core Frontend Utilities
 * Minimal vanilla JS for badge updates and interactions
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
  } catch (e) {
    // Graceful fallback for restricted storage
  }
});
