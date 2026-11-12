/**
 * PennyWise - Shared localStorage-backed navigation counters.
 * Shared across pages that render wishlist/compare counters.
 */
function updateNavCounts() {
  try {
    const wl = JSON.parse(localStorage.getItem("pennywise_wishlist") || "[]");
    const cmp = JSON.parse(localStorage.getItem("pennywise_compare") || "[]");
    document.getElementById("nav-wishlist-count").textContent = `(${wl.length})`;
    document.getElementById("nav-compare-count").textContent = `(${cmp.length})`;
  } catch(e){}
}
