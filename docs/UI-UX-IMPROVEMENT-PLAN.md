# FinChronicleLedger — UI/UX Improvement Plan

**Author:** Kiren Labs  
**Date:** 2026-04-01  
**Based on:** Screenshots of List view and Dashboard/Add view (v1.3.0)  
**Status:** Draft — pending prioritisation sign-off

---

## Overview

This document captures UI and UX improvements identified from a review of the List tab and Dashboard (Add tab) at v1.3.0. Each issue is classified by type, priority, and estimated effort. None of these changes touch the domain or infrastructure layers — all fixes are confined to `js/ui/` and `css/`.

**Priority legend**
| Label | Meaning |
|-------|---------|
| P0 | Bug or data-integrity issue — fix before next release |
| P1 | High user-impact, low-to-medium effort |
| P2 | Quality-of-life, medium effort |
| P3 | Polish / nice-to-have |

---

## Issues & Improvements

---

### 1. HTML Entity Double-Escape in List View `P0`

**What:** Account name "Charity & Gifts" renders as **"Charity &amp; Gifts"** in the DR/CR accounting block inside the transaction list.

**Root cause:** The `&` in the account name is being run through `escapeHTML()` twice — once when the account is stored/retrieved, and again when rendered into the list row HTML.

**Impact:** Any account name containing `&`, `<`, `>`, or `"` will display raw HTML entities to the user.

**Fix:** Audit the list renderer (`js/ui/list.js`) — ensure account names are escaped exactly once at render time. Do not pre-escape values stored in State.

**Files:** `js/ui/list.js`

---

### 2. Number Format Mismatch — Indian Grouping with Thai Baht `P0`

**What:** Amounts display as `฿2,22,408.00` instead of `฿342,408.00`. The `en-IN` locale groups digits in the Indian lakh/crore system (1,00,000 = 1 lakh). This is correct for ₹ INR but wrong for ฿ THB and most other currencies.

**Root cause:** `formatCurrency()` in `js/ui/renderer.js` uses a fixed `en-IN` locale regardless of the selected currency.

**Expected behaviour:**
- INR → `en-IN` locale (lakhs/crores) — ₹2,22,408.00 ✓  
- All other currencies → `en-US` locale (thousands) — ฿342,408.00 ✓

**Fix:** In `formatCurrency()`, select locale based on currency:
```javascript
const locale = currency === 'INR' ? 'en-IN' : 'en-US';
```

**Files:** `js/ui/renderer.js` → `formatCurrency()`

---

### 3. "New Journal Entry" Label in Simple Mode `P1`

**What:** The form heading always reads **"New Journal Entry"** — accounting jargon that does not match the Simple Mode audience.

**Expected behaviour:**
- Simple Mode → **"Add Transaction"**
- Advanced Mode → **"New Journal Entry"**

**Fix:** In the form renderer, read `SettingsService().getUIMode()` and set the heading accordingly.

**Files:** `js/ui/forms.js`

---

### 4. Amount Not Scannable in List Rows `P1`

**What:** The net transaction amount is buried inside the grey DR/CR accounting block. Users scan a finance list for amount first — it should be in the row header alongside the description.

**Current layout:**
```
25 Mar 2026 · expense
Lunch
[ DR 5100 Dining Out  ฿144.00 ]
[ CR 1100 Checking    ฿144.00 ]
Edit  Delete
```

**Proposed layout:**
```
25 Mar 2026 · expense              ฿144.00
Lunch
[ DR/CR detail block — collapsed in Simple Mode ]
Edit  Delete
```

**Implementation notes:**
- Pull the primary amount (first DR line amount for expense, first CR line amount for income) up to the row header.
- Colour it red for expense, green for income, neutral for transfer — matching the existing design tokens.

**Files:** `js/ui/list.js`

---

### 5. DR/CR Detail Block Visibility by Mode `P1`

**What:** In Simple Mode, showing the raw double-entry accounting lines (`DR 5100 Dining Out / CR 1100 Checking Account`) adds cognitive load for users who have never asked to see the underlying journal structure.

**Proposed behaviour:**
- **Simple Mode:** DR/CR block hidden by default, revealed via a **"details ▾"** toggle link.
- **Advanced Mode:** DR/CR block always expanded (current behaviour).

**Implementation notes:**
- Wrap the accounting block in a `<details><summary>details</summary>…</details>` element.
- In Advanced Mode, add the `open` attribute by default.
- No JS needed — native `<details>` handles the toggle.

**Files:** `js/ui/list.js`, `css/styles.css`

---

### 6. Edit/Delete Buttons Always Visible `P2`

**What:** Showing Edit and Delete on every row permanently adds ~40px of dead space per entry. On a page of 20 items this wastes ~800px of screen height.

**Proposed behaviour:** Hide actions by default; reveal on tap/click of the row (expand/collapse toggle). On desktop, show on hover.

**Implementation notes:**
- Add an `expanded` CSS class toggled by a click handler on the row container.
- Delete confirmation modal already exists — no changes needed there.
- Keep keyboard accessibility: Enter/Space on a focused row should expand it.

**Files:** `js/ui/list.js`, `css/styles.css`

---

### 7. Month Filter — No Scroll Affordance `P2`

**What:** The month filter pills show only 3 months with no indication that older months are scrollable. Users with more than 3 months of data have no affordance that older data exists.

**Proposed fix:**
- Allow the pill row to scroll horizontally (already may be the case — confirm CSS).
- Add a faint right-edge gradient fade as a scroll hint when overflow exists.
- Optionally add a **"All months ▾"** dropdown as an escape hatch.

