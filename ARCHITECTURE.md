# FinChronicleLedger — Architecture

> System architecture reference for the FinChronicleLedger codebase.

---

## Overview

FinChronicleLedger is a vanilla JavaScript PWA with a strict 4-layer architecture. There are **zero external runtime dependencies** — no frameworks, no build step, no bundler.

```
┌─────────────────────────────────────────────────────────────┐
│                        UI LAYER                             │
│  index.html • DOM manipulation • Event handlers • Modals    │
│  Simple Mode forms • Advanced Mode journal editor           │
│  Reports views • Settings panels • Navigation               │
├─────────────────────────────────────────────────────────────┤
│                   APPLICATION LAYER                         │
│  state.js • transaction-service • account-service           │
│  report-service • migration-service • import-export-service │
│  backup-service • settings-service                          │
├─────────────────────────────────────────────────────────────┤
│                     DOMAIN LAYER                            │
│  accounting.js • ledger.js • reports.js • types.js          │
│  chart-of-accounts.js • validators.js                       │
│  *** Pure functions — no side effects, no I/O ***           │
├─────────────────────────────────────────────────────────────┤
│                 INFRASTRUCTURE LAYER                        │
│  db.js (IndexedDB) • storage.js (localStorage)             │
│  file-io.js (CSV/JSON) • sw.js (Service Worker)            │
└─────────────────────────────────────────────────────────────┘
```

---

## Dependency Rules

1. **UI → Application → Domain → Infrastructure** (top-down only)
2. **Domain layer NEVER imports from UI or Application**
3. **Infrastructure layer has no business logic**
4. **Domain functions are pure** — given inputs, return outputs, no side effects
5. **Application layer orchestrates** — calls Domain for logic, Infrastructure for I/O

---

## Module Pattern

All files use an IIFE (Immediately Invoked Function Expression) pattern that attaches to the global `window.FCL` namespace:

```javascript
(function (global) {
    'use strict';

    // Lazy references to other modules
    const State = () => global.FCL.State;
    const AccountService = () => global.FCL.AccountService;

    function doSomething() { /* ... */ }

    // Export
    global.FCL = global.FCL || {};
    global.FCL.MyModule = { doSomething };
})(window);
```

Lazy references (`() => global.FCL.X`) resolve dependencies at call-time rather than load-time, allowing scripts to load in any order as long as dependencies exist before first use. The script loading order in `index.html` ensures this.

---

## Layer Details

### UI Layer (`js/ui/`)

| Module | Responsibility |
|--------|---------------|
| `renderer.js` | Master `updateUI()` coordinator, mode-aware rendering, toast notifications, formatting helpers, `escapeHTML()` utility, error boundaries |
| `forms.js` | Simple Mode form (type toggle → amount → category → date) and Advanced Mode journal editor (multi-line debit/credit) |
| `list.js` | Paginated transaction list with month filters, edit/delete actions |
| `summary.js` | Dashboard tiles (income, expenses, net, count), MoM trends, expense ratio, net worth |
| `groups.js` | Grouped views (by month, by category), budget health card, top spending categories |
| `reports-ui.js` | Account balances report, trial balance table (Advanced Mode) |
| `modals.js` | Delete confirmation, restore confirmation, currency picker |
| `navigation.js` | Bottom nav tab switching, mode-aware tab visibility |
| `settings-ui.js` | Settings panel: mode toggle, dark mode, currency, data export/import, FAQ |

**Key pattern:** UI layer only calls Application services. It never calls Domain or Infrastructure directly. All user-supplied content rendered via `innerHTML` is escaped through `Renderer.escapeHTML()` to prevent XSS.

### Application Layer (`js/application/`)

| Service | Responsibility |
|---------|---------------|
| `state.js` | In-memory state (entries, accounts, settings, current month/page). Notifies UI on changes via `updateUI()`. |
| `transaction-service.js` | Create, edit, delete transactions. Builds journal entries from Simple Mode input. Validates via Domain. Persists via Infrastructure. Provides display-info delegates for UI. |
| `account-service.js` | CRUD for accounts. Seeds default Chart of Accounts on first run. |
| `report-service.js` | Orchestrates report generation: monthly summaries, trial balance, budget health, top spending categories. Delegates math to Domain. |
| `migration-service.js` | Imports FinChronicle v3 backup, maps categories → accounts, generates journal entries. |
| `import-export-service.js` | CSV export/import, full JSON backup creation/restoration with comprehensive validation and sanitization of all imported data. |
| `backup-service.js` | Tracks backup timestamps, 30-day reminder logic, backup status. |
| `settings-service.js` | Currency, dark mode, UI mode (simple/advanced), install prompt. |

