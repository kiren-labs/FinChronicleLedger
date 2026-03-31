# FinChronicleLedger — System Architecture

> Layered architecture with strict dependency rules and zero external dependencies.

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        UI LAYER                             │
│  index.html • DOM manipulation • Event handlers • Modals    │
│  Simple Mode forms • Advanced Mode journal editor           │
│  Reports views • Settings panels                            │
├─────────────────────────────────────────────────────────────┤
│                   APPLICATION LAYER                         │
│  transaction-service • account-service • report-service     │
│  migration-service • import-export-service                  │
│  settings-service • backup-service                          │
├─────────────────────────────────────────────────────────────┤
│                     DOMAIN LAYER                            │
│  accounting.js • ledger.js • reports.js • types.js          │
│  chart-of-accounts.js • validators.js                       │
│  *** Pure functions — no side effects, no I/O ***           │
├─────────────────────────────────────────────────────────────┤
│                 INFRASTRUCTURE LAYER                        │
│  db.js (IndexedDB) • storage.js (localStorage)             │
│  file-io.js (CSV/backup) • sw.js (Service Worker)          │
└─────────────────────────────────────────────────────────────┘
```

### Dependency Rules
1. **UI → Application → Domain → Infrastructure** (top-down only)
2. **Domain layer NEVER imports from UI or Application**
3. **Infrastructure layer has no business logic**
4. **Domain functions are pure** — given inputs, return outputs, no side effects
5. **Application layer orchestrates** — calls Domain for logic, Infrastructure for I/O

---

## 2. Layer Responsibilities

### 2.1 UI Layer

| Responsibility | Details |
|----------------|---------|
| DOM rendering | Build and update HTML from state |
| Event binding | Form submissions, clicks, toggles, navigation |
| Simple Mode forms | Type-toggle → From/To account (hidden) → Amount → Category → Date → Notes |
| Advanced Mode editor | Multi-line journal entry with debit/credit columns |
| Modals | Delete confirmation, restore preview/report, currency selector, migration wizard |
| Tab management | Add, List, Groups, Reports, Settings — mobile bottom nav |
| Theme | Dark mode toggle, design token application |
| Accessibility | ARIA attributes, keyboard handlers, focus management |

**Key pattern:** UI layer calls Application services, never Domain or Infrastructure directly. All user-supplied content rendered via `innerHTML` is escaped through `Renderer.escapeHTML()` to prevent XSS.

### 2.2 Application Layer

| Service | Responsibility |
|---------|---------------|
| `transaction-service.js` | Create, edit, delete transactions. In Simple Mode: build journal entry from user input. In Advanced Mode: accept raw journal entry. Calls Domain validators, then Infrastructure to persist. Provides display-info delegates (`getSimpleDisplayInfo`, `getEntryTotal`) for UI layer. |
| `account-service.js` | CRUD for accounts (rename, deactivate, reactivate). Seed default Chart of Accounts on first run. Clones account objects before mutation. Sets `updatedAt` timestamps (not Infrastructure). |
| `report-service.js` | Orchestrate report generation: monthly summaries, trial balance, top spending categories, budget health. Delegates calculations to Domain. |
| `migration-service.js` | Import v3 FinChronicle backup, map categories to accounts, generate journal entries, verify trial balance post-migration. |
| `import-export-service.js` | CSV export/import, backup creation/restoration with full structural validation, type coercion, string sanitization, and settings key whitelisting. |
| `backup-service.js` | Track backup timestamps, reminder logic, backup status rendering. |
| `settings-service.js` | Currency management, dark mode, version checks, FAQ data. |

### 2.3 Domain Layer

| Module | Responsibility |
|--------|---------------|
| `types.js` | Type definitions and constants (account types, entry types, category maps) |
| `accounting.js` | Core accounting logic: balance calculations, trial balance verification, accounting equation checks |
| `ledger.js` | Journal entry creation, validation (balanced entries, debit/credit rules), entry transformation |
| `chart-of-accounts.js` | Default account definitions, account type rules, numbering scheme |
| `validators.js` | Input validation: amounts, dates, notes length. Pure string-based XSS sanitization (no DOM dependency). CSPRNG-backed UUID generation. |
| `reports.js` | Report calculations: monthly summaries, MoM trends, expense ratios, budget health, top categories |

**Critical invariant:** Every function in the Domain layer is pure. No IndexedDB, no localStorage, no DOM, no fetch. Given the same inputs, always returns the same outputs. This makes the accounting engine testable and trustworthy.

### 2.4 Infrastructure Layer

| Module | Responsibility |
|--------|---------------|
| `db.js` | IndexedDB initialization, CRUD operations, migrations, bulk operations. Pure I/O — no business logic (callers set timestamps). |
| `storage.js` | localStorage wrapper for settings (currency, theme, version, backup timestamp) |
| `file-io.js` | CSV generation, CSV parsing, file download triggers, file reading |
| `sw.js` | Service Worker: cache management (separate caches for app shell and CDN), offline serving with cache-first (app) and network-first (CDN) strategies, update notifications |

---

## 3. Data Flow Patterns

### 3.1 Simple Mode: Add Expense

```
User fills form: Type=Expense, Amount=500, Category=Groceries, Date=2026-02-28
    │
    ▼