**Files:** `js/ui/list.js`, `css/styles.css`

---

### 8. Transaction Type — No Visual Differentiation `P2`

**What:** The type label ("expense", "income", "transfer") is grey lowercase text next to the date. It requires reading; it cannot be scanned.

**Proposed fix:** Replace the plain text with a small coloured dot or pill:
- 🔴 Expense
- 🟢 Income  
- 🔵 Transfer

Use design token colours already defined in `tokens.css` — do not introduce new colour values.

**Files:** `js/ui/list.js`, `css/styles.css`

---

### 9. Missing "Add" Entry Point from List Tab `P2`

**What:** The bottom nav on the List tab shows: List · Groups · Reports · Goals · Settings — no way to jump to Add without tapping a nav item that navigates away from your current scroll position.

**Proposed fix:** Add a floating action button (FAB) — a `+` circle — fixed to the bottom-right corner, visible only on the List and Groups tabs. Tapping it switches to the Add tab.

**Implementation notes:**
- FAB is a single `<button>` element in `index.html`, positioned with `position: fixed`.
- Hidden on the Add tab via CSS (`[data-active-tab="add"] .fab { display: none }`).
- Already have the bottom-nav active tab tracking in `navigation.js` — use the same `data-active-tab` attribute.

**Files:** `index.html`, `js/ui/navigation.js`, `css/styles.css`

---

### 10. Summary Dashboard — Net Worth Label Accuracy `P2`

**What:** "Net Worth" currently shows the Checking Account balance (฿1,46,426.14). True net worth = Assets − Liabilities. With only one account these match, but once a savings account or loan is added, the label will be wrong and misleading.

**Options:**
1. **Relabel** to "Checking Balance" and compute it from account 1100 directly.
2. **Compute correctly** using `Accounting().verifyAccountingEquation()` — `assets − liabilities` — which already exists and is correct.

Option 2 is preferred: it aligns with what "net worth" actually means and gets more accurate as the user adds accounts.

**Files:** `js/application/report-service.js` (already returns `netWorth` from `calculateNetWorth`), `js/ui/summary.js` (verify it uses this value and not a shortcut)

---

### 11. Summary Tiles — Inconsistent Trend Deltas `P3`

**What:** Income and Expenses tiles show MoM trend arrows (196.17%, 28.22%). Net and Entries tiles show no trend. The inconsistency makes the dashboard feel unfinished.

**Proposed fix:**
- Net tile: show MoM delta of the net figure (income − expense vs prior month).
- Entries tile: show count delta vs prior month (e.g. "+12 vs last month").

Both values are already computed in `ReportService.getMonthlyInsights()` — this is a rendering-only change.

**Files:** `js/ui/summary.js`

---

### 12. Expense-to-Income Ratio — Weak Visual Hierarchy `P3`

**What:** `Expense-to-Income: 43.01%` floats as plain centred text between the tiles and the Net Worth card. It carries useful information but has no visual weight.

**Proposed fix:** Replace the text line with a thin horizontal progress bar:
- Track = full width, grey
- Fill = percentage width, coloured by BudgetStatus token (green < 75%, amber 75–100%, red > 100%)
- Label above-left: "Expense ratio" — value above-right: "43%"

**Files:** `js/ui/summary.js`, `css/styles.css`

---

## Summary Table

| # | Issue | Priority | Effort | Files |
|---|-------|----------|--------|-------|
| 1 | HTML entity double-escape | P0 | XS | `list.js` |
| 2 | Number format — en-IN with non-INR currency | P0 | XS | `renderer.js` |
| 3 | "New Journal Entry" in Simple Mode | P1 | XS | `forms.js` |
| 4 | Amount not in row header | P1 | S | `list.js` |
| 5 | DR/CR block hidden in Simple Mode | P1 | S | `list.js`, `styles.css` |
| 6 | Edit/Delete always visible | P2 | M | `list.js`, `styles.css` |
| 7 | Month filter scroll affordance | P2 | S | `list.js`, `styles.css` |
| 8 | Type label — no visual differentiation | P2 | S | `list.js`, `styles.css` |
| 9 | No Add FAB from List tab | P2 | S | `index.html`, `navigation.js`, `styles.css` |
| 10 | Net Worth label accuracy | P2 | XS | `summary.js` |
| 11 | Inconsistent trend deltas | P3 | XS | `summary.js` |
| 12 | Expense-to-income ratio progress bar | P3 | S | `summary.js`, `styles.css` |

**Effort scale:** XS = < 30 min · S = < 2 hrs · M = half day

---

## Constraints

- All changes are UI layer only (`js/ui/`, `css/`). Domain and infrastructure layers are not touched.
- No new dependencies — Vanilla JS and plain CSS only.
- All changes must respect both Simple Mode and Advanced Mode.
- Design token colours only — no new hex values in CSS.
- All interactive elements must remain keyboard-accessible (WCAG AA).

---

## Suggested Implementation Order

**Phase A — P0 bugs (ship immediately)**
1. Fix #2 number format
2. Fix #1 HTML entity

**Phase B — P1 quick wins (next minor release)**
3. Fix #3 form heading
4. Fix #4 amount in row header
5. Fix #5 DR/CR mode visibility

**Phase C — P2 polish (subsequent release)**
6. #6 Collapse Edit/Delete
7. #7 Month filter scroll hint
8. #8 Type colour dots
9. #9 FAB button
10. #10 Net Worth label

**Phase D — P3 finishing touches**
11. #11 Trend deltas
12. #12 Expense ratio bar
