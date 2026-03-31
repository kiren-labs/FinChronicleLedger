# FinChronicleLedger — Data Model & Schema

> IndexedDB schema, data structures, accounting constraints, and storage design.

---

## 1. IndexedDB Configuration

```javascript
const DB_NAME = 'FinChronicleLedgerDB';
const DB_VERSION = 1;
```

### Object Stores

| Store | keyPath | Indexes | Purpose |
|-------|---------|---------|---------|
| `accounts` | `id` | `type`, `code`, `isActive` | Chart of Accounts |
| `journal_entries` | `id` | `date`, `type`, `[date, type]` (composite), `source` | All financial entries |
| `app_settings` | `key` | — | Key-value settings store |

---

## 2. Data Structures

### 2.1 Account

```javascript
/**
 * @typedef {Object} Account
 * @property {string} id           - UUID v4 (e.g., "a1b2c3d4-...")
 * @property {number} code         - Numeric code (1000–5999)
 * @property {string} name         - Display name (e.g., "Checking Account")
 * @property {string} type         - 'asset' | 'liability' | 'equity' | 'income' | 'expense'
 * @property {string} normalBalance - 'debit' | 'credit' (derived from type)
 * @property {boolean} isActive    - Whether account appears in dropdowns
 * @property {boolean} isSystem    - System accounts cannot be deleted/deactivated
 * @property {string|null} parentId - For sub-account grouping (future use)
 * @property {number} sortOrder    - Display order within type group
 * @property {string} createdAt    - ISO 8601 timestamp
 * @property {string} updatedAt    - ISO 8601 timestamp
 */

// Example:
{
    id: "acc-checking-1100",
    code: 1100,
    name: "Checking Account",
    type: "asset",
    normalBalance: "debit",
    isActive: true,
    isSystem: false,
    parentId: null,
    sortOrder: 2,
    createdAt: "2026-02-28T10:00:00.000Z",
    updatedAt: "2026-02-28T10:00:00.000Z"
}
```

### 2.2 Journal Entry (with nested line items)

```javascript
/**
 * @typedef {Object} JournalEntry
 * @property {string} id           - UUID v4
 * @property {string} date         - 'YYYY-MM-DD' (no future dates, no pre-1900)
 * @property {string} type         - 'income' | 'expense' | 'transfer' | 'opening'
 * @property {string} description  - Transaction description / notes (max 500 chars)
 * @property {string|null} reference - Optional reference number
 * @property {string[]} tags       - Optional tags (future use, empty array for now)
 * @property {string} source       - 'user-input' | 'import' | 'migration' | 'system'
 * @property {LineItem[]} lines    - Minimum 2 line items
 * @property {string} createdAt    - ISO 8601 timestamp
 * @property {string} updatedAt    - ISO 8601 timestamp
 */

/**
 * @typedef {Object} LineItem
 * @property {string} id           - UUID v4
 * @property {string} accountId    - Reference to Account.id
 * @property {number} debit        - Debit amount (≥ 0, max 2 decimal places)
 * @property {number} credit       - Credit amount (≥ 0, max 2 decimal places)
 * @property {string} memo         - Optional line-level memo
 */

// Example: Grocery expense of ₹500 from checking
{
    id: "je-20260228-001",
    date: "2026-02-28",
    type: "expense",
    description: "Weekly groceries at FreshMart",
    reference: null,
    tags: [],
    source: "user-input",
    lines: [
        {
            id: "li-001-dr",
            accountId: "acc-groceries-5000",
            debit: 500.00,
            credit: 0,
            memo: ""
        },
        {
            id: "li-001-cr",
            accountId: "acc-checking-1100",
            debit: 0,
            credit: 500.00,
            memo: ""
        }
    ],
    createdAt: "2026-02-28T14:30:00.000Z",
    updatedAt: "2026-02-28T14:30:00.000Z"
}
```

### 2.3 App Settings (Key-Value)

```javascript
// Stored in 'app_settings' object store
{ key: "currency",              value: "INR" }
{ key: "darkMode",              value: "disabled" }
{ key: "uiMode",                value: "simple" }
{ key: "app_version",           value: "1.0.0" }
{ key: "summaryCollapsed",      value: false }
{ key: "installPromptHidden",   value: false }
{ key: "last_backup_timestamp", value: 1709136000000 }
{ key: "default_asset_account", value: "acc-checking-1100" }
{ key: "idb_initialized",       value: true }
{ key: "v3_migration_done",     value: false }
```

---

## 3. Account Type Rules

### Normal Balances

