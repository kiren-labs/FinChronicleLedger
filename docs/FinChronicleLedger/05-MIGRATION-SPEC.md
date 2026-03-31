# FinChronicleLedger — v3 Migration Specification

> One-way migration from FinChronicle v3 single-entry to FinChronicleLedger double-entry.

---

## 1. Migration Strategy

### Approach: One-Way Migration (Recommended)
- v3 data is read, converted to journal entries, and written to the new database
- v3 data is kept as a read-only backup (never modified)
- No dual-write, no parallel systems, no feature flags
- Single source of truth after migration completes

### Why Not Parallel Systems?
- Dual-write consistency is extremely hard (every write must go to both systems)
- Maintaining two code paths doubles bugs and test surface
- Users get confused about which system is "real"
- Deprecation never happens — one system becomes the neglected one

---

## 2. Migration Flow

```
┌─────────────────────────┐
│  User opens              │
│  FinChronicleLedger     │
│  for first time          │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐     ┌─────────────────┐
│  Any v3 backup to       │ No  │  Fresh start     │
│  import?                │────▶│  (Opening Balance │
│                         │     │   Wizard)         │
└─────────┬───────────────┘     └─────────────────┘
          │ Yes
          ▼
┌─────────────────────────┐
│  Step 1:                 │
│  Parse v3 backup CSV     │
│  (with metadata)         │
└─────────┬───────────────┘
          ▼
┌─────────────────────────┐
│  Step 2:                 │
│  Seed Chart of Accounts  │
│  (45 default accounts)   │
└─────────┬───────────────┘
          ▼
┌─────────────────────────┐
│  Step 3: (Optional)      │
│  Opening Balance Wizard  │
│  (current balances)      │
└─────────┬───────────────┘
          ▼
┌─────────────────────────┐
│  Step 4:                 │
│  Convert each v3         │
│  transaction →           │
│  journal entry           │
└─────────┬───────────────┘
          ▼
┌─────────────────────────┐
│  Step 5:                 │
│  Verify trial balance    │
│  (must be zero diff)     │
└─────────┬───────────────┘
          ▼
┌─────────────────────────┐
│  Step 6:                 │
│  Show migration report   │
│  (counts, errors, totals)│
└─────────────────────────┘
```

---

## 3. v3 Transaction Conversion Rules

### 3.1 Expense Transaction

**v3 Input:**
```javascript
{
    id: 1709136000000,
    type: "expense",
    amount: 500,
    category: "Groceries",
    date: "2026-02-28",
    notes: "Weekly groceries",
    createdAt: "2026-02-28T14:30:00.000Z"
}
```

**v4 Output:**
```javascript
{
    id: "je-uuid-here",
    date: "2026-02-28",
    type: "expense",
    description: "Weekly groceries",         // from v3 notes
    reference: null,
    tags: [],
    source: "migration",                     // tagged as migrated
    lines: [
        {
            id: "li-uuid-dr",
            accountId: "acc-groceries-5000",  // mapped from v3 "Groceries"
            debit: 500.00,
            credit: 0,
            memo: "Migrated from v3 | Original category: Groceries"
        },
        {
            id: "li-uuid-cr",
            accountId: "acc-checking-1100",   // default asset account
            debit: 0,
            credit: 500.00,
            memo: ""
        }
    ],
    createdAt: "2026-02-28T14:30:00.000Z",  // preserved from v3
    updatedAt: "2026-02-28T14:30:00.000Z"
}
```

### 3.2 Income Transaction

**v3 Input:**
```javascript
{ type: "income", amount: 50000, category: "Salary", date: "2026-02-28" }
```

**v4 Output:**
```javascript
{
    type: "income",
    lines: [
        { accountId: "acc-checking-1100",  debit: 50000.00, credit: 0 },
        { accountId: "acc-salary-4000",    debit: 0,        credit: 50000.00 }
    ]
}
```

### 3.3 Conversion Rules Summary

| v3 Type | Debit Account | Credit Account |
|---------|---------------|----------------|
| expense | Mapped expense account | Default asset (1100 Checking) |
| income | Default asset (1100 Checking) | Mapped income account |

---

## 4. Category Mapping

### 4.1 Complete Mapping Table

```javascript
const MIGRATION_CATEGORY_MAP = {
    // Income categories
    'Salary':              { accountCode: 4000, accountName: 'Salary' },
    'Business':            { accountCode: 4100, accountName: 'Business Income' },
    'Investment':          { accountCode: 4200, accountName: 'Investment Returns' },
    'Rental Income':       { accountCode: 4300, accountName: 'Rental Income' },
    'Freelance':           { accountCode: 4400, accountName: 'Freelance Income' },
    'Bonus':               { accountCode: 4500, accountName: 'Bonus' },
    'Gifts/Refunds':       { accountCode: 4600, accountName: 'Gifts & Refunds Received' },
    'Other Income':        { accountCode: 4900, accountName: 'Other Income' },
    
    // Expense categories
    'Food':                { accountCode: 5100, accountName: 'Dining Out' },
    'Groceries':           { accountCode: 5000, accountName: 'Groceries' },
    'Transport':           { accountCode: 5200, accountName: 'Public Transit' },
    'Utilities/Bills':     { accountCode: 5300, accountName: 'Electricity & Water' },
    'Kids/School':         { accountCode: 5500, accountName: 'Kids & School' },
    'Fees/Docs':           { accountCode: 5600, accountName: 'Fees & Documents' },
    'Debt/Loans':          { accountCode: 5920, accountName: 'Debt & Loan Payments' },
    'Household':           { accountCode: 5940, accountName: 'Household' },
    'Other Expense':       { accountCode: 5950, accountName: 'Other Expenses' },
    'Rent':                { accountCode: 5400, accountName: 'Rent' },
    'Healthcare':          { accountCode: 5700, accountName: 'Medical & Healthcare' },
    'Personal/Shopping':   { accountCode: 5800, accountName: 'Personal & Shopping' },
    'Insurance/Taxes':     { accountCode: 5900, accountName: 'Insurance & Taxes' },
    'Savings/Investments': { accountCode: 5910, accountName: 'Savings & Investments' },
    'Charity/Gifts':       { accountCode: 5930, accountName: 'Charity & Gifts' },
    'Misc/Buffer':         { accountCode: 5950, accountName: 'Other Expenses' },
};
```

