# FinChronicleLedger — Feature Roadmap

**Perspective:** Accountant & Personal Finance Manager
**Date:** 2026-03-03 (Updated 2026-03-31 — gap analysis + architecture review)
**Version:** 1.1.0 → Future Releases

---

## Alignment with Feature-Gap Analysis

**Date:** 2026-03-31
**Evidence-based priorities:**

- **Recurring Transactions** (P0, v1.2.0) — Gap #1: Missing in FinChronicleLedger
- **Budget Planning** (P0, v1.2.0) — Gap #2: Missing in FinChronicleLedger
- **Search** (P0, v1.2.0) — Gap #3a: Full-text search (separated from Tags — different tools)
- **Tags & Custom Categories** (P1, v1.2.0) — Gap #3b: Multi-dimensional tagging
- **Split Transactions** (P0, v1.2.0) — UI-only; double-entry data model already supports it
- **CSV Import** (P1, v1.2.0) — Gap #5: Missing user flow
- **Merge Restore** (P1, v1.2.0) — Gap #6: Replace-all only
- **Backup UX** (P1, v1.2.0) — Gap #7: Less mature in FinChronicleLedger

**Implementation Backlog:** See [IMPLEMENTATION-BACKLOG-PHASE1-2.md](IMPLEMENTATION-BACKLOG-PHASE1-2.md) for sprint-ready Phase 1 and Phase 2 tickets, acceptance criteria, and dependencies.

---

## Executive Summary

This document outlines **17 high-value features** for FinChronicleLedger, prioritized via feature-gap analysis and architecture review.

**Changes from v1.0 of this roadmap:**
- Removed Receipt/Attachment Storage — Base64 storage overhead, iOS PWA storage eviction risk, and niche use case (primarily freelancers) make it an unfavorable complexity/value trade-off for v1.x
- Split Transactions promoted to P0 — data model is already done, only UI work remains
- Search extracted from Tags — they solve different problems with different complexity
- Added Undo/Delete Recovery — safety net for financial data, low cost
- Added Account Management UI — prerequisite for user customization
- Payee Management promoted to P1 and moved before Reconciliation
- Data model corrected throughout: no stored derived values, separate contribution store, forecasts computed not stored
- Added DB Migration Plan section
- Added Service Worker cache checklist

Features are categorized by:

- **Priority** (P0 = Critical, P1 = High, P2 = Medium, P3 = Nice-to-have)
- **Complexity** (Low, Medium, High)
- **Impact** (Business value to users)

All features maintain the app's core principles:
- 100% offline-first
- Zero backend / No tracking
- Privacy-first
- Double-entry accounting foundation

---

## Feature Overview Matrix