| Account Type | Code Range | Normal Balance | Debit Effect | Credit Effect |
|--------------|-----------|----------------|-------------|--------------|
| **Asset** | 1000–1999 | Debit | Increase ↑ | Decrease ↓ |
| **Liability** | 2000–2999 | Credit | Decrease ↓ | Increase ↑ |
| **Equity** | 3000–3999 | Credit | Decrease ↓ | Increase ↑ |
| **Income** | 4000–4999 | Credit | Decrease ↓ | Increase ↑ |
| **Expense** | 5000–5999 | Debit | Increase ↑ | Decrease ↓ |

### Balance Calculation

```javascript
function calculateAccountBalance(accountType, totalDebits, totalCredits) {
    // Debit-normal accounts: balance = debits - credits
    if (accountType === 'asset' || accountType === 'expense') {
        return totalDebits - totalCredits;
    }
    // Credit-normal accounts: balance = credits - debits
    return totalCredits - totalDebits;
}
```

### Accounting Equation (must always hold)

$$\text{Assets} = \text{Liabilities} + \text{Equity} + (\text{Income} - \text{Expenses})$$

Or equivalently:

$$\sum \text{Debits} = \sum \text{Credits} \quad \text{(Trial Balance)}$$

---

## 4. Validation Constraints

### Journal Entry Validation (CRITICAL — enforced before every write)

```javascript
function validateJournalEntry(entry) {
    const errors = [];
    
    // 1. Must have ≥ 2 line items
    if (!entry.lines || entry.lines.length < 2) {
        errors.push('Journal entry must have at least 2 line items');
    }
    
    // 2. Sum of debits MUST equal sum of credits
    const totalDebits = entry.lines.reduce((sum, l) => sum + l.debit, 0);
    const totalCredits = entry.lines.reduce((sum, l) => sum + l.credit, 0);
    if (Math.abs(totalDebits - totalCredits) > 0.001) {
        errors.push(`Entry is not balanced: DR ${totalDebits} ≠ CR ${totalCredits}`);
    }
    
    // 3. No line has BOTH debit > 0 AND credit > 0
    for (const line of entry.lines) {
        if (line.debit > 0 && line.credit > 0) {
            errors.push('A line item cannot have both debit and credit');
        }
    }
    
    // 4. No negative amounts
    for (const line of entry.lines) {
        if (line.debit < 0 || line.credit < 0) {
            errors.push('Amounts cannot be negative');
        }
    }
    
    // 5. All amounts to max 2 decimal places
    for (const line of entry.lines) {
        if (!isValidDecimal(line.debit) || !isValidDecimal(line.credit)) {
            errors.push('Amounts must have at most 2 decimal places');
        }
    }
    
    // 6. All referenced accounts must exist and be active
    // (checked at Application layer against DB)
    
    // 7. Date validation
    const date = new Date(entry.date);
    if (isNaN(date.getTime())) {
        errors.push('Invalid date');
    }
    const now = new Date();
    if (date > now) {
        errors.push('Future dates are not allowed');
    }
    if (date.getFullYear() < 1900) {
        errors.push('Date cannot be before 1900');
    }
    
    // 8. Type validation
    if (!['income', 'expense', 'transfer', 'opening'].includes(entry.type)) {
        errors.push('Invalid entry type');
    }
    
    // 9. Description length
    if (entry.description && entry.description.length > 500) {
        errors.push('Description cannot exceed 500 characters');
    }
    
    return { valid: errors.length === 0, errors };
}
```

### Amount Validation

```javascript
function isValidDecimal(amount) {
    return Number.isFinite(amount) && 
           Math.round(amount * 100) === amount * 100;
}

function isValidAmount(amount) {
    return Number.isFinite(amount) && 
           amount >= 0 && 
           amount <= 999999999 &&
           isValidDecimal(amount);
}
```

---

## 5. Common Transaction Patterns

### 5.1 Expense (Simple Mode)
User selects: **Expense → Groceries → ₹500**

| Line | Account | Debit | Credit |
|------|---------|-------|--------|
| 1 | 5000 Groceries | 500.00 | — |
| 2 | 1100 Checking | — | 500.00 |

### 5.2 Income (Simple Mode)
User selects: **Income → Salary → ₹50,000**

| Line | Account | Debit | Credit |
|------|---------|-------|--------|
| 1 | 1100 Checking | 50,000.00 | — |
| 2 | 4000 Salary | — | 50,000.00 |

### 5.3 Transfer
User selects: **Transfer → Checking to Savings → ₹10,000**

| Line | Account | Debit | Credit |
|------|---------|-------|--------|
| 1 | 1200 Savings | 10,000.00 | — |
| 2 | 1100 Checking | — | 10,000.00 |

