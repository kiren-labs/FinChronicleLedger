# Changelog

All notable changes to FinChronicleLedger will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.0] — 2026-03-31

### Added

#### Full-Text Search (P0)
- **Search bar** on the List tab with debounced input (250ms) and clear button
- Search across all months — month filter is automatically bypassed during active search
- Matches transaction descriptions, line memos, account names, exact amounts, and entry types
- Result count displayed (e.g., "3 results for 'dentist'")
- Cursor position preserved across re-renders for seamless typing
- New `SearchService` in Application layer (`js/application/search-service.js`)
- Transient `_searchQuery` state in `State` — session-scoped, not persisted
- No new IndexedDB store — pure in-memory filtering over existing entries

#### Split Transactions (P0)
- **"Split this transaction"** button in Simple Mode form for expenses and income
- Dynamic split lines UI — add/remove category+amount rows (minimum 2)
- Real-time running total display as amounts are entered
- `[Split]` badge on split entries in the transaction list with per-category breakdown
- New domain helpers: `isSplitEntry()`, `getSplitBreakdown()`, `buildSplitExpense()`, `buildSplitIncome()` in Ledger
- New `createSplitTransaction()` in TransactionService
- No schema change — uses existing multi-line double-entry journal entries natively

### Changed

- **Service Worker**: Added `search-service.js` to `CACHED_URLS` for offline availability
- **Service Worker**: Bumped `CACHE_NAME` and `CDN_CACHE_NAME` to `v1.2.0`

### Fixed

- **Roadmap**: Updated Feature Overview Matrix and Implementation Priority to track completed features

---

## [1.1.0] — 2026-03-01

### Security

- **XSS prevention**: All user-supplied content rendered via `innerHTML` is now escaped through `Renderer.escapeHTML()` across list.js, reports-ui.js, groups.js, and forms.js
- **Content Security Policy**: Added `<meta http-equiv="Content-Security-Policy">` with strict `script-src 'self'` policy
- **Inline handler removal**: Removed inline `onclick` attribute from install prompt button; all event listeners are now attached programmatically
- **Backup restore hardening**: `restoreFromBackup()` now performs full structural validation, type coercion, string sanitization (via `sanitizeHTML`), and settings key whitelisting before importing any data
- **Pure sanitizeHTML**: Rewrote `validators.js:sanitizeHTML()` as a pure string-based function — removed DOM dependency (`document.createElement`) from the Domain layer
- **CSPRNG UUID fallback**: `generateId()` now falls back to `crypto.getRandomValues` instead of `Math.random` when `crypto.randomUUID()` is unavailable

### Changed

- **Architecture: Application-layer delegates** — Added `getSimpleDisplayInfo()`, `getEntryTotal()` to TransactionService and `getTopSpendingCategories()` to ReportService so UI calls Application layer instead of Domain directly
- **Architecture: Layer violation fixes** — list.js, groups.js, forms.js no longer import Domain (Ledger, Reports) directly; all access goes through Application services
- **Architecture: Infrastructure purity** — Moved `updatedAt` timestamp logic from `DB.updateAccount()` to Application layer callers (`AccountService.renameAccount/deactivateAccount/reactivateAccount`)
- **State mutation safety** — `renameAccount`, `deactivateAccount`, `reactivateAccount` now clone account objects via `Object.assign` instead of mutating in place
- **Backup reminder** — Changed `BACKUP_REMINDER_DAYS` from 7 to 30 to match documented specification
- **Service Worker CDN strategy** — CDN resources (Remix Icons) now use a separate `finchronicle-cdn-v1.0.0` cache with network-first strategy to prevent stale/compromised CDN responses from persisting
- **Error boundary** — `updateUI()` in renderer.js is now wrapped in try/catch with console.error logging

---

## [1.0.0] — 2025-07-17

### Added

#### Double-Entry Accounting Engine
- Full double-entry bookkeeping with balanced journal entries (every debit has an equal credit)
- 45 default accounts across 5 types: Assets, Liabilities, Income, Expenses, Equity
- Numbered chart of accounts (1xxx Assets, 2xxx Liabilities, 3xxx Equity, 4xxx Income, 5xxx Expenses)
- Trial balance verification — ensures total debits equal total credits
- Accounting equation enforcement: Assets = Liabilities + Equity

#### Two UX Modes
- **Simple Mode** — familiar type/amount/category/date form (auto-generates journal entries behind the scenes)
- **Advanced Mode** — multi-line journal entry editor with explicit debit/credit lines and account selection
- Seamless switch between modes; all data is shared

#### Dashboard & Summary
- Income, Expenses, Net, and Transaction Count tiles
- Month-over-month comparison with delta indicators
- Expense ratio (expenses as % of income)
- Net worth calculation (total assets minus total liabilities) in Advanced Mode

#### Transaction Management
- Create, edit, and delete transactions
- Paginated transaction list with month-based filtering
- Transaction types: Income, Expense, Transfer
- Notes/description support on every transaction

#### Grouped Views
- Group transactions by month or by category
- Top spending categories breakdown
- Budget health card with over/under indicators

#### Reports (Advanced Mode)
- Account balances by type (Assets, Liabilities, Income, Expenses, Equity)
- Full trial balance report with debit/credit columns and balance verification status

#### Multi-Currency
- 20 currencies supported: INR, USD, EUR, GBP, JPY, AUD, CAD, CHF, CNY, SEK, NZD, MXN, SGD, HKD, NOK, KRW, TRY, ZAR, BRL, THB
- Currency picker in Settings
- Formatted display with locale-aware symbols

#### Data Portability
- JSON backup export/import (full database snapshot)
- CSV export for spreadsheet compatibility
- FinChronicle v3 migration — import v3 backup and auto-map to double-entry format
- 30-day backup reminder with dismissible prompt

#### Settings & Preferences
- Dark mode toggle with system preference detection
- Currency selection
- UI mode toggle (Simple / Advanced)
- Collapsible summary dashboard

#### PWA & Offline
- Full Progressive Web App with install prompt
- Service Worker with cache-first strategy
- Works completely offline after first load
- Self-hosted Remix Icon font (no CDN dependency)

#### Infrastructure
- IndexedDB for structured data storage (journal entries, accounts, settings)
- localStorage for lightweight preferences
- 4-layer architecture: UI → Application → Domain → Infrastructure
- Zero external runtime dependencies
- Pure domain functions — testable, side-effect-free accounting logic

### Technical Notes
- Clean-room implementation based on FinChronicle v3.10.3 feature set
- All new code — not a fork or refactor of v3
- ES2020+ JavaScript with IIFE module pattern and `window.FCL` namespace
- Three-layer CSS: design tokens → component styles → dark mode overrides
