# Changelog

All notable changes to FinChronicleLedger will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.3.0] — 2025-07-15

### Added

#### Payee Management (#8, P1)
- **Payee autocomplete** on the Add Transaction form — type to search, select, or create new payees inline
- Payee data model: `{id, name, defaultCategoryAccountId, notes, createdAt}` stored in IndexedDB `payees` store
- Full CRUD in `PayeeService`: create, update, delete, find-or-create, autocomplete search
- Spending-by-payee analysis: `getPayeeSpending(month?)` with ranked results
- **Payee management** section in Settings — list all payees with transaction counts, add/edit/delete
- Payees are automatically persisted when transactions are saved with a payee

#### Financial Goals Tracking (#10, P1)
- **New "Goals" tab** in bottom navigation with dedicated UI
- Goal cards with progress bars, percentage, current/target amounts
- Goal data model: `{id, name, targetAmount, targetDate, linkedAccountId, status, milestones, createdAt, completedAt}`
- Goal contributions stored separately: `{id, goalId, date, amount, transactionId, notes, createdAt}` in `goal_contributions` store
- Create, edit, pause, resume, and delete goals
- **Contribution flow**: add contributions with amount, date, and optional notes
- **Milestone tracking**: automatic detection of 25%, 50%, 75%, 100% milestones
- **Auto-completion**: goals automatically marked as completed when 100% is reached
- **Pace calculation**: monthly needed vs. current pace to reach target by deadline
- Click goal card to view all contributions with ability to remove individual entries

#### Transaction Reconciliation (#9, P1)
- **Reconciliation wizard** accessible from Settings tab
- Start reconciliation by selecting account, month, and opening balance
- **Import bank statement CSV** — parses Date, Description, Amount columns with date normalization
- **Auto-matching** engine: matches bank transactions to app entries by date and amount
- Matched/unmatched transaction display with unmatch capability
- **Balance comparison**: bank closing vs. app closing with difference display
- Complete reconciliation flow: draft → in-progress → completed
- Reconciliation data model stored in `reconciliations` IndexedDB store
- Support for multiple reconciliations per account (by month)

### Changed
- IndexedDB schema upgraded from v4 to v7 (v5: payees, v6: goals+contributions, v7: reconciliations)
- Service Worker cache bumped to `finchronicle-ledger-v1.3.0`
- Bottom navigation now has 6 buttons (Add, List, Groups, Reports, Goals, Settings)
- State management extended with payees, goals, contributions, and reconciliations arrays
- App initialization sequence extended to load payees, goals, and reconciliations after tags

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

#### Recurring Transactions (P0)
- **Recurring template management** in Settings — create, pause/resume, and delete templates
- Supports expense, income, and transfer types with configurable frequency (daily/weekly/monthly/quarterly/yearly)
- **Auto-create mode**: Automatically creates transactions on missed due dates when the app is opened
- **Reminder mode**: Queues pending reminders for manual confirmation/skip
- **Upcoming widget** on the dashboard summary showing next 7 days of recurring transactions
- Pending reminders shown with Confirm/Skip action buttons on the summary
- Backfill engine handles "opened app after vacation" scenario — catches up all missed due dates
- New domain layer: `js/domain/recurring.js` — frequency types, date advancement, missed/upcoming date calculation, template validation
- New application layer: `js/application/recurring-service.js` — CRUD, processUpcoming backfill, pending reminder management
- IndexedDB upgraded to v2 with `recurring_templates` and `recurring_history` stores

#### Budget Planning & Tracking (P0)
- **Monthly budget creation** in Settings — set overall cap + per-category spending limits
- Real-time **budget vs. actual** tracking with visual progress bars on the dashboard
- **Budget alerts**: toast notifications when approaching (configurable threshold) or exceeding category budgets
- Color-coded status: green (on-track), amber (approaching limit), red (over budget)
- Daily allowance calculation based on remaining budget and days left in month
- **Copy from previous month** — one-click budget duplication
- Budget templates: 50/30/20, 60/20/10/10, Zero-Based
- New domain layer: `js/domain/budget.js` — budget creation, validation, pure status calculation
- New application layer: `js/application/budget-service.js` — CRUD, status queries, alert checks
- IndexedDB upgraded to v3 with `budgets` store (unique month index)