### 4.2 Unmapped Category Handling
- Unknown income categories → `4900 Other Income`
- Unknown expense categories → `5950 Other Expenses`
- Original v3 category name stored in line item memo for traceability
- Unmapped categories logged in migration report for user review

---

## 5. Opening Balance Handling

### 5.1 When User Provides Opening Balances

The wizard creates a single journal entry:

```javascript
{
    date: "2026-02-28",       // Migration date
    type: "opening",
    description: "Opening balances",
    source: "system",
    lines: [
        // Assets (debit for each positive balance)
        { accountId: "acc-checking-1100", debit: 100000, credit: 0 },
        { accountId: "acc-savings-1200",  debit: 300000, credit: 0 },
        { accountId: "acc-cash-1000",     debit: 5000,   credit: 0 },
        
        // Liabilities (credit for each balance owed)
        { accountId: "acc-cc-2000",       debit: 0,      credit: 12000 },
        
        // Equity (balancing amount)
        { accountId: "acc-obe-3000",      debit: 0,      credit: 393000 },
        // 100000 + 300000 + 5000 - 12000 = 393000
    ]
}
```

**The equity line is auto-calculated** to make the entry balance:
$$\text{Opening Balance Equity} = \sum \text{Assets} - \sum \text{Liabilities}$$

### 5.2 When User Skips Opening Balances
- No opening balance entry created
- Account balances start at zero
- User can add opening balances later via Advanced Mode

---

## 6. Transfer Detection (Bonus)

v3 users sometimes simulated transfers as paired income+expense transactions:

```
// v3: "Transfer" from checking to savings
{ type: "expense", category: "Savings/Investments", amount: 10000, date: "2026-02-15", notes: "Transfer to savings" }
```

### Detection Heuristic
During migration, look for expense transactions with:
- Category: "Savings/Investments"
- Notes containing: "transfer", "move", "shift", "savings"

**If detected**, convert to a proper transfer entry:
```javascript
{
    type: "transfer",
    lines: [
        { accountId: "acc-savings-1200",  debit: 10000, credit: 0 },
        { accountId: "acc-checking-1100", debit: 0,     credit: 10000 }
    ]
}
```

**If not detected**, convert as a normal expense (conservative — user can reclassify later).

---

## 7. Validation & Verification

### 7.1 Pre-Migration Checks
1. Parse v3 backup CSV — verify format, count rows
2. Validate all dates (parseable, within range)
3. Validate all amounts (numeric, positive, ≤ 999M)
4. Map all categories — log unmapped ones
5. Show preview to user before proceeding

### 7.2 Post-Migration Verification
1. **Trial Balance Check**: Sum(all debits) == Sum(all credits)
2. **Entry Count**: v3 transactions == v4 journal entries (±transfers)
3. **Total Verification**: Sum of v3 expenses == Sum of expense line debits
4. **Total Verification**: Sum of v3 income == Sum of income line credits
5. Show verification report to user

### 7.3 Rollback
If any verification fails:
1. Clear all journal entries from IndexedDB
2. Clear seeded accounts
3. Show error report with details
4. User retains their v3 backup CSV unchanged

---

## 8. Migration Report Schema

```javascript
{
    timestamp: "2026-02-28T15:00:00.000Z",
    v3Version: "3.10.3",
    v4Version: "1.0.0",
    
    input: {
        totalTransactions: 312,
        dateRange: { start: "2025-06-01", end: "2026-02-28" },
        incomeCount: 45,
        expenseCount: 267,
        currency: "INR"
    },
    
    output: {
        journalEntriesCreated: 312,
        openingBalanceEntry: true,
        transfersDetected: 3,
        unmappedCategories: [],
        errors: [],
    },
    
    verification: {
        trialBalanced: true,
        totalDebits: 1245000.00,
        totalCredits: 1245000.00,
        difference: 0.00
    }
}
```

---

## 9. Edge Cases

| Scenario | Handling |
|----------|---------|
| Empty v3 backup (0 transactions) | Seed accounts, skip conversion, show "No transactions to migrate" |
| v3 transaction with unknown category | Map to Other Income (4900) or Other Expenses (5950), log warning |
| v3 transaction with negative amount | Skip, log error (v3 validation should prevent this) |
| v3 transaction with future date | Accept as-is (v3 may have different date validation) |
| Duplicate v3 transactions | Detect by date+type+category+amount, skip duplicates |
| v3 backup from very old version (pre-3.5) | No metadata header — parse as plain CSV, infer format |
| v3 transactions with very long notes | Truncate to 500 chars, preserve original in line memo |
| Extremely large backup (>10k transactions) | Batch processing (100 entries per IndexedDB transaction), progress bar |
