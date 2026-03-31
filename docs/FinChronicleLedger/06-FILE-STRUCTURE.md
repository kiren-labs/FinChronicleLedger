# FinChronicleLedger — File Structure

> Project directory layout with module responsibilities. Zero build step, zero dependencies.

---

## 1. Directory Layout

```
finchronicle-ledger/
│
├── index.html                          # Single-page app shell
├── manifest.json                       # PWA manifest
├── sw.js                               # Service Worker
├── robots.txt                          # Search engine directives
│
├── css/
│   ├── tokens.css                      # Design tokens (colors, spacing, typography)
│   ├── styles.css                      # All component styles, responsive, animations
│   └── dark-mode.css                   # Dark theme overrides
│
├── js/
│   ├── app.js                          # Entry point: init, event binding, tab management
│   │
│   ├── domain/                         # Pure business logic (no I/O, no DOM)
│   │   ├── types.js                    # Constants, enums, type definitions
│   │   ├── accounting.js               # Balance calculations, trial balance, accounting equation
│   │   ├── ledger.js                   # Journal entry creation, validation, transformation
│   │   ├── chart-of-accounts.js        # Default account definitions, numbering, seeding
│   │   ├── validators.js               # Input validation: amounts, dates, XSS sanitization
│   │   └── reports.js                  # Report calculations: summaries, trends, budget health
│   │
│   ├── application/                    # Use-case orchestration (calls Domain + Infrastructure)
│   │   ├── transaction-service.js      # Create/edit/delete transactions (Simple & Advanced)
│   │   ├── account-service.js          # Account CRUD, balance queries, seeding
│   │   ├── report-service.js           # Report orchestration: insights, trial balance, statements
│   │   ├── migration-service.js        # v3 → v4 migration logic
│   │   ├── import-export-service.js    # CSV export/import, backup creation/restoration
│   │   ├── backup-service.js           # Backup timestamp tracking, reminder logic
│   │   └── settings-service.js         # Currency, theme, version, mode management
│   │
│   ├── infrastructure/                 # Storage and I/O (no business logic)
│   │   ├── db.js                       # IndexedDB init, CRUD, migrations, bulk ops
│   │   ├── storage.js                  # localStorage wrapper (settings only)
│   │   └── file-io.js                  # CSV generation, parsing, download triggers
│   │
│   └── ui/                             # DOM rendering and event handling
│       ├── renderer.js                 # Master updateUI(), sub-renderers
│       ├── forms.js                    # Simple Mode form, Advanced Mode journal editor
│       ├── list.js                     # Transaction list, filtering, pagination
│       ├── summary.js                  # Summary dashboard, compact view, actionable tiles
│       ├── groups.js                   # Grouped views, insights, budget health card
│       ├── reports-ui.js              # Account balances, trial balance, statements (Adv Mode)
│       ├── modals.js                   # All modals: delete, restore, currency, migration wizard
│       ├── navigation.js              # Tab switching, bottom nav, mode toggle
│       └── settings-ui.js            # Settings tab rendering, FAQ, backup status
│
├── icons/
│   ├── icon-192.png                    # PWA icon 192×192
│   ├── icon-512.png                    # PWA icon 512×512
│   └── icon-512-maskable.png           # Maskable icon for Android
│
├── docs/                               # Project documentation
│   ├── 00-PROJECT-OVERVIEW.md
│   ├── 01-ARCHITECTURE.md
│   ├── 02-DATA-MODEL.md
│   ├── 03-CHART-OF-ACCOUNTS.md
│   ├── 04-UX-MODES.md
│   ├── 05-MIGRATION-SPEC.md
│   ├── 06-FILE-STRUCTURE.md            # This file
│   ├── 07-IMPLEMENTATION-ROADMAP.md
│   └── 08-ACCOUNTING-RULES.md
│
├── scripts/
│   ├── bump-version.sh                 # Version bump automation
│   ├── release.sh                      # Release process
│   └── validate-local.sh              # Local validation checks
│
├── ARCHITECTURE.md
├── CHANGELOG.md
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── LICENSE
├── README.md
├── SECURITY.md
├── SETUP.md
└── VERSION.md
```

---

## 2. Module Responsibilities

### 2.1 Entry Point: `js/app.js`

```javascript
// Responsibilities:
// 1. Initialize IndexedDB
// 2. Seed accounts (first run)
// 3. Load all data into memory
// 4. Bind event listeners
// 5. Check app version
// 6. Load preferences (theme, currency, mode)
// 7. Render initial UI
// 8. Register Service Worker

// Does NOT contain business logic or rendering logic
// Orchestrates startup by calling Application and UI modules
```

### 2.2 Domain Layer

#### `domain/types.js`
```javascript
// Account types: 'asset', 'liability', 'equity', 'income', 'expense'
// Entry types: 'income', 'expense', 'transfer', 'opening'
// Entry sources: 'user-input', 'import', 'migration', 'system'
// Category-to-account mapping for Simple Mode
// Currency definitions (20 currencies)
// Constants: MAX_AMOUNT, MAX_NOTES_LENGTH, MIN_DATE_YEAR
```