### Domain Layer (`js/domain/`)

| Module | Responsibility |
|--------|---------------|
| `types.js` | Constants: account types, entry types, category maps, currency definitions, validation limits |
| `validators.js` | Input validation: amounts, dates, notes length, pure XSS sanitization (no DOM dependency), CSPRNG-backed UUID generation |
| `accounting.js` | Core accounting: balance calculations, trial balance verification, accounting equation checks |
| `ledger.js` | Journal entry creation, debit/credit rules, entry transformation, display info extraction |
| `chart-of-accounts.js` | 45 default accounts across 5 types, numbering scheme (1xxx–5xxx), account rules |
| `reports.js` | Pure report calculations: monthly summaries, MoM trends, expense ratios, budget health, top categories |

**Critical invariant:** Every function in the Domain layer is pure. No IndexedDB, no localStorage, no DOM, no fetch. This makes the accounting engine independently testable and trustworthy.

### Infrastructure Layer (`js/infrastructure/`)

| Module | Responsibility |
|--------|---------------|
| `db.js` | IndexedDB wrapper: database initialization, schema migrations, CRUD for `journal_entries`, `accounts`, `app_settings` stores. Pure I/O — no business logic (callers set timestamps). |
| `storage.js` | localStorage wrapper for lightweight settings (currency, theme, version, backup timestamp, summary collapsed state) |
| `file-io.js` | File operations: CSV generation, CSV parsing, file download triggers, file reading |
| `sw.js` | Service Worker: precache all assets on install, cache-first fetch for app shell, network-first fetch for CDN resources (separate cache), old cache cleanup on activate |

---

## Data Flow Examples

### Simple Mode: Add Expense

```
User: Type=Expense, Amount=₹500, Category=Groceries, Date=2026-03-01

UI (forms.js)
  → TransactionService.createSimpleTransaction()
    → AccountService: resolve "Groceries" → account ID 5001
    → AccountService: get default asset account → "Cash" (1001)
    → Domain Ledger: build journal entry
        DR  5001 Groceries   ₹500
        CR  1001 Cash        ₹500
    → Domain Validators: validate entry (balanced? amounts valid? date ok?)
    → Infrastructure DB: persist journal entry to IndexedDB
    → State: add entry to in-memory list
  → UI Renderer: updateUI() → re-render summary + list
  → UI Toast: "Transaction added!" (success)
```

### Advanced Mode: Journal Entry

```
User: Date=2026-03-01, Type=Expense, Description="Office supplies"
  Line 1: DR  5003 Office Supplies   ₹1200
  Line 2: CR  1001 Cash              ₹1200

UI (forms.js)
  → TransactionService.createAdvancedTransaction()
    → Domain Validators: validate lines (balanced? accounts exist?)
    → Domain Ledger: verify debit total = credit total
    → Infrastructure DB: persist to IndexedDB
    → State: update in-memory entries
  → UI Renderer: updateUI()
```

### Tab Switch

```
User taps "List" nav button

Navigation.switchTab('list')
  → Toggle .tab-content.active
  → Toggle .nav-btn.active
  → Renderer.updateUI()
    → getActiveTab() → 'list'
    → List.render(mode) → renderFilters() + renderTransactionList()
    → Summary.render(mode) (if applicable)
```

---

## Storage Architecture

### IndexedDB (`FinChronicleLedgerDB` v1)

| Store | Key | Indexes | Purpose |
|-------|-----|---------|---------|
| `journal_entries` | `id` (UUID) | `date`, `type`, `createdAt` | All transactions as balanced journal entries |
| `accounts` | `id` (UUID) | `code`, `type`, `isActive` | Chart of accounts |
| `app_settings` | `key` (string) | — | Arbitrary key-value settings |

### localStorage