UI Layer: Extract form values, call TransactionService.createSimple(...)
    │
    ▼
Application Layer (transaction-service.js):
    1. Map category "Groceries" → Account 5000 (Expense: Groceries)
    2. Determine source account → Account 1100 (Asset: Checking) [default]
    3. Build journal entry:
       DR  5000 Groceries   500.00
       CR  1100 Checking    500.00
    4. Call Ledger.validate(journalEntry) [Domain]
    5. Call DB.saveJournalEntry(journalEntry) [Infrastructure]
    6. Return success
    │
    ▼
UI Layer: Show success animation, reset form, update UI
```

### 3.2 Simple Mode: Add Income

```
User fills form: Type=Income, Amount=50000, Category=Salary, Date=2026-02-28
    │
    ▼
Application Layer:
    1. Map category "Salary" → Account 4000 (Income: Salary)
    2. Determine destination → Account 1100 (Asset: Checking) [default]
    3. Build journal entry:
       DR  1100 Checking    50000.00
       CR  4000 Salary      50000.00
    4. Validate → Save → Return
```

### 3.3 Advanced Mode: Credit Card Purchase

```
User enters journal entry directly:
    DR  5100 Dining Out     1200.00
    CR  2000 Credit Card    1200.00
    │
    ▼
Application Layer:
    1. Receive raw journal entry from Advanced Mode form
    2. Call Ledger.validate() — check balanced, check account types
    3. Save to IndexedDB
```

### 3.4 Transfer Between Accounts

```
User: Transfer 10000 from Checking to Savings
    │
    ▼
Application Layer:
    DR  1200 Savings       10000.00
    CR  1100 Checking      10000.00
    │
    Note: No income or expense accounts touched.
    Net P&L impact = 0. Net worth unchanged.