#### `domain/accounting.js`
```javascript
// calculateAccountBalance(type, debits, credits) → number
// verifyTrialBalance(entries) → { balanced, debits, credits, diff }
// verifyAccountingEquation(accounts, entries) → boolean
// calculateNetWorth(accounts, entries) → number
// getAccountTotals(accountId, entries) → { debits, credits, balance }
```

#### `domain/ledger.js`
```javascript
// createJournalEntry(type, date, description, lines) → JournalEntry
// validateJournalEntry(entry) → { valid, errors }
// buildSimpleEntry(type, amount, categoryAccountId, assetAccountId, date, notes) → JournalEntry
// buildTransferEntry(amount, fromAccountId, toAccountId, date, notes) → JournalEntry
// buildOpeningBalanceEntry(balances, date) → JournalEntry
```

#### `domain/chart-of-accounts.js`
```javascript
// DEFAULT_ACCOUNTS → Array<Account>
// getAccountByCode(code) → Account
// getAccountsByType(type) → Account[]
// getNormalBalance(accountType) → 'debit' | 'credit'
// MIGRATION_CATEGORY_MAP → { [v3Category]: { accountCode, accountName } }
```

#### `domain/validators.js`
```javascript
// validateAmount(amount) → { valid, error }
// validateDate(date) → { valid, error }
// validateNotes(notes) → { valid, sanitized }
// sanitizeHTML(str) → string
// isValidDecimal(amount) → boolean
```

#### `domain/reports.js`
```javascript
// getMonthlyTotals(month, entries, accounts) → { income, expense, net, count }
// getMoMDelta(current, previous) → { pct, direction }
// getExpensePercentage(expense, income) → number | null
// getTopSpendingCategories(month, entries, accounts, limit) → Array
// calculateBudgetHealth(month, entries, accounts) → { pace, projected, status }
// getAvailableMonths(entries) → string[]
```

### 2.3 Application Layer

#### `application/transaction-service.js`
```javascript
// createTransaction(formData, mode) → Promise<JournalEntry>
//   - In Simple Mode: builds entry from type/amount/category/date/notes
//   - In Advanced Mode: accepts raw journal entry lines
//   - Validates via Domain, persists via Infrastructure
//
// editTransaction(id, formData, mode) → Promise<JournalEntry>
// deleteTransaction(id) → Promise<void>
// getTransactions(filters) → JournalEntry[]
// getTransactionById(id) → JournalEntry | null
```

#### `application/account-service.js`
```javascript
// seedDefaultAccounts() → Promise<void>
// getAllAccounts() → Account[]
// getActiveAccounts() → Account[]
// getAccountsByType(type) → Account[]
// renameAccount(id, newName) → Promise<void>
// deactivateAccount(id) → Promise<void>
// reactivateAccount(id) → Promise<void>
// getAccountBalance(id) → number
// getAllBalances() → Map<accountId, balance>
```

#### `application/report-service.js`
```javascript
// getMonthlyInsights(month) → InsightsData
// getTrialBalance() → TrialBalanceData
// getAccountBalancesReport() → AccountBalancesData
// getBudgetHealth(month) → BudgetHealthData
// getGroupedByMonth() → GroupedData[]
// getGroupedByCategory() → GroupedData[]
```

#### `application/migration-service.js`
```javascript
// parseV3Backup(csvText) → V3BackupData
// migrateFromV3(backupData, openingBalances) → Promise<MigrationReport>
// detectTransfers(v3Transactions) → TransferCandidate[]
// verifyMigration() → VerificationResult
// rollbackMigration() → Promise<void>
```

### 2.4 Infrastructure Layer

#### `infrastructure/db.js`
```javascript
// initDB() → Promise<IDBDatabase>
// 
// Accounts:
// saveAccount(account) → Promise<void>
// getAllAccounts() → Promise<Account[]>
// updateAccount(account) → Promise<void>
// 
// Journal Entries:
// saveJournalEntry(entry) → Promise<void>
// getJournalEntry(id) → Promise<JournalEntry>
// getAllJournalEntries() → Promise<JournalEntry[]>
// deleteJournalEntry(id) → Promise<void>
// bulkSaveJournalEntries(entries) → Promise<void>
// clearAllJournalEntries() → Promise<void>
//
// Settings:
// getSetting(key) → Promise<any>
// setSetting(key, value) → Promise<void>
```

#### `infrastructure/storage.js`
```javascript
// Thin wrapper for localStorage (used only during migration from v3)
// get(key) → string | null
// set(key, value) → void
// remove(key) → void
```

#### `infrastructure/file-io.js`
```javascript
// generateCSV(headers, rows) → string
// parseCSV(text) → string[][]
// triggerDownload(content, filename, mimeType) → void
// readFile(file) → Promise<string>
// generateBackupMetadata(appVersion, currency, entries) → string
```

### 2.5 UI Layer

#### `ui/renderer.js`
```javascript
// updateUI() — Master refresh function
// updateForMode(mode) — Show/hide mode-specific elements
```