*No income or expense accounts touched. P&L unaffected.*

### 5.4 Credit Card Purchase (Advanced Mode)
Dining out on credit card: ₹1,200

| Line | Account | Debit | Credit |
|------|---------|-------|--------|
| 1 | 5100 Dining Out | 1,200.00 | — |
| 2 | 2000 Credit Card | — | 1,200.00 |

*Expense increases, Liability increases. No cash movement.*

### 5.5 Credit Card Payment
Pay off ₹5,000 on credit card from checking:

| Line | Account | Debit | Credit |
|------|---------|-------|--------|
| 1 | 2000 Credit Card | 5,000.00 | — |
| 2 | 1100 Checking | — | 5,000.00 |

*Liability decreases, Asset decreases. This is NOT an expense.*

### 5.6 Opening Balance
Initial checking balance of ₹1,00,000:

| Line | Account | Debit | Credit |
|------|---------|-------|--------|
| 1 | 1100 Checking | 1,00,000.00 | — |
| 2 | 3000 Opening Balance Equity | — | 1,00,000.00 |

---

## 6. Aggregation Queries

### 6.1 Account Balance
```javascript
function getAccountBalance(accountId, journalEntries) {
    let totalDebits = 0;
    let totalCredits = 0;
    
    for (const entry of journalEntries) {
        for (const line of entry.lines) {
            if (line.accountId === accountId) {
                totalDebits += line.debit;
                totalCredits += line.credit;
            }
        }
    }
    
    return { totalDebits, totalCredits };
}
```

### 6.2 Monthly Income/Expense (for Simple Mode compatibility)
```javascript
function getMonthlyTotals(month, journalEntries, accounts) {
    const monthEntries = journalEntries.filter(e => e.date.startsWith(month));
    
    let income = 0;
    let expense = 0;
    
    for (const entry of monthEntries) {
        for (const line of entry.lines) {
            const account = accounts.find(a => a.id === line.accountId);
            if (account.type === 'income') {
                income += line.credit - line.debit; // Normal balance is credit
            } else if (account.type === 'expense') {
                expense += line.debit - line.credit; // Normal balance is debit
            }
        }
    }
    
    return { income, expense, net: income - expense };
}
```

### 6.3 Trial Balance Verification
```javascript
function verifyTrialBalance(journalEntries) {
    let totalDebits = 0;
    let totalCredits = 0;
    
    for (const entry of journalEntries) {
        for (const line of entry.lines) {
            totalDebits += line.debit;
            totalCredits += line.credit;
        }
    }
    
    const balanced = Math.abs(totalDebits - totalCredits) < 0.001;
    return { balanced, totalDebits, totalCredits, difference: totalDebits - totalCredits };
}
```

---

## 7. Storage Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Denormalized entries** | Line items nested inside journal entries | Fewer IndexedDB operations, atomic reads, simpler code. IndexedDB lacks JOINs — normalizing would require manual joins. |
| **UUID v4 for IDs** | `crypto.randomUUID()` | Collision-safe across devices, merge-friendly for future sync, no sequential dependency |
| **Settings in IndexedDB** | `app_settings` store (not localStorage) | Consolidate all data in one storage layer. localStorage used only as migration source. |
| **No separate line_items store** | Embedded in journal_entries | Avoids second lookup on every read. Trade-off: can't query individual lines by account without scanning all entries. Acceptable for <10k entries.|
| **Accounts as separate store** | Not embedded in journal entries | Accounts are reference data updated independently. Must look up account info for display. |

### When to Add Indexes
- **Immediately:** `date`, `type`, `[date, type]` on journal_entries; `type`, `code` on accounts
- **If >10k entries:** Consider `accountId` index on a denormalized line cache
- **Never premature:** Start with in-memory array scanning, add IndexedDB cursor queries only if profiling shows need

---

## 8. Data Integrity Guarantees

### Write-Time Guarantees
1. **No unbalanced entries** — `validateJournalEntry()` called before every `put()` to IndexedDB
2. **No orphan line items** — all line items embedded in parent journal entry
3. **No invalid accounts** — all `accountId` references validated against accounts store
4. **Atomic writes** — each journal entry saved in a single IndexedDB transaction

### Read-Time Guarantees
1. **Trial balance check on startup** — if unbalanced, show warning (data corruption)
2. **Account existence check** — gracefully handle missing account references (show "Unknown Account")

### Backup/Restore Guarantees
1. **Pre-restore backup** — mandatory before any restore operation
2. **Trial balance verification** — run after every restore/import
3. **Duplicate detection** — match on date + type + description + total amount
