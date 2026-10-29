# Dead Code Audit — PennyWise

> Items here are unused, redundant, or carry zero effect in the current codebase. Safe to remove.

---

## 1. `js/results.js` — Entire File

**File:** [`js/results.js`](js/results.js)

```js
// Results logic is inlined in pages/results.html for autonomous client-side performance.
console.log("PennyWise Results Module Loaded (Autonomous Frontend Mode)");
```

- Only contains a `console.log`. Does nothing.
- Not linked from any HTML page (only `Prototype/results.html` references it, which is excluded).
- **Action:** Delete `js/results.js`.

---

## 2. Exposed API Keys in `.env`

**File:** [`.env`](.env)

```
OPENROUTER_API_KEY=sk-or-v1-...
GEMINI_API_KEY=AQ.Ab8RN6...
```

- `.env` is committed to the repo (check `.gitignore` — it is **not** listed there).
- This is a **pure frontend project with no backend**, so these keys serve no purpose in the current state.
- Both keys are **exposed in plaintext** and should be revoked immediately.
- **Action:** Add `.env` to `.gitignore`. Revoke and rotate both keys.

---

## 3. Dead CSS Classes in `css/style.css`

None of the following classes are referenced in any HTML page (excluding `Prototype/`).

| Class(es) | Lines | Notes |
|---|---|---|
| `.neo-box`, `.neo-box-sm` | 525–535 | "Legacy compat" block, zero usages in HTML |
| `.neo-btn`, `.neo-btn:hover`, `.neo-btn:active`, `.neo-btn-yellow`, `.neo-btn-white` | 537–555 | Also in round-button override at line 798 — never used in HTML |
| `.neo-badge`, `.neo-badge-yellow`, `.neo-badge-green`, `.neo-badge-white` | 557–571 | Never used in any page |
| `.pm-btn-lg` | 232 | Large button size variant, unused |
| `.pm-card-dark` | 255–261 | Card variant, unused |
| `.pm-card-burgundy` | 262–267 | Card variant, unused |
| `.pm-select` | 432–443 | Custom styled `<select>` — no HTML uses this class (tickets/login use `pm-input` on selects) |
| `.pm-sawtooth-bottom-blush::after`, `.pm-sawtooth-bottom-ink::after` | 396–407 | Decorative sawtooth effect, never used |
| `.pw-text-accent` | 580–585 | Text gradient utility, zero usages |
| `.pw-glass` | 588–593 | Glassmorphism card, zero usages |
| `.product-fallback-box` | 596–599 | Product placeholder style, never applied |
| `.pw-fade-up` + `@keyframes pw-fade-up` | 445–450 | Animation utility, zero usages |
| `.pw-shimmer` + `@keyframes pw-shimmer` | 452–461 | Shimmer animation, zero usages (`.pw-skeleton` reuses the keyframe but that too is unused — see below) |
| `.pw-pulse-glow` + `@keyframes pw-pulse-glow` | 463–468 | Glow pulse animation, zero usages |
| `.pw-spin` + `@keyframes pw-spin` | 470–475 | Spin animation, zero usages |
| `.pw-loading-bar`, `.pw-loading-bar::after` + keyframe | 483–506 | Loading progress bar, zero usages |
| `.pw-skeleton` | 508–514 | Skeleton screen, zero usages |
| `.pw-reveal`, `.pw-reveal.is-visible` | 516–522 | Scroll-reveal effect, zero usages |
| `quick-pill` (in round-button override block) | 801 | Listed in button override selector but never defined as a standalone class and never used |

**Action:** Remove all entries in the table above from `css/style.css`. The `/* ========== LEGACY COMPAT ========== */` section (lines 524–571) can be deleted entirely.

---

## 4. Duplicate Image Assets

**Folder:** `assets/images/`

| Redundant File | Issue |
|---|---|
| `philips-airfryer.jpg` | Never referenced in any HTML. `philips-airfry.jpg` (without the `er`) is used in `deals.html`. One of these is a duplicate with a typo in the name. |
| `samsung-s24.jpg` | Never referenced in any HTML. `deals.html` uses `samsung-s26.jpg` for the "Samsung Galaxy S24 Ultra" card — a mislabeled file. |

**Action:**
- Delete `assets/images/philips-airfryer.jpg` (the unused one).
- Rename `samsung-s26.jpg` → `samsung-s24.jpg` and update the reference in `deals.html` (line 167 & 181) so the name matches the product it represents.

---

## 5. Lottie Player Script on `pages/results.html`

**File:** [`pages/results.html`](pages/results.html) — line 12

```html
<script src="https://unpkg.com/@dotlottie/player-component@2.7.12/dist/dotlottie-player.mjs" type="module"></script>
```

- The `<dotlottie-player>` component is **only** used in `index.html` (for the coin animation in the hero).
- `results.html` loads the script but **never uses a `<dotlottie-player>` element**.
- This is a needless network request on every Live Search page load.
- **Action:** Remove the `<script>` tag from `pages/results.html` line 12.

---

## 6. `js/main.js` — Reads `localStorage` but JS is Effectively a No-Op

**File:** [`js/main.js`](js/main.js)

The script updates `nav-wishlist-count` and `nav-compare-count` badge spans from `localStorage`. However:

- The nav badges are **hardcoded `(0)`** in all HTML and the `localStorage` keys (`pennywise_wishlist`, `pennywise_compare`) are **never written to** by any page — no JavaScript in the current frontend writes to them.
- The Wishlist and Compare pages manage their state entirely via **inline `<script>` blocks** that do not persist to the keys `main.js` reads.
- The result: `main.js` always reads empty arrays and sets the counts back to `(0)` — identical to what's already in the HTML.

**Action:** Either wire up the keys consistently across pages, or remove `main.js` and the `<script src="../js/main.js">` tags from all pages until a shared state strategy is decided.

---

## 7. `docs/Suggested Pages.md` — Planning Doc Mixed with Source

**File:** [`docs/Suggested Pages.md`](docs/Suggested%20Pages.md)

- This is a planning/brainstorming document that describes future pages and features.
- It has no effect on the application and doesn't belong in the production source tree.
- **Action:** Move to a `wiki`, GitHub Issues, or Notion. Delete from the repo or add `docs/` to `.gitignore`.

---

## Summary

| # | What | File(s) | Action |
|---|---|---|---|
| 1 | Pointless JS file | `js/results.js` | Delete |
| 2 | Exposed API keys | `.env` | Add to `.gitignore`, revoke keys |
| 3 | ~20 dead CSS classes | `css/style.css` | Remove |
| 4 | Unused/mislabeled images | `philips-airfryer.jpg`, `samsung-s26.jpg` | Delete unused, rename mislabeled |
| 5 | Lottie script on wrong page | `pages/results.html:12` | Remove `<script>` tag |
| 6 | `main.js` badge logic is a no-op | `js/main.js` | Fix or remove |
| 7 | Planning doc in source tree | `docs/Suggested Pages.md` | Move out of repo |