#### Undo / Delete Recovery (P1)
- **8-second undo window** after deleting a transaction — toast shows [Undo] button
- Optimistic UI: entry removed from list immediately, IndexedDB delete deferred
- If app is closed during the window, the entry survives in IndexedDB (fail-safe)
- Toast supports action buttons (`showToast(message, type, {label, action})`)
- Delete confirmation modal updated with "8 seconds to undo" guidance

#### Account Management UI (P1)
- **Accounts section** in Settings (Advanced Mode) — grouped by type with collapsible `<details>` sections
- Per-account actions: **Edit** (rename), **Deactivate** / **Reactivate**, **Delete**
- System accounts are read-only (cannot rename, deactivate, or delete)
- **Add Custom Account** — modal form with name, type, and auto-suggested account code
- Account codes auto-assigned within standard ranges (Assets 1000–1999, Liabilities 2000–2999, etc.)
- Delete only allowed for accounts with zero transactions; accounts with history must be deactivated instead
- New service methods: `addAccount()`, `deleteAccount()`, `getNextAccountCode()`
- New infrastructure: `DB.deleteAccount()`, `State.addAccount()`, `State.removeAccount()`

#### Tags & Custom Categories (P1)
- **Tag management** in Settings — create, rename, recolor, and delete tags
- **10-color palette** picker for tag color selection
- **Tag picker** in transaction forms — toggle tags on/off as chips before saving
- **Tag badges** displayed on transactions in the list view (simple, advanced, and split items)
- **Tag filter** dropdown in the list filter bar — filter transactions by tag across all views
- Tags persist on transactions across edit/delete cycles
- Tag deletion cascades — removes tag reference from all tagged transactions
- Tag usage count shown in Settings management list
- IndexedDB upgraded to v4 with `tags` store (unique name index)
- New service: `js/application/tag-service.js` — full CRUD, tag-entry association, usage counts, tag reports

#### CSV Import (P1)
- **Import CSV** button in Settings Data section triggers file picker
- CSV parser handles quoted fields, escaped quotes, and flexible headers
- Required headers: `date`, `amount`, `type`, `category`; optional: `notes`/`description`
- **Preview panel** shows valid row count, sample data table, and error list before importing
- Validates categories against Chart of Accounts (by name or CategoryAccountMap)
- Imports as standard double-entry transactions via TransactionService
- New service: `js/application/csv-import-service.js` — parse, validate, import pipeline

#### Merge Restore (P1)
- **Restore strategy selection** — choose between "Replace All" (destructive) and "Merge" (non-destructive)
- **Merge preview** modal shows count of new entries, duplicate entries to skip, new accounts, and new tags
- Merge imports only non-duplicate entries (matched by ID), preserving all existing data
- New accounts, entries, and tags from backup are sanitized before merge
- Full backup now includes tags in the JSON export
- New methods: `previewMerge()`, `mergeFromBackup()` in ImportExportService

### Changed

- **Service Worker**: Added `search-service.js`, `recurring.js`, `recurring-service.js`, `budget.js`, `budget-service.js`, `tag-service.js`, `csv-import-service.js` to `CACHED_URLS` for offline availability
- **Service Worker**: Bumped `CACHE_NAME` and `CDN_CACHE_NAME` to `v1.2.0`
- **App startup**: Now loads recurring templates, processes missed recurring entries, loads budgets, and loads tags after first render
- **Transaction form**: Shows budget alert toast after adding/editing expense transactions
- **Full backup JSON**: Now includes `tags` array alongside accounts, entries, and settings
- **Restore from backup**: Now restores tags and supports merge strategy selection (replace-all vs merge)

### Fixed

- **CSP inline style violations**: Replaced all inline `style=""` attributes with CSS classes (`.hidden`, `.filter-disabled`) and programmatic `element.style.width` for dynamic budget bar widths — resolves `style-src 'self'` Content Security Policy errors
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
