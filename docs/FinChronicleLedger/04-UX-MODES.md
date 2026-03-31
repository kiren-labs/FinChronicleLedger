# FinChronicleLedger — UX Modes Specification

> Simple Mode for casual users, Advanced Mode for power users. Same data engine, different interfaces.

---

## 1. Mode Overview

| Aspect | Simple Mode | Advanced Mode |
|--------|-------------|---------------|
| **Target User** | Casual budgeters, non-accountants | Accountants, finance professionals, power users |
| **Experience** | Identical to FinChronicle v3 | Full double-entry journal interface |
| **Accounting Visibility** | Hidden — transactions look like single-entry | Exposed — debits, credits, accounts |
| **Default** | Yes (first-time users start here) | Opt-in via Settings toggle |
| **Data** | Same IndexedDB, same journal entries | Same IndexedDB, same journal entries |
| **Switching** | Instant toggle in Settings — no data migration | Instant toggle — no data migration |

**Critical principle:** Both modes read and write the exact same data. Switching modes is purely a UI change. A transaction created in Simple Mode is a perfectly valid journal entry viewable in Advanced Mode, and vice versa.

---

## 2. Simple Mode UX

### 2.1 Add Transaction Tab

The form is identical to FinChronicle v3:

```
┌──────────────────────────────────────┐
│  [Income ◉] [Expense ○]             │  ← Type toggle (same as v3)
├──────────────────────────────────────┤
│  Amount (₹)                         │
│  ┌──────────────────────────────┐   │
│  │ 500.00                       │   │
│  └──────────────────────────────┘   │
├──────────────────────────────────────┤
│  Category                           │
│  ┌──────────────────────────────┐   │
│  │ Groceries                ▼   │   │  ← Same category names as v3
│  └──────────────────────────────┘   │
├──────────────────────────────────────┤
│  Date                               │
│  ┌──────────────────────────────┐   │
│  │ 2026-02-28                   │   │
│  └──────────────────────────────┘   │
├──────────────────────────────────────┤
│  Notes (optional)                   │
│  ┌──────────────────────────────┐   │
│  │ Weekly groceries             │   │
│  └──────────────────────────────┘   │
├──────────────────────────────────────┤
│  [ Add Transaction ]                │  ← Submit button
└──────────────────────────────────────┘
```

**What happens behind the scenes:**
1. User submits: `{ type: 'expense', amount: 500, category: 'Groceries', date: '2026-02-28' }`
2. App maps: `Groceries` → Account 5000, default asset → Account 1100
3. App creates journal entry:
   - DR 5000 Groceries 500.00
   - CR 1100 Checking 500.00
4. App validates (balanced? accounts valid? amount OK?)
5. App saves to IndexedDB
6. User sees success animation

**The user never sees account codes, debits, credits, or the word "journal."**

### 2.2 Transaction List Tab

Displays transactions exactly like v3:

```
┌──────────────────────────────────────┐
│  28 Feb 2026                         │
│  Groceries              - ₹500.00    │
│  Weekly groceries                    │
│  [Edit] [Delete]                     │
└──────────────────────────────────────┘
```

- Shows category name (mapped from expense/income account)
- Shows amount with +/- color coding
- Same filters: month, category, type
- Same pagination (20/page)

### 2.3 Summary Dashboard
- Identical to v3: This Month Net, Entries, Income, Expenses
- MoM trends, expense-to-income ratio
- Collapsible, compact view option
- Actionable tiles

### 2.4 Groups & Analytics Tab
- Group by Month / Group by Category
- Monthly Insights with MoM trends
- Top 5 Spending Categories
- Budget Health Card

### 2.5 Settings Tab
- Export / Import / Backup / Restore
- Currency selector (20 currencies)
- Dark mode toggle
- **NEW: Mode toggle** — "Switch to Advanced Mode" button
- Check for Updates
- Feedback
- Backup Status, FAQ

### 2.6 Simple Mode with Transfer Support

Simple Mode adds one new transaction type not in v3:

```
┌──────────────────────────────────────┐
│  [Income ○] [Expense ○] [Transfer ◉]│
├──────────────────────────────────────┤
│  Amount (₹)                         │
│  ┌──────────────────────────────┐   │
│  │ 10000.00                     │   │
│  └──────────────────────────────┘   │
├──────────────────────────────────────┤
│  From Account                       │
│  ┌──────────────────────────────┐   │
│  │ Checking Account         ▼   │   │  ← Asset/Liability accounts only
│  └──────────────────────────────┘   │
├──────────────────────────────────────┤
│  To Account                         │
│  ┌──────────────────────────────┐   │
│  │ Savings Account          ▼   │   │
│  └──────────────────────────────┘   │
├──────────────────────────────────────┤
│  Date                               │
│  ┌──────────────────────────────┐   │
│  │ 2026-02-28                   │   │
│  └──────────────────────────────┘   │
├──────────────────────────────────────┤
│  [ Transfer ]                       │
└──────────────────────────────────────┘
```

---

## 3. Advanced Mode UX

### 3.1 Add Transaction Tab — Journal Entry Editor

```
┌──────────────────────────────────────────────────────────┐
│  New Journal Entry                                        │
├──────────────────────────────────────────────────────────┤
│  Date: [2026-02-28]    Type: [Expense ▼]                 │
├──────────────────────────────────────────────────────────┤
│  Description                                              │
│  ┌──────────────────────────────────────────────────┐    │
│  │ Weekly groceries at FreshMart                     │    │
│  └──────────────────────────────────────────────────┘    │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Account                    Debit        Credit           │
│  ┌──────────────────────┐  ┌─────────┐  ┌─────────┐     │
│  │ 5000 Groceries    ▼  │  │  500.00 │  │         │     │
│  └──────────────────────┘  └─────────┘  └─────────┘     │
│  ┌──────────────────────┐  ┌─────────┐  ┌─────────┐     │
│  │ 1100 Checking     ▼  │  │         │  │  500.00 │     │
│  └──────────────────────┘  └─────────┘  └─────────┘     │
│  [ + Add Line ]                                          │
│                                                           │
│  ─────────────────────────────────────────                │
│  Total                      500.00       500.00           │
│  Difference                   0.00  ✓ Balanced            │
│                                                           │
├──────────────────────────────────────────────────────────┤
│  [ Save Journal Entry ]                                   │
└──────────────────────────────────────────────────────────┘
```

**Key features:**
- Multi-line entry editor (minimum 2 lines, add more with "+" button)
- Account dropdown with search (shows code + name)
- Real-time balance indicator (red if unbalanced, green checkmark if balanced)
- Save button disabled until entry is balanced
- Auto-suggest: when entering debit in line 1, line 2 auto-fills remaining credit

### 3.2 Transaction List Tab — Enhanced

In Advanced Mode, the list shows additional accounting detail:

```
┌──────────────────────────────────────────────────────────┐
│  28 Feb 2026 • Expense                                    │
│  Weekly groceries at FreshMart                            │
│                                                           │
│    DR  5000 Groceries          ₹500.00                    │
│    CR  1100 Checking                      ₹500.00         │
│                                                           │
│  [Edit] [Delete]                                          │
└──────────────────────────────────────────────────────────┘
```

### 3.3 Account Balances Panel

New section in Advanced Mode (visible in Summary or as separate tab):

```
┌──────────────────────────────────────┐
│  Account Balances                    │
├──────────────────────────────────────┤
│  ASSETS                              │
│    1000 Cash              ₹5,000     │
│    1100 Checking        ₹1,45,000    │
│    1200 Savings         ₹3,00,000    │
│                                      │
│  LIABILITIES                         │
│    2000 Credit Card      ₹12,000     │
│                                      │
│  NET WORTH             ₹4,38,000     │
├──────────────────────────────────────┤
│  INCOME (this month)                 │
│    4000 Salary          ₹50,000      │
│                                      │
│  EXPENSES (this month)               │
│    5000 Groceries        ₹4,500      │
│    5100 Dining Out       ₹2,300      │
│    5200 Transit          ₹1,800      │
└──────────────────────────────────────┘
```

### 3.4 Trial Balance (Advanced Mode only)

Available under Groups/Analytics tab:

```
┌──────────────────────────────────────────────────┐
│  Trial Balance                                    │
│  As of: 28 February 2026                         │
├──────────────────────────────────────────────────┤
│  Account               Debit         Credit       │
│  ──────────────────────────────────────────       │
│  1100 Checking       ₹1,45,000                    │
│  1200 Savings        ₹3,00,000                    │
│  2000 Credit Card                   ₹12,000       │
│  3000 Opening Equity                ₹4,33,000     │
│  4000 Salary                        ₹50,000       │
│  5000 Groceries       ₹4,500                      │
│  5100 Dining Out      ₹2,300                      │
│  ──────────────────────────────────────────       │
│  TOTAL               ₹4,95,000     ₹4,95,000  ✓  │
└──────────────────────────────────────────────────┘
```

---

## 4. Mode Switching

### Toggle Location
Settings tab → first section:

```
┌──────────────────────────────────────┐
│  Interface Mode                      │
│                                      │
│  [Simple ◉]  [Advanced ○]           │
│                                      │
│  Simple Mode shows familiar          │
│  categories. Advanced Mode shows     │
│  accounts, debits & credits.         │
└──────────────────────────────────────┘
```

### Switching Behavior
1. **Instant** — no migration, no data change
2. **Persistent** — saved to localStorage/IndexedDB, survives page reload
3. **All data preserved** — same journal entries, just different UI rendering
4. **Default: Simple Mode** — new users start here

### What Changes When Switching

| Element | Simple Mode | Advanced Mode |
|---------|-------------|---------------|
| Add form | Category dropdown | Account dropdown + multi-line editor |
| List items | Category + amount | Full debit/credit detail |
| Summary | Income/Expense/Net | + Account balances + Net Worth |
| Groups tab | Month/Category groups | + Trial Balance |
| Transfer button | Shows if Advanced ever used | Always visible |
| Settings | "Switch to Advanced" | "Switch to Simple" |

---

## 5. Migration Wizard (One-Time)

When a v3 FinChronicle user imports their backup into FinChronicleLedger:

### Step 1: Welcome
```
Welcome to FinChronicleLedger!

We detected a FinChronicle v3 backup.
Let's import your data into the new
double-entry system.

Your existing categories will be mapped
to proper accounting accounts.

[ Start Migration ]
```

### Step 2: Opening Balances (Optional)
```
Set Your Starting Balances

Enter current balances for your accounts.
Skip any you don't use.

Checking Account:  [₹_______]
Savings Account:   [₹_______]
Cash on Hand:      [₹_______]
Credit Card Debt:  [₹_______]

[ Skip ] [ Save Balances ]
```

### Step 3: Migration Progress
```
Migrating Your Data...

✓ Created chart of accounts (45 accounts)
✓ Set opening balances
◉ Converting transactions... (247/312)
○ Verifying trial balance

[ Progress bar ██████████░░ 79% ]
```

### Step 4: Migration Report
```
Migration Complete! ✓

312 transactions converted
  → 312 journal entries created
  → 0 skipped (duplicates)
  → 0 errors

Trial Balance: ✓ Balanced
  Total Debits:  ₹12,45,000.00
  Total Credits: ₹12,45,000.00

[ View Your Ledger ]
```

---

## 6. Opening Balance Wizard (New Users)

For users starting fresh (no v3 import):

### Step 1: Do You Have Existing Balances?
```
Do you have existing account balances
to enter?

If you're tracking finances for the
first time, you can skip this.

[ Yes, set balances ]  [ Skip for now ]
```

### Step 2: Enter Balances
```
Enter your current account balances:

Bank Accounts:
  Checking:  [₹_______]
  Savings:   [₹_______]

Debts:
  Credit Card: [₹_______]

Assets:
  Cash on Hand: [₹_______]

[ Save ]
```

Behind the scenes, this creates a single balanced opening balance entry:
- DR each Asset account for its balance
- CR each Liability account for its balance  
- Balance to Opening Balance Equity (3000)

---

## 7. Navigation Structure

### Simple Mode Tabs (Mobile Bottom Nav)

```
[ ＋ Add ] [ ≡ List ] [ ⊞ Groups ] [ ⚙ Settings ]
```

Identical to FinChronicle v3.

### Advanced Mode Tabs (Mobile Bottom Nav)

```
[ ＋ Add ] [ ≡ List ] [ ⊞ Groups ] [ 📊 Reports ] [ ⚙ Settings ]
```

**Reports tab is new** — contains:
- Account Balances
- Trial Balance
- Income Statement (v1.1)
- Balance Sheet (v1.1)

*On mobile, the 5th tab may use a "More" overflow pattern if space is tight.*