```

---

## 4. State Management

### 4.1 In-Memory State

```javascript
const AppState = {
    // Data (loaded from IndexedDB on startup)
    accounts: [],              // Full chart of accounts
    journalEntries: [],        // All journal entries (sorted by date desc)
    
    // UI State
    currentTab: 'add',         // 'add' | 'list' | 'groups' | 'reports' | 'settings'
    uiMode: 'simple',         // 'simple' | 'advanced'
    currentGrouping: 'month',  // 'month' | 'category'
    
    // Filters
    selectedMonth: 'all',
    selectedCategory: 'all',
    selectedType: 'all',       // 'all' | 'income' | 'expense' | 'transfer'
    selectedAccount: 'all',
    insightsMonth: 'current',
    
    // Pagination
    currentPage: 1,
    itemsPerPage: 20,
    
    // Edit/Delete
    editingId: null,
    deleteId: null,
    
    // App
    updateAvailable: false,
    lastBackupTimestamp: null,
};
```

### 4.2 Persisted State (localStorage)

| Key | Type | Purpose |
|-----|------|---------|
| `currency` | string | Currency code (e.g., 'INR') |
| `darkMode` | 'enabled' \| 'disabled' | Theme preference |
| `uiMode` | 'simple' \| 'advanced' | Last selected UX mode |
| `app_version` | string | For update detection |
| `summaryCollapsed` | boolean | Summary panel state |
| `installPromptHidden` | boolean | iOS prompt dismissed |
| `last_backup_timestamp` | number | Epoch milliseconds |
| `default_asset_account` | string | Default "from" account for Simple Mode expenses |

---

## 5. Rendering Strategy

### Master Update Pattern
The app uses a **single master `updateUI()` function** that cascades to all sub-renderers, identical to v3:

```javascript
function updateUI() {
    updateSummary();           // Summary cards + compact view
    updateTransactionsList();  // Filtered, paginated list
    updateMonthFilters();      // Month filter buttons
    updateCategoryFilter();    // Category dropdown
    updateGroupedView();       // Insights + grouped content
    updateAccountBalances();   // NEW: Account balance sidebar/cards
}
```

### Rendering Approach
- **No virtual DOM** — direct DOM manipulation via `innerHTML` (all user content escaped via `escapeHTML()`) and targeted updates
- **Template literals** — HTML strings built in JavaScript (same as v3)
- **Lazy rendering** — Settings tab, Reports tab content only rendered when activated
- **Minimal re-renders** — Only affected sections update (e.g., adding a transaction updates list + summary, not settings)

---

## 6. Error Handling Strategy

### Accounting Errors (Critical — Never Silent)
- Unbalanced journal entry → **Block save**, show error message
- Invalid account type → **Block save**, show error message
- These are hard failures — accounting integrity is non-negotiable

### User Input Errors (Friendly)
- Invalid amount, missing date, notes too long → Show inline validation message
- Same error handling as v3.10.2 validation layer

### Infrastructure Errors (Recoverable)
- IndexedDB write failure → Retry once, then show error toast
- CSV parse failure → Show specific parse error with line number

---

## 7. Performance Strategy

### Targets
| Operation | Target | Approach |
|-----------|--------|----------|
| App startup | <2s on mid-range mobile | Cache-first SW, minimal JS parse |
| Transaction save | <100ms | Single IndexedDB put, in-memory update |
| List render (20 items) | <50ms | Direct DOM, no diffing |
| Report generation | <300ms for 10k entries | Pre-aggregated totals, lazy compute |
| Trial balance check | <100ms for 10k entries | Single pass summation |

### Optimization Rules
1. **Start simple** — no premature optimization
2. **In-memory cache** — all journal entries loaded into memory on startup (v3 pattern)
3. **IndexedDB indexes** — on `date`, `type`, composite `[date, type]`
4. **Lazy loading** — reports computed only when tab activated
5. **Aggregation cache** — add only if >5000 entries cause measurable slowdown

---

## 8. Security Model

| Threat | Mitigation |
|--------|------------|
| XSS injection | All user-supplied `innerHTML` content escaped via `Renderer.escapeHTML()`. Input sanitized via pure `sanitizeHTML()` (no DOM). Content-Security-Policy meta tag enforces `script-src 'self'`. No inline event handlers. |
| Data exfiltration | No network calls ever. Zero fetch/XHR. Service Worker blocks unknown origins. |
| Backup injection | `restoreFromBackup()` validates structure, sanitizes all strings, coerces types, and whitelists setting keys. |
| Local storage tampering | Journal entries validated on read (trial balance check on load) |
| Prototype pollution | Strict property access, `Object.assign` from untrusted data replaced with validated cloning |
| CSV injection | Numeric fields validated, text fields escaped in CSV output |
| Weak randomness | UUID generation uses `crypto.randomUUID()` with `crypto.getRandomValues` (CSPRNG) fallback |