| # | Feature | Priority | Complexity | Impact | Release | Notes |
|---|---------|----------|------------|--------|---------|-------|
| 1 | Recurring Transactions | P0 | Medium | High | v1.2.0 | Gap #1; check on startup only |
| 2 | Budget Planning & Tracking | P0 | Medium | High | v1.2.0 | Gap #2 |
| 3 | Split Transactions | P0 | Low | High | v1.2.0 | UI-only; no schema change |
| 4 | Search (Full-Text) | P0 | Low | High | v1.2.0 | Gap #3a; no new store |
| 5 | Tags & Custom Categories | P1 | Low | Medium | v1.2.0 | Gap #3b |
| 6 | Undo / Delete Recovery | P1 | Low | High | v1.2.0 | No schema change |
| 7 | Account Management UI | P1 | Low | Medium | v1.2.0 | Prerequisite for customization |
| 4-A | CSV Import (Simple Transactions) | P1 | Low | Medium | v1.2.0 | Gap #5 |
| 4-B | Merge Restore (Non-destructive) | P1 | Medium | Medium | v1.2.0 | Gap #6 |
| 4-C | Backup Status & Reminders UX | P1 | Low | Medium | v1.2.0 | Gap #7 |
| 8 | Payee Management | P1 | Low | Medium | v1.3.0 | Prerequisite for Reconciliation |
| 9 | Transaction Reconciliation | P1 | High | High | v1.3.0 | Requires Payee Management (#8) |
| 10 | Financial Goals Tracking | P1 | Medium | High | v1.3.0 | |
| 11 | Cash Flow Forecasting | P1 | High | High | v1.4.0 | Requires Recurring (#1) |
| 12 | Tax Reporting & Categories | P2 | Medium | Medium | v1.4.0 | Builds on Tags (#5) |
| 13 | Financial Ratios Dashboard | P2 | Medium | Medium | v1.4.0 | No new stores |
| 14 | Currency Conversion with Rates | P2 | Medium | Low | v1.5.0 | Manual rates; no API |
| 15 | Custom Reports Builder | P2 | High | Medium | v1.5.0 | |
| 16 | Loan/Debt Tracking with Interest | P2 | High | High | v1.5.0 | |
| 17 | Multi-Account Consolidation View | P3 | Medium | Low | v1.6.0 | |

---

## Feature Details

---

## 1. Recurring Transactions

**Priority:** P0
**Complexity:** Medium
**Impact:** High
**Target:** v1.2.0

### Problem Statement

Most people have regular, predictable transactions: monthly salary, rent, utility bills, subscriptions, loan EMIs. Currently, users must manually enter these every month — time-consuming, error-prone, and tedious.

### Proposed Solution

1. **Template Creation** — Create from existing transaction, set frequency (Daily/Weekly/Monthly/Quarterly/Yearly), start/end date, auto-create or reminder-only
2. **Automation Options** — Auto-create on due date, reminder-only mode, create N days ahead
3. **Management Interface** — List, edit, pause/resume, delete templates, view creation history

### User Experience

#### Simple Mode
```
Settings > Recurring Transactions
  [+ Create Recurring Transaction]

Template Form:
  Type: Income / Expense / Transfer
  Amount: ₹25,000
  Category: Salary
  Frequency: Monthly
  Start Date: 2026-01-01
  Auto-create: [✓] Create automatically
  Days ahead: 0

[Save Template]
```

#### Dashboard Widget
```
Upcoming Recurring (Next 7 days):
  2026-03-05  Rent ₹15,000         [Auto]      [Edit] [Skip This Month]
  2026-03-10  Netflix ₹500         [Auto]
  2026-03-15  Electricity ₹1,200   [Reminder]
```

### Data Model

**New Store:** `recurring_templates`

```javascript
{
  id: 'uuid',
  name: 'Monthly Rent',
  type: 'expense',             // income | expense | transfer
  amount: 15000,
  categoryAccountId: 'uuid',  // expense account
  assetAccountId: 'uuid',     // cash/bank account
  frequency: 'monthly',       // daily | weekly | monthly | quarterly | yearly
  interval: 1,                 // every N periods
  startDate: '2026-01-01',
  endDate: null,
  nextDueDate: '2026-03-01',
  autoCreate: true,
  daysAhead: 0,
  notes: 'Rent for apartment',
  isActive: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z'
}
```

**New Store:** `recurring_history`

```javascript
{
  id: 'uuid',
  templateId: 'recurring_template_uuid',  // indexed
  dueDate: '2026-03-01',
  createdDate: '2026-03-01',
  transactionId: 'journal_entry_uuid',    // null if skipped
  status: 'created',                      // created | skipped | pending
  createdAt: '2026-03-01T10:00:00Z'
}
```

### Implementation Notes

**Background Job Limitation — Important**

This app is a PWA with no server. `setInterval` only fires while the app is open. For a finance app where users open it once a month, `setInterval` is not a reliable trigger. The Periodic Background Sync API has limited browser support and requires an active network connection, making it unsuitable here.

**Actual trigger model: check on every app open, backfill missed entries.**

```javascript
// app.js — on every init, not setInterval
async function init() {
  // ... existing init ...
  await RecurringScheduler.processUpcoming();
}
```

**Backfill strategy (handles the "app not opened for 2 months" case):**

```javascript
// recurring-scheduler.js
function processUpcoming() {
  const templates = DB.getActiveRecurringTemplates();
  const today = new Date();

  for (const template of templates) {
    // Collect ALL missed due dates since last processed — not just the next one
    const dueDates = getMissedDueDates(template, today);

    for (const dueDate of dueDates) {
      const alreadyProcessed = DB.hasRecurringHistoryForDate(template.id, dueDate);
      if (alreadyProcessed) continue;

      if (template.autoCreate) {
        const transaction = buildFromTemplate(template, dueDate);
        TransactionService.createSimpleTransaction(transaction);
        DB.saveRecurringHistory({
          templateId: template.id, dueDate, status: 'created'
        });
      } else {
        // Queue as pending — show in dashboard reminders
        DB.saveRecurringHistory({
          templateId: template.id, dueDate, status: 'pending'
        });
      }
    }

    // Advance nextDueDate to next future occurrence
    template.nextDueDate = getNextFutureDueDate(template, today);
    DB.updateRecurringTemplate(template);
  }
}
```

**User-facing disclosure (show once on first auto-create template):**
> "Recurring transactions are created when you open the app. If you don't open the app on the due date, missed entries are created on your next visit."

### Business Impact

- **Time savings:** ~5 minutes/month per 10 recurring transactions
- **Accuracy:** No forgotten transactions
- **Forecasting:** Enables cash flow prediction (Feature 11)

---

## 2. Budget Planning & Tracking

**Priority:** P0
**Complexity:** Medium
**Impact:** High
**Target:** v1.2.0

### Problem Statement

Users see total income, total expenses, and net savings — but cannot set spending limits by category, track progress, or get alerts when approaching limits. Budgets are fundamental to personal finance.

### Proposed Solution

1. **Budget Creation** — Monthly budget by category, overall cap, copy previous month, templates (50/30/20, zero-based)
2. **Budget Tracking** — Real-time spending vs. budget, visual progress bars, alerts at configurable threshold
3. **Budget Reports** — Variance report (budget vs. actual), trend analysis

### User Experience

#### Budget Tab
```
Monthly Budget — March 2026

  Overall: ₹50,000 budget  /  ₹32,450 spent (65%)  /  ₹17,550 remaining
  15 days left  /  Daily allowance: ₹1,170

  Groceries      ₹5,000  ████████░░░░░░  64%   On track
  Transport      ₹3,000  █████████████░  97%   Approaching limit
  Entertainment  ₹2,000  ████████████████ 125%  Over by ₹500

[Edit Budget] [Copy to Next Month] [Budget Templates]
```

#### Budget Templates
```
50/30/20 Rule    — 50% Needs / 30% Wants / 20% Savings
60/20/10/10      — 60% Living / 20% Savings / 10% Debt / 10% Fun
Zero-Based       — Every rupee assigned (Income - Expenses = 0)
Custom           — Set your own percentages
```

### Data Model

**New Store:** `budgets`

```javascript
// Store only budget targets — never store derived values
{
  id: 'uuid',
  month: '2026-03',          // YYYY-MM; unique index
  overallBudget: 50000,      // optional overall cap
  alertThreshold: 80,        // alert at N% used
  categoryBudgets: [
    { categoryAccountId: 'uuid', budgetAmount: 5000 },
    { categoryAccountId: 'uuid', budgetAmount: 3000 }
    // spentAmount and percentageUsed are NOT stored here.
    // They are calculated at query time from journal_entries.
    // Storing them would require updating the budget on every
    // transaction create/edit/delete — a hidden, error-prone coupling.
  ],
  createdAt: '2026-03-01T00:00:00Z',
  updatedAt: '2026-03-01T00:00:00Z'
}
```

### Implementation Notes

**Budget status — calculated at read time, never persisted:**

```javascript
// budget-service.js
function getBudgetStatus(month) {
  const budget = DB.getBudgetForMonth(month);
  if (!budget) return null;

  const monthEntries = State.getEntries()
    .filter(e => e.date.startsWith(month) && e.type === 'expense');

  return {
    ...budget,
    categoryBudgets: budget.categoryBudgets.map(cb => {
      const spent = monthEntries
        .flatMap(e => e.lines)
        .filter(l => l.accountId === cb.categoryAccountId)
        .reduce((sum, l) => sum + l.debit, 0);

      const pct = (spent / cb.budgetAmount) * 100;
      return {
        ...cb,
        spentAmount: spent,       // computed — not stored
        percentageUsed: pct,      // computed — not stored
        status: pct < 80 ? 'on-track' : pct < 100 ? 'approaching' : 'over'
      };
    })
  };
}
```

**Alerts on transaction create:**

```javascript
// transaction-service.js — after successful create
if (result.success && formData.type === 'expense') {
  const status = BudgetService.getBudgetStatus(currentMonth);
  const cb = status?.categoryBudgets.find(
    c => c.categoryAccountId === formData.categoryAccountId
  );
  if (cb?.status === 'approaching') {
    Renderer.showToast(
      `Budget alert: ${Math.round(cb.percentageUsed)}% used for this category`,
      'warning'
    );
  } else if (cb?.status === 'over') {
    Renderer.showToast(
      `Over budget by ${formatCurrency(cb.spentAmount - cb.budgetAmount)}`,
      'error'
    );
  }
}
```

### Business Impact

- **Financial discipline:** Users who budget save 15–20% more
- **Awareness:** Real-time feedback changes spending behavior
- **Standard feature:** Expected in all personal finance apps

---

## 3. Split Transactions

**Priority:** P0
**Complexity:** Low
**Impact:** High
**Target:** v1.2.0

### Why P0 and v1.2.0

The double-entry data model already supports multi-line entries with multiple debit accounts natively. This is **UI-only** — no new stores, no schema changes, no migration. Promoted to P0 because the implementation cost is 2–3 days of UI work with high user impact.

### Problem Statement

Real-world transactions span multiple categories:
- Grocery run: Food (₹1,500) + Household (₹500) + Medicine (₹300)
- Business trip: Transport (₹2,000) + Meals (₹1,000) + Hotel (₹3,000)

Currently, users must pick one category (inaccurate) or create multiple transactions (tedious).

### User Experience

```
Add Transaction (Simple Mode)

Type: Expense  |  Amount: ₹2,300
[Split this transaction]

  Groceries     ₹1,500   [Remove]
  Household     ₹500     [Remove]
  Healthcare    ₹300     [Remove]

  [+ Add Category]
  Total: ₹2,300 / ₹2,300  ✓

From: Cash  |  Date: 2026-03-03
[Add Transaction]
```

**In Transaction List:**
```
Mar 03  Shopping  ₹2,300  [Split]
  ▼  Groceries ₹1,500  ·  Household ₹500  ·  Healthcare ₹300
```

### Data Model

No new stores. No schema changes. The existing double-entry model handles this natively:

```javascript
{
  id: 'uuid',
  date: '2026-03-03',
  type: 'expense',
  description: 'Grocery run',
  lines: [
    { accountId: 'uuid-groceries',  debit: 1500, credit: 0, memo: 'Groceries' },
    { accountId: 'uuid-household',  debit: 500,  credit: 0, memo: 'Household' },
    { accountId: 'uuid-healthcare', debit: 300,  credit: 0, memo: 'Healthcare' },
    { accountId: 'uuid-cash',       debit: 0,    credit: 2300 }
  ]
  // No isSplit flag — derive from structure instead:
  //   isSplit = entry.lines.filter(l => l.debit > 0).length > 1
  // Storing a flag creates redundant truth that can drift from reality.
}
```

### Implementation Notes

**Transaction creation:**
```javascript
// transaction-service.js
async function createSplitTransaction(formData) {
  const splitTotal = formData.splitLines.reduce((sum, l) => sum + l.amount, 0);
  if (Math.abs(splitTotal - formData.totalAmount) > 0.01) {
    return { success: false, errors: ['Split amounts must equal total'] };
  }

  const lines = [
    ...formData.splitLines.map(s => ({
      accountId: s.categoryAccountId,
      debit: s.amount,
      credit: 0,
      memo: s.memo || ''
    })),
    { accountId: formData.assetAccountId, debit: 0, credit: formData.totalAmount }
  ];

  return createAdvancedTransaction({ ...formData, lines });
}
```

**Display helper (pure function, domain layer):**
```javascript
// domain/ledger.js
function isSplitEntry(entry) {
  return entry.lines.filter(l => l.debit > 0).length > 1;
}

function getSplitBreakdown(entry, accounts) {
  return entry.lines
    .filter(l => l.debit > 0)
    .map(l => ({
      accountName: accounts.find(a => a.id === l.accountId)?.name ?? 'Unknown',
      amount: l.debit,
      memo: l.memo
    }));
}
```

### Business Impact

- **Accuracy:** Expenses categorized correctly without workarounds
- **Reports:** Category summaries reflect reality
- **Budgets:** Budget tracking is only meaningful with accurate per-category data

---

## 4. Search (Full-Text)

**Priority:** P0
**Complexity:** Low
**Impact:** High
**Target:** v1.2.0

### Why Separate from Tags

Tags require upfront discipline — users must remember to tag every transaction. Search requires nothing. A user who typed "dentist" in the notes field 8 months ago needs to find that transaction without having tagged it first. Tags and Search solve different problems with different user effort.

### Problem Statement

The only navigation is month filter + category filter. Finding a specific past transaction requires remembering which month it was in. There is no way to search by description, notes, or amount.

### Proposed Solution

Full-text search across `description` and line `memo` fields, plus amount and date matching, all operating over in-memory state with no new store.

### User Experience

```
List Tab

[  Search transactions...  ]

Query: "dentist"

3 results for "dentist":
  Aug 14  Dentist Cleaning   ₹2,500
  May 03  Dentist X-Ray      ₹1,800
  Jan 22  Dentist Follow-up  ₹500

[Clear search]
```

**Search scope:**
- Transaction `description`
- Line `memo` fields
- Amount (exact match: "2500")
- Month shorthand: "march 2025" narrows to that month

### Data Model

No new store. Search is a filter over in-memory state.

```javascript
// state.js — add as transient UI state (not persisted)
_searchQuery: ''
// Cleared on app reload — search state is session-scoped
```

### Implementation Notes

```javascript
// application/search-service.js
function search(query, entries) {
  if (!query?.trim()) return entries;
  const q = query.toLowerCase().trim();

  return entries.filter(entry => {
    if (entry.description?.toLowerCase().includes(q)) return true;
    if (entry.lines.some(l => l.memo?.toLowerCase().includes(q))) return true;

    // Exact amount match
    const amount = parseFloat(q);
    if (!isNaN(amount)) {
      const total = entry.lines
        .filter(l => l.debit > 0)
        .reduce((s, l) => s + l.debit, 0);
      if (Math.abs(total - amount) < 0.01) return true;
    }

    return false;
  });
}
```

**Integration with existing filters:**
Search composes with month/category filters — the filtered list is then searched. If a search query is active, the month filter is widened to "All months" automatically so users don't have to know which month to look in.

### Business Impact

- **Discoverability:** Find any transaction instantly
- **Zero learning curve:** No setup, no tags needed
- **Low cost:** 1–2 day implementation on top of existing in-memory state

---

## 5. Tags & Custom Categories

**Priority:** P1
**Complexity:** Low
**Impact:** Medium
**Target:** v1.2.0

### Problem Statement

The fixed chart of accounts gives one category per transaction. Users tracking projects, clients, or cross-cutting concerns (#TaxDeductible, #Business) need flexible multi-dimensional categorization that the account hierarchy doesn't provide.

### Proposed Solution

1. **Tag Creation** — Custom tags with color and optional icon
2. **Tagging Transactions** — Multiple tags per transaction, autocomplete, create-on-the-fly
3. **Tag Reports** — Total by tag, tag trends, filter by tag in list view

### User Experience

```
Add Transaction
...
Tags: [#Business] [#ClientABC] [#TaxDeductible]  [+ Add Tag]
```

```
Settings > Tags

#Business    35 uses  Blue    [Edit] [Delete]
#Travel      18 uses  Green   [Edit] [Delete]
#ClientABC    8 uses  Purple  [Edit] [Delete]

[+ Create New Tag]
```

```
List Tab > Filters
Month: [March 2026]  Category: [All]  Tags: [#Business] [#Travel]
Showing 8 transactions
```

### Data Model

**New Store:** `tags`

```javascript
{
  id: 'uuid',
  name: 'Business',         // stored without #
  displayName: '#Business',
  color: '#3B82F6',
  icon: '🏢',               // optional
  description: '',
  createdAt: '2026-01-01T00:00:00Z'
  // usageCount NOT stored — calculated at read time:
  // State.getEntries().filter(e => e.tags?.includes(tag.id)).length
  // Storing it requires updating the tag on every tag/untag — error-prone coupling.
}
```

**Enhancement to `journal_entries`:**
```javascript
{
  // ... existing fields
  tags: ['tag-uuid-1', 'tag-uuid-2']  // array of tag IDs; optional
}
```

### Implementation Notes

```javascript
// tag-service.js
function createTag(name, color, icon) {
  const tag = {
    id: Validators.generateId(),
    name: name.replace(/^#/, ''),
    displayName: name.startsWith('#') ? name : `#${name}`,
    color: color || getDefaultColor(),
    icon: icon || '',
    description: '',
    createdAt: new Date().toISOString()
  };
  DB.saveTag(tag);
  State.addTag(tag);
  return { success: true, tag };
}

function getTagUsage(tagId) {
  return State.getEntries().filter(e => e.tags?.includes(tagId)).length;
}

function getTagReport(month) {
  const entries = State.getEntries().filter(e => e.date.startsWith(month));
  return State.getTags()
    .map(tag => {
      const tagEntries = entries.filter(e => e.tags?.includes(tag.id));
      const total = tagEntries.reduce((sum, e) => sum + Ledger.getEntryTotal(e), 0);
      return { tag, total, count: tagEntries.length };
    })
    .filter(r => r.count > 0)
    .sort((a, b) => b.total - a.total);
}
```

### Business Impact

- **Flexibility:** Multi-dimensional categorization on top of fixed accounts
- **Tax season:** Filter all #TaxDeductible transactions instantly
- **Client tracking:** Expense totals by project or client
- **Low complexity:** High value, easy to add

---

## 6. Undo / Delete Recovery

**Priority:** P1
**Complexity:** Low
**Impact:** High
**Target:** v1.2.0

### Problem Statement

Accidental deletes are permanent with no recovery path. For financial records, this erodes user trust. A user who deletes a transaction by mistake has no recourse today.

### Proposed Solution

**Soft undo via toast** — covers 90% of accidental deletes with zero schema complexity:

When a transaction is deleted, hold it in memory for 8 seconds and show an "Undo" button in the toast. If Undo is pressed, restore the entry. After 8 seconds, commit the delete to IndexedDB.

```
[Transaction deleted]  [Undo]     ← 8-second window
```

No new store. The undo buffer is transient in-memory state.

### Implementation Notes

```javascript
// application/transaction-service.js
async function deleteTransaction(id) {
  const entry = State.getEntryById(id);
  if (!entry) return { success: false, errors: ['Not found'] };

  // Remove from UI immediately (optimistic update)
  State.removeEntry(id);

  // Hold IndexedDB delete for the undo window
  const undoTimer = setTimeout(async () => {
    await DB().deleteJournalEntry(id);
  }, 8000);

  Renderer.showToast('Transaction deleted', 'info', {
    label: 'Undo',
    action: async () => {
      clearTimeout(undoTimer);
      await DB().saveJournalEntry(entry);
      State.addEntry(entry);
      Renderer.showToast('Transaction restored', 'success');
    }
  });

  return { success: true };
}
```

**Edge case:** If the app is closed within the 8-second window, the `setTimeout` is cleared by the browser. The entry was already removed from State but not yet deleted from IndexedDB — so on next open, the entry reappears from IndexedDB. This is the correct behavior (data preserved on unexpected close).

### Business Impact

- **Trust:** Users feel safe making changes knowing mistakes are recoverable
- **Data integrity:** Reduces permanent accidental data loss
- **Low cost:** ~1 day implementation, no schema changes

---

## 7. Account Management UI

**Priority:** P1
**Complexity:** Low
**Impact:** Medium
**Target:** v1.2.0

### Problem Statement

The app seeds 45 default accounts but provides no UI to add custom accounts, rename existing ones, or deactivate unused ones. A freelancer needs "Consulting Income" as a separate income account. A homeowner needs "Mortgage Payable" as a liability. There is no way to do this today.

### Proposed Solution

Add an **Accounts** section in Settings:

```
Settings > Accounts

Asset Accounts:
  1001  Cash          Active  [Edit] [Deactivate]
  1002  Savings       Active  [Edit] [Deactivate]
  1003  Checking      Active  [Edit] [Deactivate]

Income Accounts:
  4000  Salary Income     Active  [Edit] [Deactivate]
  4100  Freelance Income  Active  [Edit] [Deactivate]

  [+ Add Income Account]

[+ Add New Account]
```

**Add Account form:**
```
Account Name: [________________]
Account Type: [Asset ▼]
Account Code: [1050]  (auto-suggested: next available in range)
[Save]
```

System accounts (`isSystem: true`) are shown read-only and cannot be edited or deactivated.

### Data Model

No schema change. The existing `accounts` store already has all needed fields (`name`, `type`, `code`, `isActive`, `isSystem`). This is a pure UI + service addition.

### Implementation Notes

```javascript
// account-service.js — additions
async function addAccount({ name, type, code }) {
  const exists = State.getAccounts().find(a => a.code === code);
  if (exists) return { success: false, errors: ['Account code already in use'] };

  const account = {
    id: Validators.generateId(),
    code,
    name: sanitizeHTML(name),
    type,
    normalBalance: type === 'asset' || type === 'expense' ? 'debit' : 'credit',
    isActive: true,
    isSystem: false,
    sortOrder: code,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await DB().saveAccount(account);
  State.addAccount(account);
  return { success: true, account };
}

async function deactivateAccount(id) {
  const account = State.getAccountById(id);
  if (account.isSystem) {
    return { success: false, errors: ['System accounts cannot be deactivated'] };
  }

  const hasTransactions = State.getEntries()
    .some(e => e.lines.some(l => l.accountId === id));

  if (hasTransactions) {
    // Deactivate: hidden from dropdowns but preserved in history
    return updateAccount(id, { isActive: false });
  }

  // No transactions — safe to hard delete
  await DB().deleteAccount(id);
  State.removeAccount(id);
  return { success: true };
}
```

### Business Impact

- **Customization:** Users adapt the chart of accounts to their situation
- **Prerequisite:** Tags, Goals, and Reconciliation are more useful with accurate custom accounts
- **Freelancers/small business:** Separate income/expense tracking per client

---

## 4-A. CSV Import (Simple Transactions)

**Priority:** P1 | **Complexity:** Low | **Target:** v1.2.0

Import a standard CSV (date, description, amount, type, category) as simple transactions. Map CSV columns to app fields. Validate and preview before committing. Show per-row errors for rows that fail validation without blocking the valid rows.

**Accepted CSV format:**
```csv
date,description,amount,type,category
2026-03-01,Salary,50000,income,Salary Income
2026-03-02,Rent,15000,expense,Rent
```

All imported strings run through `sanitizeHTML()` before storage. Amounts validated against domain limits. Dates validated as ISO format.

---

## 4-B. Merge Restore (Non-destructive)

**Priority:** P1 | **Complexity:** Medium | **Target:** v1.2.0

Current restore replaces all data (destructive). Merge restore imports entries from a backup and adds only those not already present, matched by `id`. Existing entries are not overwritten. User sees a preview before committing:

```
Merge Preview:
  23 new entries will be added
  145 entries already exist (skipped)
  [Proceed with Merge]  [Cancel]
```

---

## 4-C. Backup Status & Reminders UX

**Priority:** P1 | **Complexity:** Low | **Target:** v1.2.0

Show backup status in Settings: last backup date, days since backup, prominent call-to-action. Alert banner when backup is overdue (> 30 days). Indicator on settings icon when overdue. All state stored in existing `app_settings` store — no new store needed.

---

## 8. Payee Management

**Priority:** P1
**Complexity:** Low
**Target:** v1.3.0

### Why Before Reconciliation

Reconciliation auto-matching works by `date + amount`. Bank statements include payee/description. Without payee data, two transactions on the same day with the same amount (e.g., two ₹500 expenses) cannot be disambiguated. Payee tracking directly improves match accuracy and is required for Reconciliation to work well. These two features ship in the same release.

### Problem Statement

The `description` field is free text. There is no structured payee record. Users cannot see all transactions with a given vendor, get spending-by-vendor reports, or benefit from payee-based autocomplete.

### Proposed Solution

- Structured payee records (name, optional default category hint)
- Autocomplete on transaction form (matches existing payees as user types)
- Payee history view (all transactions with a given payee)
- Vendor spending analysis

### Data Model

**New Store:** `payees`

```javascript
{
  id: 'uuid',
  name: 'Amazon',
  defaultCategoryAccountId: 'uuid',  // optional hint for autocomplete
  notes: '',
  createdAt: '2026-01-01T00:00:00Z'
}
```

**Enhancement to `journal_entries`:**
```javascript
{
  // ... existing fields
  payeeId: 'payee-uuid'  // optional
}
```

---

## 9. Transaction Reconciliation

**Priority:** P1
**Complexity:** High
**Impact:** High
**Target:** v1.3.0
**Depends on:** Feature 8 (Payee Management)

### Problem Statement

Users cannot verify all transactions are recorded, detect duplicates, or mark transactions as verified. For accountants, bank reconciliation is a critical control. The app has no way to compare recorded transactions against a bank statement.

### Proposed Solution

1. **Import Bank Statement** — Upload CSV from bank, parse transactions
2. **Matching Interface** — Side-by-side: Bank vs. App. Auto-match by date + amount + payee name. Manual match for discrepancies.
3. **Reconciliation Report** — Opening balance, matched/unmatched, closing balance, variance

### User Experience

```
Reconciliation Tab

[+ Start New Reconciliation]

Reconcile Cash Account — March 2026

  Step 1: Opening Balance
    Bank: ₹25,000  |  App: ₹25,000  |  Difference: ₹0  ✓

  Step 2: Import Bank Statement
    [Upload CSV]

  Step 3: Match Transactions

    Bank Statement              |  Your Records
    ─────────────────────────────────────────────────
    ✓ Mar-01  Salary    +50k   |  Mar-01  Salary    +50k
    ✓ Mar-02  Rent      -15k   |  Mar-02  Rent      -15k
    ? Mar-05  ATM       -5k    |  [No match]  [Create]  [Ignore]
    ✓ Mar-10  Groceries -2k    |  Mar-10  Groceries  -2k

  Step 4: Closing Balance
    Bank: ₹32,500  |  App: ₹32,700  |  Difference: -₹200

  [Mark as Reconciled]  [Save Draft]
```

### Data Model

**New Store:** `reconciliations`

```javascript
{
  id: 'uuid',
  accountId: 'uuid',
  month: '2026-03',
  openingBalance: 25000,
  closingBalance: 32500,
  bankClosingBalance: 32500,
  difference: 0,
  status: 'completed',              // draft | in-progress | completed
  matchedTransactionIds: ['uuid1', 'uuid2'],
  unmatchedAppTransactionIds: ['uuid3'],
  unmatchedBankTransactions: [
    {
      date: '2026-03-05',
      description: 'ATM Withdrawal',
      amount: -5000,
      createdTransactionId: null    // set if user creates entry from unmatched
    }
  ],
  reconciledAt: '2026-03-31T10:00:00Z',
  notes: '',
  createdAt: '2026-03-31T10:00:00Z'
}
```

**Enhancement to `journal_entries`:**
```javascript
{
  // ... existing fields
  reconciledDate: '2026-03-31T10:00:00Z',  // null if not reconciled
  reconciliationId: 'uuid'
}
```

### Implementation Notes

**Auto-matching — uses payee when available to disambiguate:**
```javascript
// reconciliation-service.js
function autoMatch(bankTxs, appEntries) {
  const matched = [];
  const unmatchedBank = [];
  const remaining = [...appEntries];

  for (const bTx of bankTxs) {
    const match = remaining.find(entry => {
      const total = Ledger.getEntryTotal(entry);
      const dateMatch = entry.date === bTx.date;
      const amountMatch = Math.abs(total - Math.abs(bTx.amount)) < 0.01;

      // Use payee name to disambiguate same date+amount transactions
      const payee = bTx.payeeName
        ? entry.description?.toLowerCase().includes(bTx.payeeName.toLowerCase())
        : true;

      return dateMatch && amountMatch && payee;
    });

    if (match) {
      matched.push({ bankTx: bTx, appEntry: match });
      remaining.splice(remaining.indexOf(match), 1);
    } else {
      unmatchedBank.push(bTx);
    }
  }

  return { matched, unmatchedBank, unmatchedApp: remaining };
}
```

### Business Impact

- **Accuracy:** Catch errors, duplicates, missing transactions
- **Trust:** Users trust the app when books reconcile against bank
- **Professional feature:** Distinguishes from casual expense trackers

---

## 10. Financial Goals Tracking

**Priority:** P1
**Complexity:** Medium
**Impact:** High
**Target:** v1.3.0

### Problem Statement

Users save money but lack structured tracking for specific goals: emergency fund, vacation, house down payment, education. Goals give purpose and direction to saving.

### User Experience

```
Goals Tab

  House Down Payment
  ₹3,50,000 / ₹10,00,000  35%  ████████░░░░░░░░░░
  Target: Dec 2027 (21 months)
  Need: ₹31,000/month  |  Pace: ₹25,000/month  Behind
  [Add Contribution] [Edit]

  Europe Vacation
  ₹1,80,000 / ₹2,50,000  72%  ████████████████░░
  Target: Jun 2026 (3 months)
  Need: ₹23,333/month  |  Pace: ₹30,000/month  On track
  [Add Contribution] [Edit]

[+ Create New Goal]
```

### Data Model

**New Store:** `financial_goals`

```javascript
{
  id: 'uuid',
  name: 'House Down Payment',
  targetAmount: 1000000,
  targetDate: '2027-12-31',
  linkedAccountId: 'uuid',
  status: 'active',           // active | paused | completed | cancelled
  milestones: [
    { percentage: 25, reachedDate: null },
    { percentage: 50, reachedDate: null },
    { percentage: 75, reachedDate: null }
  ],
  createdAt: '2026-01-01T00:00:00Z',
  completedAt: null
  // currentAmount is NOT stored — calculated from goal_contributions at read time
}
```

**New Store:** `goal_contributions` — separate store, not embedded array

```javascript
{
  id: 'uuid',
  goalId: 'financial_goal_uuid',    // indexed for fast lookup
  date: '2026-03-01',
  amount: 20000,
  transactionId: 'journal_entry_uuid',  // optional link to a journal entry
  notes: 'Bonus money',
  createdAt: '2026-03-01T00:00:00Z'
}
```

**Why a separate store, not an embedded array:**
An embedded `contributions[]` array in the goal document grows without bound — a goal tracked for 3 years holds 36+ entries. Each read of the goal loads all contributions. A separate store with a `goalId` index allows efficient lookup, keeps the goal document small, and avoids the `currentAmount` stale-data problem.

### Implementation Notes

```javascript
// goal-service.js
function calculateGoalProgress(goalId) {
  const goal = State.getGoalById(goalId);
  const contributions = State.getContributionsByGoal(goalId);
  const currentAmount = contributions.reduce((s, c) => s + c.amount, 0);

  const progress = (currentAmount / goal.targetAmount) * 100;
  const monthsRemaining = getMonthsUntil(goal.targetDate);
  const required = (goal.targetAmount - currentAmount) / monthsRemaining;

  // Pace: average monthly contribution over last 3 months
  const recentMonths = contributions.filter(c => isWithinLastNMonths(c.date, 3));
  const pace = recentMonths.reduce((s, c) => s + c.amount, 0) / 3;

  return {
    currentAmount,         // calculated — not stored
    progress,              // calculated — not stored
    monthsRemaining,
    requiredMonthly: required,
    currentPace: pace,
    paceStatus: pace >= required ? 'on-track' : 'behind'
  };
}

function addContribution(goalId, contribution) {
  DB.saveGoalContribution(contribution);
  State.addContribution(contribution);

  // Check and record milestone achievements
  const { progress } = calculateGoalProgress(goalId);
  const goal = State.getGoalById(goalId);

  for (const milestone of goal.milestones) {
    if (progress >= milestone.percentage && !milestone.reachedDate) {
      milestone.reachedDate = new Date().toISOString();
      Renderer.showToast(
        `${milestone.percentage}% milestone reached for ${goal.name}!`,
        'success'
      );
    }
  }

  DB.updateGoal(goal);
  State.updateGoal(goal);
}
```

### Business Impact

- **Motivation:** Users 3x more likely to save with specific goals
- **Engagement:** Visual progress creates a positive feedback loop
- **Planning:** Pairs directly with Cash Flow Forecasting (Feature 11)

---

## 11. Cash Flow Forecasting

**Priority:** P1
**Complexity:** High
**Impact:** High
**Target:** v1.4.0
**Depends on:** Feature 1 (Recurring Transactions)

### Problem Statement

Users only see historical data. They want to know: "Will I run out of money this month?" and "When can I afford a ₹50,000 purchase?"

### Proposed Solution

Cash flow projection using recurring transactions + historical averages, with user-created "what if" scenarios.

1. **Prediction Engine** — Recurring + historical variable expenses
2. **Scenario Planning** — User-created adjustments to the base forecast
3. **Visual Timeline** — Projected balance over 3–6 months (SVG/Canvas line chart)

### User Experience

```
Forecast Tab

Current Balance: ₹42,500
Forecast: March – May 2026

  [Line chart: projected balance month-over-month]

Upcoming (Next 30 days):
  + Mar-01  Salary       +₹50,000  (recurring, 95% confidence)
  - Mar-01  Rent         -₹15,000  (recurring)
  - Mar-05  Credit Card  -₹8,000   (recurring)
  Projected Mar-31 balance: ₹68,500

Scenarios:
  [+ What if I spend ₹20,000 on vacation?]
  [+ What if I lose my freelance income?]

Alerts:
  No alerts — balance stays positive through May 2026
```

### Data Model

**Forecasts are NOT stored — they are computed on demand.**

Storing a forecast creates stale data: every new transaction invalidates it. Forecasts are cheap to recompute from current entries + recurring templates. Recompute on every forecast tab open.

**New Store:** `forecast_scenarios` — user-created "what if" adjustments only

```javascript
{
  id: 'uuid',
  name: 'Vacation Spending',
  adjustments: [
    { date: '2026-03-15', type: 'expense', amount: 20000, description: 'Vacation' }
  ],
  createdAt: '2026-03-03T00:00:00Z'
}
```

The forecast is always recomputed from current state + recurring templates + optional scenario adjustments.

### Implementation Notes

**What is "current balance":**
Sum of all `type === 'asset'` account balances using `Accounting.getAllBalances()`. This must be defined explicitly — it is not a single magic number.

**Forecast engine (computed on demand):**
```javascript
// forecast-service.js
function generateForecast(months = 3, scenarioId = null) {
  const currentBalance = getCurrentAssetBalance();
  const recurring = DB.getActiveRecurringTemplates();
  const historical = getHistoricalAverages();
  const scenario = scenarioId ? State.getScenarioById(scenarioId) : null;

  const projections = [];
  let balance = currentBalance;

  for (let i = 1; i <= months; i++) {
    const month = getMonthOffset(i);

    const recurringIncome = sumRecurring(recurring, 'income');
    const recurringExpenses = sumRecurring(recurring, 'expense');
    const variable = historical.averageVariable;
    const scenarioAdj = scenario ? sumScenarioAdjustments(scenario, month) : 0;

    balance = balance + recurringIncome - recurringExpenses - variable + scenarioAdj;

    projections.push({
      month,
      projectedBalance: Math.round(balance),
      expectedIncome: Math.round(recurringIncome),
      expectedExpenses: Math.round(recurringExpenses + variable),
      // Confidence decreases the further out we project
      confidence: Math.max(50, historical.consistency - (i * 5))
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    currentBalance,
    projections,
    alerts: generateAlerts(projections)
  };
}

function generateAlerts(projections) {
  return projections
    .filter(p => p.projectedBalance < 10000)
    .map(p => ({
      type: p.projectedBalance < 0 ? 'danger' : 'warning',
      month: p.month,
      message: p.projectedBalance < 0
        ? `Balance may go negative in ${p.month}`
        : `Low balance warning: ${formatCurrency(p.projectedBalance)} in ${p.month}`
    }));
}
```

### Business Impact

- **Financial awareness:** See problems before they happen
- **Decision support:** Concrete "can I afford this?" answer
- **Premium feature:** Differentiates from basic expense trackers

---

## 12–17: Feature Summaries

---

## 12. Tax Reporting & Categories

**Priority:** P2 | **Complexity:** Medium | **Target:** v1.4.0

Mark transactions as tax-deductible by tagging them with `#TaxDeductible` (builds on Feature 5). Generate a tax-year summary report filtered by this tag. Export as CSV for tax filing software. Year-end totals by tax category.

**Note:** Implement after Tags (Feature 5). Do not build independently.

---

## 13. Financial Ratios Dashboard

**Priority:** P2 | **Complexity:** Medium | **Target:** v1.4.0

Savings rate (savings / income), expense ratio (expenses / income), debt-to-income ratio, net worth trend over time, financial health score. All calculated from existing `journal_entries` and `accounts` data — no new stores required.

---

## 14. Currency Conversion with Exchange Rates

**Priority:** P2 | **Complexity:** Medium | **Target:** v1.5.0

Store exchange rates manually (user-entered). Convert multi-currency transactions to base currency. Foreign transaction tracking. Exchange rate history. Multi-currency net worth.

**Offline constraint:** Rates must be entered manually. No live rate API — that requires a network call and an external dependency, both of which violate the app's offline-first, no-tracking principles.

---

## 15. Custom Reports Builder

**Priority:** P2 | **Complexity:** High | **Target:** v1.5.0

Custom date ranges, filter by category/tag/payee, custom grouping (week/quarter/year), export as CSV.

**Scope note:** A drag-and-drop report builder is over-engineered for this app's scale. Start with a form-based report configurator. Evaluate drag-and-drop only if user demand is clear.

---

## 16. Loan/Debt Tracking with Interest

**Priority:** P2 | **Complexity:** High | **Target:** v1.5.0

Track loans (personal, business, mortgage). Calculate interest accrual. Amortization schedules. Payment tracking. Early payoff calculator.

Interest is modeled as a journal entry to an Interest Expense account — no changes to `journal_entries` schema are needed.

---

## 17. Multi-Account Consolidation View

**Priority:** P3 | **Complexity:** Medium | **Target:** v1.6.0

View all accounts at once, consolidated balance sheet, inter-account transfers view, account comparison. This partially exists in Advanced Mode via the Trial Balance report — this feature extends it into a full portfolio dashboard.

---

## Implementation Priority

### v1.2.0 (Q2 2026)
- Recurring Transactions (P0)
- Budget Planning & Tracking (P0)
- Split Transactions (P0) — UI only, no schema change
- Search / Full-Text (P0) — no new store
- Tags & Custom Categories (P1)
- Undo / Delete Recovery (P1)
- Account Management UI (P1)
- CSV Import (P1)
- Merge Restore (P1)
- Backup Status & Reminders UX (P1)

### v1.3.0 (Q3 2026)
- Payee Management (P1) — ships with or before Reconciliation
- Transaction Reconciliation (P1) — requires Payee Management
- Financial Goals Tracking (P1)

### v1.4.0 (Q4 2026)
- Cash Flow Forecasting (P1) — requires Recurring Transactions
- Tax Reporting & Categories (P2) — builds on Tags
- Financial Ratios Dashboard (P2)

### v1.5.0 (Q1 2027)
- Currency Conversion with Rates (P2)
- Custom Reports Builder (P2)
- Loan/Debt Tracking with Interest (P2)

### v1.6.0 (Q2 2027)
- Multi-Account Consolidation View (P3)

---

## Technical Considerations

### Architecture Principles (All Features)

All new features must:
- Maintain the 4-layer architecture (UI → Application → Domain → Infrastructure)
- Keep the domain layer pure (no I/O, no DOM access)
- Work 100% offline — no feature may require a network call to function
- Add no external runtime dependencies
- Respect privacy — no data transmission, no analytics

### Data Design Principles

These rules apply to all new data models:

1. **Never store derived values.** If a value can be calculated from source data, calculate it at read time. Do not persist `spentAmount`, `percentageUsed`, `usageCount`, `currentAmount`, or any value derivable from `journal_entries` or another store. Storing them creates hidden update dependencies that drift.

2. **Avoid unbounded embedded arrays.** When a one-to-many relationship can grow indefinitely (e.g., contributions to a goal, lines of reconciliation history), use a separate store with an indexed foreign key — not an embedded array in the parent document.

3. **Do not persist ephemeral computations.** Forecasts, report results, and dashboard calculations are computed on demand from source data. They are not stored in IndexedDB.

4. **Use Blob for binary data, not Base64.** IndexedDB natively supports Blob storage with no encoding overhead. Base64 inflates binary data by ~33% and increases parse/stringify time. (Relevant if binary attachments are reconsidered in future.)

### DB Migration Plan

The current database is `FinChronicleLedgerDB v1` with 3 stores: `journal_entries`, `accounts`, `app_settings`. All new stores are added via incremental `onupgradeneeded` migrations keyed on DB version.

| DB Version | App Release | Changes |
|---|---|---|
| v1 | v1.0–v1.1 | Baseline: `journal_entries`, `accounts`, `app_settings` |
| v2 | v1.2.0 | Add: `recurring_templates`, `recurring_history`, `budgets`, `tags`; add `tags[]` field to `journal_entries` |
| v3 | v1.3.0 | Add: `payees`, `reconciliations`, `financial_goals`, `goal_contributions`; add `payeeId`, `reconciledDate`, `reconciliationId` to `journal_entries` |
| v4 | v1.4.0 | Add: `forecast_scenarios` |
| v5 | v1.5.0 | Add: `exchange_rates` |

**Migration implementation in `db.js`:**

```javascript
// db.js — onupgradeneeded runs cumulatively for all skipped versions
request.onupgradeneeded = (event) => {
  const db = event.target.result;
  const oldVersion = event.oldVersion;

  if (oldVersion < 2) {
    // v1 → v2
    db.createObjectStore('recurring_templates', { keyPath: 'id' });

    const history = db.createObjectStore('recurring_history', { keyPath: 'id' });
    history.createIndex('templateId', 'templateId');

    const budgets = db.createObjectStore('budgets', { keyPath: 'id' });
    budgets.createIndex('month', 'month', { unique: true });

    db.createObjectStore('tags', { keyPath: 'id' });
    // journal_entries gets tags[] lazily — existing entries default to undefined
  }

  if (oldVersion < 3) {
    // v2 → v3
    db.createObjectStore('payees', { keyPath: 'id' });

    const recon = db.createObjectStore('reconciliations', { keyPath: 'id' });
    recon.createIndex('month', 'month');
    recon.createIndex('accountId', 'accountId');

    db.createObjectStore('financial_goals', { keyPath: 'id' });

    const contrib = db.createObjectStore('goal_contributions', { keyPath: 'id' });
    contrib.createIndex('goalId', 'goalId');
    // journal_entries gets payeeId, reconciledDate, reconciliationId lazily
  }

  if (oldVersion < 4) {
    // v3 → v4
    db.createObjectStore('forecast_scenarios', { keyPath: 'id' });
  }

  if (oldVersion < 5) {
    // v4 → v5
    db.createObjectStore('exchange_rates', { keyPath: 'id' });
  }
};
```

**Critical:** A user upgrading from v1 directly to v3 (skipped v1.2.0) must have all v2 and v3 migrations applied in sequence. The `oldVersion < N` guards handle this correctly. Test this upgrade path explicitly before each release.

**New optional fields on `journal_entries`** (tags, payeeId, reconciliation fields) are added lazily — existing entries simply won't have them, and all code reading these fields must handle `undefined`/`null` gracefully.

### Service Worker Cache Updates

Every new JavaScript file added for a new feature must be added to the `CACHED_URLS` array in `sw.js`. Missing this step means the new file is not available offline.

**Per-release checklist:**
- [ ] Add all new JS files to `CACHED_URLS` in `sw.js`
- [ ] Bump `CACHE_NAME` version suffix in `sw.js` to match app version
- [ ] Bump `CDN_CACHE_NAME` version suffix if CDN assets changed
- [ ] Run offline smoke test after SW cache bump
- [ ] Verify old cache cleanup in `activate` event handles new version name

### Storage Management

- IndexedDB quota: typically 50MB–1GB depending on browser and device
- iOS Safari PWA storage is subject to eviction under low disk pressure — warn users, especially for goal contributions and reconciliation history
- Add a storage usage indicator to Settings using `navigator.storage.estimate()`
- Allow users to clear historical reconciliation records (keep latest per account) when space is needed

### Performance

- Paginate new list views (recurring templates, goals, reconciliation history)
- Use Web Workers for cash flow forecasting (iterating all entries + recurring templates)
- Add IndexedDB indexes on all new foreign keys: `templateId`, `goalId`, `payeeId`
- Monthly budget status calculation iterates all entries — acceptable at current scale, revisit if entry count exceeds 5k

---

## Conclusion

These **17 features** transform FinChronicleLedger from an expense tracker into a comprehensive personal finance management system.

**Priority summary:**
- **P0 (4 features):** Critical for v1.2.0 — Recurring, Budget, Split Transactions, Search
- **P1 (9 features):** High value, implement through v1.4.0
- **P2 (5 features):** Solid additions, v1.5.0
- **P3 (1 feature):** Future consideration

**Recommended sequence:**
1. Start with **Split Transactions** and **Search** — lowest complexity, high immediate user value, zero schema changes
2. Then **Recurring Transactions** and **Budget** — P0 with medium complexity, drive core engagement
3. **Goals + Reconciliation** — together with Payee Management in v1.3.0
4. **Forecasting** — reserved for v1.4.0 because it depends on Recurring having real data

---

**Document Author:** Architecture & Product Planning Team
**Updated:** 2026-03-31
**Version:** 2.0
**Next Review:** After v1.2.0 release