| Key | Type | Purpose |
|-----|------|---------|
| `fcl_currency` | string | Selected currency code (e.g., "INR") |
| `fcl_theme` | string | "light" or "dark" |
| `fcl_ui_mode` | string | "simple" or "advanced" |
| `fcl_summary_collapsed` | boolean | Whether summary dashboard is collapsed |
| `fcl_last_backup` | ISO date | Timestamp of last backup |
| `fcl_version` | string | Installed app version for update detection |

---

## Script Loading Order

Scripts are loaded via `<script>` tags in `index.html` in strict dependency order:

```
1. Domain layer (no dependencies between each other)
   types.js → validators.js → accounting.js → ledger.js →
   chart-of-accounts.js → reports.js

2. Infrastructure layer (depends on types)
   db.js → storage.js → file-io.js

3. Application layer (state first, then services)
   state.js → transaction-service.js → account-service.js →
   report-service.js → migration-service.js →
   import-export-service.js → backup-service.js → settings-service.js

4. UI layer (depends on Application)
   renderer.js → forms.js → list.js → summary.js →
   groups.js → reports-ui.js → modals.js → navigation.js →
   settings-ui.js

5. Entry point
   app.js (initializes everything)
```

---

## CSS Architecture

Three-layer CSS with no preprocessor:

| Layer | File | Purpose |
|-------|------|---------|
| 1 | `css/tokens.css` | Design tokens (colors, spacing, typography, shadows, radii) |
| 2 | `css/styles.css` | Component styles using token references |
| 3 | `css/dark-mode.css` | Dark theme overrides via `[data-theme="dark"]` on `<html>` |

All values reference CSS custom properties from `tokens.css`. Responsive breakpoints at 480px and 360px.

---

## PWA Strategy

- **Install:** `manifest.json` with standalone display, portrait orientation, app shortcuts
- **Caching:** Service Worker precaches all ~35 static assets on install. CDN resources (icons) use a separate network-first cache.
- **Fetch:** Cache-first strategy for same-origin GET requests; network-first for CDN resources; network fallback for uncached same-origin
- **Icons:** Self-hosted Remix Icon font (no CDN) for offline reliability
- **Updates:** Version check on load, new SW detection triggers update prompt

---

## Security Model

| Concern | Mitigation |
|---------|-----------|
| Data privacy | All data in IndexedDB/localStorage — never transmitted |
| CSP | Content-Security-Policy meta tag: `script-src 'self'`, restricts styles/fonts to self + CDN |
| XSS | All user-supplied `innerHTML` escaped via `Renderer.escapeHTML()`. Input sanitization in `validators.js` (pure string-based — no DOM). Backup restore validates and sanitizes all imported strings. |
| Injection | No `eval()`, no `innerHTML` from user-controlled data without escaping. Content-Security-Policy meta tag enforces `script-src 'self'`. No inline event handlers. |
| CDN dependency | Icon fonts loaded from CDN with network-first caching; all app code self-hosted |
| HTTPS | Required for Service Worker; GitHub Pages provides it automatically |

---

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| No framework | Vanilla JS | Zero-dependency philosophy, full control, no supply chain risk |
| IIFE modules | `window.FCL` namespace | No bundler needed, works with plain `<script>` tags |
| IndexedDB over localStorage | Primary storage | Structured data, transaction support, no 5MB limit |
| Double-entry from day one | Core architecture | Impossible to have unbalanced data; enables future financial reports |
| Two UX modes | Progressive disclosure | Casual users get simplicity; power users get precision |
| Self-hosted icons | `vendor/remixicon/` | Eliminates CDN tracking prevention issues, works offline |

---

## Further Reading

- [Blueprint: Project Overview](docs/FinChronicleLedger/00-PROJECT-OVERVIEW.md)
- [Blueprint: Data Model](docs/FinChronicleLedger/02-DATA-MODEL.md)
- [Blueprint: Chart of Accounts](docs/FinChronicleLedger/03-CHART-OF-ACCOUNTS.md)
- [Blueprint: UX Modes](docs/FinChronicleLedger/04-UX-MODES.md)
- [Blueprint: Accounting Rules](docs/FinChronicleLedger/08-ACCOUNTING-RULES.md)