#### `ui/forms.js`
```javascript
// initSimpleForm() — Set up income/expense/transfer toggle, category dropdown
// initAdvancedForm() — Set up multi-line journal editor with balance indicator
// handleFormSubmit(event) — Collect form data, call TransactionService
// resetForm() — Clear form, reset date to today
// populateFormForEdit(entry) — Fill form for editing existing entry
```

#### `ui/list.js`
```javascript
// renderTransactionList(entries, mode) — Paginated list (Simple or Advanced view)
// renderFilters(months, categories) — Month buttons + category dropdown
// handleFilter(type, value) — Apply filter, reset page, re-render
// handlePagination(direction) — Next/prev page
```

---

## 3. Script Loading Order

Since there's no build step, scripts load via `<script>` tags in dependency order:

```html
<!-- Domain layer (pure logic, no dependencies) -->
<script src="js/domain/types.js"></script>
<script src="js/domain/validators.js"></script>
<script src="js/domain/accounting.js"></script>
<script src="js/domain/ledger.js"></script>
<script src="js/domain/chart-of-accounts.js"></script>
<script src="js/domain/reports.js"></script>

<!-- Infrastructure layer (depends on types) -->
<script src="js/infrastructure/db.js"></script>
<script src="js/infrastructure/storage.js"></script>
<script src="js/infrastructure/file-io.js"></script>

<!-- Application layer (depends on Domain + Infrastructure) -->
<script src="js/application/transaction-service.js"></script>
<script src="js/application/account-service.js"></script>
<script src="js/application/report-service.js"></script>
<script src="js/application/migration-service.js"></script>
<script src="js/application/import-export-service.js"></script>
<script src="js/application/backup-service.js"></script>
<script src="js/application/settings-service.js"></script>

<!-- UI layer (depends on Application) -->
<script src="js/ui/renderer.js"></script>
<script src="js/ui/forms.js"></script>
<script src="js/ui/list.js"></script>
<script src="js/ui/summary.js"></script>
<script src="js/ui/groups.js"></script>
<script src="js/ui/reports-ui.js"></script>
<script src="js/ui/modals.js"></script>
<script src="js/ui/navigation.js"></script>
<script src="js/ui/settings-ui.js"></script>

<!-- Entry point (orchestrates everything) -->
<script src="js/app.js"></script>
```

### Module Communication Pattern (IIFE)

Each file wraps its exports in an IIFE that attaches to a global namespace:

```javascript
// js/domain/accounting.js
(function(global) {
    'use strict';
    
    const Accounting = {
        calculateAccountBalance(type, debits, credits) {
            if (type === 'asset' || type === 'expense') {
                return debits - credits;
            }
            return credits - debits;
        },
        
        verifyTrialBalance(entries) { /* ... */ },
    };
    
    global.FCL = global.FCL || {};
    global.FCL.Accounting = Accounting;
    
})(window);
```

**Namespace:** `window.FCL` (FinChronicleLedger)
- `FCL.Types`, `FCL.Validators`, `FCL.Accounting`, `FCL.Ledger`
- `FCL.DB`, `FCL.Storage`, `FCL.FileIO`
- `FCL.TransactionService`, `FCL.AccountService`, etc.
- `FCL.UI.Renderer`, `FCL.UI.Forms`, etc.

---

## 4. File Size Budget

| Layer | Est. Lines | Est. Size (minified) |
|-------|------------|---------------------|
| Domain (6 files) | ~1,200 | ~8 KB |
| Infrastructure (3 files) | ~400 | ~3 KB |
| Application (7 files) | ~1,000 | ~7 KB |
| UI (9 files) | ~2,000 | ~14 KB |
| Entry point | ~100 | ~1 KB |
| **Total JS** | **~4,700** | **~33 KB** |
| CSS (3 files) | ~2,800 | ~20 KB |
| HTML | ~500 | ~5 KB |
| **Grand Total** | **~8,000** | **~58 KB** |

*Target: <15 KB gzipped for all JS. <25 KB gzipped total.*

---

## 5. Service Worker Cache List

```javascript
const CACHE_NAME = 'finchronicle-ledger-v1.0.0';
const CACHED_URLS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/css/tokens.css',
    '/css/styles.css',
    '/css/dark-mode.css',
    '/js/app.js',
    '/js/domain/types.js',
    '/js/domain/validators.js',
    '/js/domain/accounting.js',
    '/js/domain/ledger.js',
    '/js/domain/chart-of-accounts.js',
    '/js/domain/reports.js',
    '/js/infrastructure/db.js',
    '/js/infrastructure/storage.js',
    '/js/infrastructure/file-io.js',
    '/js/application/transaction-service.js',
    '/js/application/account-service.js',
    '/js/application/report-service.js',
    '/js/application/migration-service.js',
    '/js/application/import-export-service.js',
    '/js/application/backup-service.js',
    '/js/application/settings-service.js',
    '/js/ui/renderer.js',
    '/js/ui/forms.js',
    '/js/ui/list.js',
    '/js/ui/summary.js',
    '/js/ui/groups.js',
    '/js/ui/reports-ui.js',
    '/js/ui/modals.js',
    '/js/ui/navigation.js',
    '/js/ui/settings-ui.js',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/icons/icon-512-maskable.png',
];
```
