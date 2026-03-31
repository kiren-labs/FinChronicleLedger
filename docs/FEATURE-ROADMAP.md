# FinChronicleLedger — Feature Roadmap

**Perspective:** Accountant & Personal Finance Manager
**Date:** 2026-03-03 (Updated 2026-03-31 with gap analysis)
**Version:** 1.1.0 → Future Releases

---

## 🔄 Alignment with Feature-Gap Analysis (FinChronicleLedger vs. finance-tracker)

**Date:** 2026-03-31  
**Evidence-based priorities:**
- **Recurring Transactions** (P0, v1.2.0) ✅ Aligns with #1 Gap: "Missing in FinChronicleLedger"
- **Budget Planning** (P0, v1.2.0) ✅ Aligns with #2 Gap: "Missing in FinChronicleLedger"
- **Search + Tags** (P1, v1.2.0) ✅ Aligns with #3 Gap: "Missing in FinChronicleLedger"
- **Visual Charts** (P1, v1.4.0) ✅ Aligns with #4 Gap: "Better in finance-tracker"
- **CSV Import** (New phase 1 task) ✅ Aligns with #5 Gap: "Missing user flow"
- **Merge Restore** (New phase 1 task) ✅ Aligns with #6 Gap: "Replace-all only"
- **Backup UX** (New phase 1 task) ✅ Aligns with #7 Gap: "Less mature in FinChronicleLedger"

**Implementation Backlog:** See [IMPLEMENTATION-BACKLOG-PHASE1-2.md](IMPLEMENTATION-BACKLOG-PHASE1-2.md) for sprint-ready Phase 1 and Phase 2 tickets, acceptance criteria, and dependencies.

---

## Executive Summary

This document outlines **15 high-value features** for FinChronicleLedger from an accountant and personal finance management perspective, prioritized via feature-gap analysis. Features are categorized by:

- **Priority** (P0 = Critical, P1 = High, P2 = Medium, P3 = Nice-to-have)
- **Complexity** (Low, Medium, High)
- **Impact** (Business value to users)

All features maintain the app's core principles:
- ✅ 100% offline-first
- ✅ Zero backend / No tracking
- ✅ Privacy-first
- ✅ Double-entry accounting foundation

---

## Feature Overview Matrix

| # | Feature | Priority | Complexity | Impact | Release Target | Gap Analysis |
|---|---------|----------|------------|--------|-----------------|--------|
| 1 | Recurring Transactions | P0 | Medium | High | v1.2.0 | 🎯 #1 Gap |
| 2 | Budget Planning & Tracking | P0 | Medium | High | v1.2.0 | 🎯 #2 Gap |
| 7 | Tags & Custom Categories | P0 | Low | Medium | v1.2.0 | 🎯 #3 Gap (Search+Tags) |
| 4-A | CSV Import (Simple Transactions) | P1 | Low | Medium | v1.2.0 | 🎯 #5 Gap |
| 4-B | Merge Restore (Non-destructive) | P1 | Medium | Medium | v1.2.0 | 🎯 #6 Gap |
| 4-C | Backup Status & Reminders UX | P1 | Low | Medium | v1.2.0 | 🎯 #7 Gap |
| 3 | Transaction Reconciliation | P1 | High | High | v1.3.0 | Planned |
| 4 | Financial Goals Tracking | P1 | Medium | High | v1.3.0 | Planned |
| 5 | Split Transactions | P1 | Medium | Medium | v1.3.0 | Planned |
| 6 | Receipt/Attachment Storage | P1 | High | Medium | v1.4.0 | Planned |
| 8 | Cash Flow Forecasting | P1 | High | High | v1.4.0 | Planned |
| 9 | Tax Reporting & Categories | P2 | Medium | Medium | v1.4.0 | Planned |
| 10 | Currency Conversion with Rates | P2 | Medium | Low | v1.5.0 | Planned |
| 11 | Payee Management | P2 | Low | Medium | v1.3.0 | Planned |
| 12 | Financial Ratios Dashboard | P2 | Medium | Medium | v1.4.0 | Planned |
| 13 | Custom Reports Builder | P2 | High | Medium | v1.5.0 | Planned |
| 14 | Loan/Debt Tracking with Interest | P2 | High | High | v1.5.0 | Planned |
| 15 | Multi-Account Consolidation View | P3 | Medium | Low | v1.6.0 | Planned |

---

## Feature Details

---

## 1. Recurring Transactions

**Priority:** P0 (Critical)
**Complexity:** Medium
**Impact:** High
**Target:** v1.2.0

### Problem Statement

Most people have **regular, predictable transactions**:
- Monthly salary (income)
- Rent/mortgage (expense)
- Utility bills (expense)
- Subscriptions (Netflix, Spotify, etc.)
- Loan EMIs (expense)

Currently, users must **manually enter these every month**, which is:
- Time-consuming
- Error-prone (forget to log)
- Tedious for power users

### Proposed Solution

Add a **Recurring Transactions** feature with:

1. **Template Creation**
   - Create a template from existing transaction
   - Set frequency: Daily, Weekly, Monthly, Quarterly, Yearly
   - Set start date and optional end date
   - Set auto-create behavior (automatic vs. reminder)

2. **Automation Options**
   - **Auto-create:** Automatically create transaction on due date
   - **Reminder only:** Show notification, user must confirm
   - **Days ahead:** Create N days before due date

3. **Management Interface**
   - List all recurring transactions
   - Edit template (affects future only)
   - Pause/resume recurring transaction
   - Delete recurring transaction
   - View history of created transactions

### User Experience

#### Simple Mode
```
Settings > Recurring Transactions
  [+ Create Recurring Transaction]

Template Form:
  - Type: Income / Expense / Transfer
  - Amount: ₹25,000
  - Category: Salary
  - Frequency: Monthly
  - Start Date: 2026-01-01
  - Auto-create: [✓] Create automatically
  - Days ahead: 0 (create on due date)

[Save Template]
```

#### Dashboard Widget
```
Upcoming Recurring (Next 7 days):
  - 2026-03-05: Rent ₹15,000 [Auto] [Edit] [Skip This Month]
  - 2026-03-10: Netflix ₹500 [Auto]
  - 2026-03-15: Electricity Bill ₹1,200 [Reminder]
```

### Data Model

**New Store:** `recurring_templates`

```javascript
{
  id: 'uuid',
  name: 'Monthly Rent',
  type: 'expense', // income | expense | transfer
  amount: 15000,
  categoryAccountId: '5400', // Rent expense account
  assetAccountId: '1001', // Cash
  frequency: 'monthly', // daily | weekly | monthly | quarterly | yearly
  interval: 1, // every 1 month
  startDate: '2026-01-01',
  endDate: null, // or '2027-01-01'
  nextDueDate: '2026-03-01',
  autoCreate: true, // or false for reminder only
  daysAhead: 0, // create N days before due
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
  templateId: 'recurring_template_uuid',
  dueDate: '2026-03-01',
  createdDate: '2026-03-01',
  transactionId: 'journal_entry_uuid', // null if skipped
  status: 'created', // created | skipped | pending
  createdAt: '2026-03-01T10:00:00Z'
}
```

### Implementation Notes

**Service Layer:**
- `recurring-service.js` — CRUD for templates
- `recurring-scheduler.js` — Check due dates, create transactions

**Background Job:**
```javascript
// app.js - Check recurring transactions daily
setInterval(() => {
  RecurringScheduler.processUpcoming();
}, 24 * 60 * 60 * 1000); // Every 24 hours

// Also check on app startup
RecurringScheduler.processUpcoming();
```

**Algorithm:**
```javascript
function processUpcoming() {
  const templates = DB.getActiveRecurringTemplates();
  const today = new Date();

  for (const template of templates) {
    const dueDate = new Date(template.nextDueDate);
    const createDate = new Date(dueDate);
    createDate.setDate(createDate.getDate() - template.daysAhead);

    if (today >= createDate && today <= dueDate) {
      if (template.autoCreate) {
        // Create transaction automatically
        const transaction = buildFromTemplate(template);
        TransactionService.createSimpleTransaction(transaction);

        // Update next due date
        template.nextDueDate = calculateNextDue(template);
        DB.updateRecurringTemplate(template);
      } else {
        // Show reminder
        Renderer.showToast(`Reminder: ${template.name} due on ${dueDate}`, 'info');
      }
    }
  }
}
```

### Business Impact

- **Time Savings:** Users save ~5 minutes/month for 10 recurring transactions = 1 hour/year
- **Accuracy:** No forgotten transactions
- **Forecasting:** Enables accurate cash flow prediction (see Feature #8)
- **User Satisfaction:** Top-requested feature in personal finance apps

---

## 2. Budget Planning & Tracking

**Priority:** P0 (Critical)
**Complexity:** Medium
**Impact:** High
**Target:** v1.2.0

### Problem Statement

Users currently see:
- Total income
- Total expenses
- Net savings

But they **cannot**:
- Set spending limits by category
- Track progress against budget
- Get alerts when approaching limits
- See variance (actual vs. budget)

**Budgets are fundamental to personal finance management.**

### Proposed Solution

Add **Budget Management** with:

1. **Budget Creation**
   - Set monthly budget by category
   - Set overall monthly budget
   - Copy previous month's budget
   - Budget templates (50/30/20 rule, etc.)

2. **Budget Tracking**
   - Real-time spending vs. budget
   - Visual indicators (green = under, yellow = approaching, red = over)
   - Progress bars for each category
   - Alerts when 80% spent

3. **Budget Reports**
   - Variance report (budget vs. actual)
   - Trend analysis (overspending patterns)
   - Budget adherence score

### User Experience

#### Budget Setup (New Tab)
```
Budget Tab (next to Groups)

Monthly Budget - March 2026
  ┌────────────────────────────────────────┐
  │ Overall Monthly Budget: ₹50,000        │
  │ Spent so far: ₹32,450 (65%)            │
  │ Remaining: ₹17,550                     │
  │ Days left: 15                          │
  │ Daily allowance: ₹1,170                │
  └────────────────────────────────────────┘

Category Budgets:
  ┌─────────────────────────────────────────┐
  │ Groceries                               │
  │ Budget: ₹5,000  Spent: ₹3,200 (64%)     │
  │ ████████████░░░░░░░░                   │
  │ ✓ On track                              │
  └─────────────────────────────────────────┘

  ┌─────────────────────────────────────────┐
  │ Transport                               │
  │ Budget: ₹3,000  Spent: ₹2,900 (97%)     │
  │ ███████████████████░                   │
  │ ⚠ Approaching limit                     │
  └─────────────────────────────────────────┘

  ┌─────────────────────────────────────────┐
  │ Entertainment                           │
  │ Budget: ₹2,000  Spent: ₹2,500 (125%)    │
  │ ████████████████████████               │
  │ ⚠ Over budget by ₹500                   │
  └─────────────────────────────────────────┘

[Edit Budget] [Copy to Next Month] [Budget Templates]
```

#### Budget Templates
```
Choose a Budget Template:

  [50/30/20 Rule]
    - 50% Needs (Rent, Groceries, Bills)
    - 30% Wants (Entertainment, Dining)
    - 20% Savings

  [60/20/10/10 Rule]
    - 60% Living Expenses
    - 20% Savings
    - 10% Debt Repayment
    - 10% Fun Money

  [Zero-Based Budget]
    - Assign every rupee a job
    - Income - Expenses = 0

  [Custom]
    - Set your own percentages
```

### Data Model

**New Store:** `budgets`

```javascript
{
  id: 'uuid',
  month: '2026-03', // YYYY-MM
  overallBudget: 50000, // optional
  categoryBudgets: [
    {
      categoryAccountId: '5000', // Groceries
      budgetAmount: 5000,
      spentAmount: 3200, // calculated real-time
      percentageUsed: 64 // calculated
    },
    {
      categoryAccountId: '5200', // Transport
      budgetAmount: 3000,
      spentAmount: 2900,
      percentageUsed: 97
    }
  ],
  alertThreshold: 80, // alert at 80%
  createdAt: '2026-03-01T00:00:00Z',
  updatedAt: '2026-03-15T10:00:00Z'
}
```

### Implementation Notes

**Service Layer:**
- `budget-service.js` — CRUD for budgets, variance calculations

**Real-Time Calculation:**
```javascript
// report-service.js - Enhancement
function getBudgetStatus(month) {
  const budget = DB.getBudgetForMonth(month);
  if (!budget) return null;

  const entries = State.getEntries();
  const monthEntries = entries.filter(e => e.date.startsWith(month));

  for (const categoryBudget of budget.categoryBudgets) {
    // Calculate actual spending
    const spent = monthEntries
      .filter(e => e.type === 'expense')
      .flatMap(e => e.lines)
      .filter(l => l.accountId === categoryBudget.categoryAccountId)
      .reduce((sum, l) => sum + l.debit, 0);

    categoryBudget.spentAmount = spent;
    categoryBudget.percentageUsed = (spent / categoryBudget.budgetAmount) * 100;
    categoryBudget.status = getStatus(categoryBudget.percentageUsed);
  }

  return budget;
}

function getStatus(percentage) {
  if (percentage < 80) return 'on-track';
  if (percentage < 100) return 'approaching';
  return 'over';
}
```

**Alerts:**
```javascript
// When adding transaction, check budget
async function createSimpleTransaction(formData) {
  const result = await TransactionService.createSimpleTransaction(formData);

  if (result.success && formData.type === 'expense') {
    const budget = BudgetService.getBudgetForCurrentMonth();
    const categoryBudget = budget?.categoryBudgets.find(
      cb => cb.categoryAccountId === formData.categoryAccountId
    );

    if (categoryBudget && categoryBudget.percentageUsed >= 80) {
      Renderer.showToast(
        `Budget alert: ${categoryBudget.percentageUsed}% used for this category`,
        'warning'
      );
    }
  }

  return result;
}
```

### Business Impact

- **Financial Discipline:** Users who budget save 15-20% more
- **Awareness:** Real-time feedback changes behavior
- **Goal Achievement:** Budgets tied to financial goals
- **Standard Feature:** Expected in all personal finance apps

---

## 3. Transaction Reconciliation

**Priority:** P1 (High)
**Complexity:** High
**Impact:** High
**Target:** v1.3.0

### Problem Statement

**Reconciliation** is the process of matching recorded transactions against bank statements to ensure accuracy. Currently, users:

- Cannot easily verify all transactions are recorded
- May have duplicate entries
- May miss transactions
- Have no way to mark transactions as "verified"

**For accountants, reconciliation is a critical control.**

### Proposed Solution

Add **Bank Reconciliation** feature:

1. **Import Bank Statement**
   - Upload CSV from bank
   - Parse transactions
   - Match against recorded entries

2. **Matching Interface**
   - Side-by-side view: Bank vs. App
   - Auto-match by date + amount
   - Manual match for discrepancies
   - Mark as reconciled

3. **Reconciliation Report**
   - Opening balance
   - Transactions (matched, unmatched)
   - Closing balance
   - Variance report

### User Experience

```
Reconciliation Tab

[+ Start New Reconciliation]

Reconcile Cash Account - March 2026

  Step 1: Opening Balance
    Bank statement opening balance: ₹25,000
    App opening balance: ₹25,000
    Difference: ₹0 ✓

  Step 2: Import Bank Statement
    [Upload CSV] or [Paste Transactions]

  Step 3: Match Transactions

    Bank Statement             |  Your Records
    ─────────────────────────────────────────────
    ✓ 2026-03-01  Salary +50k  |  2026-03-01  Salary +50k
    ✓ 2026-03-02  Rent -15k    |  2026-03-02  Rent -15k
    ? 2026-03-05  ATM -5k       |  [No match] [Create] [Ignore]
    ✓ 2026-03-10  Groceries -2k|  2026-03-10  Groceries -2k
      2026-03-15  Netflix -500  |  ? 2026-03-15  Netflix -500 [Match]

    Missing in Bank:
      - 2026-03-12  Cash purchase -₹200 [Verify]

  Step 4: Closing Balance
    Bank statement closing: ₹32,500
    App closing: ₹32,700
    Difference: -₹200 (Missing in bank)

  [Mark as Reconciled] [Save Draft]
```

### Data Model

**New Store:** `reconciliations`

```javascript
{
  id: 'uuid',
  accountId: '1001', // Cash account
  month: '2026-03',
  openingBalance: 25000,
  closingBalance: 32500,
  bankClosingBalance: 32500,
  difference: 0,
  status: 'completed', // draft | in-progress | completed
  matchedTransactions: ['uuid1', 'uuid2'],
  unmatchedAppTransactions: ['uuid3'],
  unmatchedBankTransactions: [
    {
      date: '2026-03-05',
      description: 'ATM Withdrawal',
      amount: -5000,
      createdTransactionId: 'uuid4' // if user creates from unmatched
    }
  ],
  reconciliationDate: '2026-03-31T10:00:00Z',
  reconciledBy: 'user',
  notes: 'All transactions verified',
  createdAt: '2026-03-31T10:00:00Z'
}
```

**Enhancement to `journal_entries`:**
```javascript
{
  // ... existing fields
  reconciledDate: '2026-03-31T10:00:00Z', // null if not reconciled
  reconciliationId: 'reconciliation_uuid'
}
```

### Implementation Notes

**CSV Import:**
```javascript
// reconciliation-service.js
function parseBankStatement(csvText) {
  const lines = csvText.split('\n');
  const transactions = [];

  for (const line of lines.slice(1)) { // Skip header
    const [date, description, debit, credit, balance] = line.split(',');
    transactions.push({
      date: parseDate(date),
      description: description.trim(),
      amount: parseFloat(debit || credit) * (debit ? -1 : 1),
      balance: parseFloat(balance)
    });
  }

  return transactions;
}
```

**Auto-Matching Algorithm:**
```javascript
function autoMatch(bankTransactions, appTransactions) {
  const matches = [];
  const unmatchedBank = [];
  const unmatchedApp = [...appTransactions];

  for (const bankTx of bankTransactions) {
    // Try to find match by date + amount
    const match = unmatchedApp.find(appTx =>
      appTx.date === bankTx.date &&
      Math.abs(getEntryTotal(appTx) - Math.abs(bankTx.amount)) < 0.01
    );

    if (match) {
      matches.push({ bankTx, appTx: match });
      unmatchedApp.splice(unmatchedApp.indexOf(match), 1);
    } else {
      unmatchedBank.push(bankTx);
    }
  }

  return { matches, unmatchedBank, unmatchedApp };
}
```

### Business Impact

- **Accuracy:** Catch errors, duplicates, missing transactions
- **Trust:** Users trust the app when reconciliation matches bank
- **Audit Trail:** Critical for business users, freelancers
- **Professional Feature:** Distinguishes from casual expense trackers

---

## 4. Financial Goals Tracking

**Priority:** P1 (High)
**Complexity:** Medium
**Impact:** High
**Target:** v1.3.0

### Problem Statement

Users save money but lack **motivation and tracking** for specific goals:
- Emergency fund (6 months expenses)
- Vacation savings
- Down payment for house
- New car
- Child's education

**Goals give purpose to saving.**

### Proposed Solution

Add **Financial Goals** feature:

1. **Goal Creation**
   - Goal name and target amount
   - Target date
   - Link to savings account
   - Track contributions

2. **Goal Dashboard**
   - Visual progress bars
   - Projected completion date
   - Required monthly contribution
   - Milestones (25%, 50%, 75%)

3. **Contribution Tracking**
   - Link transactions to goals
   - Auto-suggest savings as goal contributions
   - Celebrate milestones

### User Experience

```
Financial Goals Tab

Active Goals:
  ┌──────────────────────────────────────────┐
  │ 🏠 House Down Payment                    │
  │ Target: ₹10,00,000  Saved: ₹3,50,000     │
  │ ████████░░░░░░░░░░░░░░░░ 35%            │
  │                                          │
  │ Target Date: Dec 2027 (21 months)        │
  │ Required/month: ₹31,000                  │
  │ Current pace: ₹25,000/month ⚠ Behind    │
  │                                          │
  │ [Add Contribution] [Edit] [Delete]       │
  └──────────────────────────────────────────┘

  ┌──────────────────────────────────────────┐
  │ ✈️ Europe Vacation                        │
  │ Target: ₹2,50,000  Saved: ₹1,80,000      │
  │ ██████████████████░░░░░░ 72%            │
  │                                          │
  │ Target Date: Jun 2026 (3 months)         │
  │ Required/month: ₹23,333                  │
  │ Current pace: ₹30,000/month ✓ On track  │
  │                                          │
  │ Recent contributions:                    │
  │   - Mar 01: ₹20,000                      │
  │   - Feb 15: ₹25,000                      │
  │                                          │
  │ [Add Contribution] [Edit] [Complete]     │
  └──────────────────────────────────────────┘

[+ Create New Goal]

Completed Goals (3):
  ✓ Emergency Fund (₹1,50,000) - Completed Jan 2026
  ✓ New Laptop (₹80,000) - Completed Nov 2025
  ✓ Debt Payoff (₹2,00,000) - Completed Aug 2025
```

### Data Model

**New Store:** `financial_goals`

```javascript
{
  id: 'uuid',
  name: 'House Down Payment',
  emoji: '🏠', // optional
  targetAmount: 1000000,
  currentAmount: 350000, // calculated from contributions
  targetDate: '2027-12-31',
  linkedAccountId: '1002', // Savings account
  status: 'active', // active | paused | completed | cancelled
  contributions: [
    {
      id: 'uuid',
      date: '2026-03-01',
      amount: 20000,
      transactionId: 'journal_entry_uuid', // optional
      notes: 'Bonus money'
    }
  ],
  milestones: [
    { percentage: 25, reachedDate: '2025-10-15' },
    { percentage: 50, reachedDate: null }
  ],
  createdAt: '2025-01-01T00:00:00Z',
  completedAt: null
}
```

### Implementation Notes

**Service Layer:**
```javascript
// goal-service.js
function calculateGoalProgress(goal) {
  const progress = (goal.currentAmount / goal.targetAmount) * 100;
  const monthsRemaining = getMonthsUntil(goal.targetDate);
  const amountRemaining = goal.targetAmount - goal.currentAmount;
  const requiredMonthly = amountRemaining / monthsRemaining;

  // Calculate current pace (last 3 months average)
  const recentContributions = goal.contributions
    .filter(c => isWithinLastNMonths(c.date, 3));
  const currentPace = recentContributions.reduce((sum, c) => sum + c.amount, 0) / 3;

  const paceStatus = currentPace >= requiredMonthly ? 'on-track' : 'behind';

  return {
    progress,
    monthsRemaining,
    requiredMonthly,
    currentPace,
    paceStatus
  };
}
```

**Linking Transactions:**
```javascript
// When user adds "Savings" transaction, suggest linking to goal
async function createSimpleTransaction(formData) {
  const result = await TransactionService.createSimpleTransaction(formData);

  if (result.success && formData.type === 'transfer' &&
      formData.toAccountId === '1002') { // Savings account

    const activeGoals = GoalService.getActiveGoals();
    if (activeGoals.length > 0) {
      Modals.showGoalLinkModal({
        transaction: result.entry,
        goals: activeGoals,
        onLink: (goalId) => {
          GoalService.linkTransaction(goalId, result.entry.id);
        }
      });
    }
  }

  return result;
}
```

**Milestone Celebrations:**
```javascript
function addContribution(goalId, contribution) {
  const goal = State.getGoalById(goalId);
  goal.contributions.push(contribution);
  goal.currentAmount += contribution.amount;

  // Check for milestone
  const progress = (goal.currentAmount / goal.targetAmount) * 100;
  const milestoneThresholds = [25, 50, 75, 100];

  for (const threshold of milestoneThresholds) {
    const milestone = goal.milestones.find(m => m.percentage === threshold);
    if (progress >= threshold && !milestone.reachedDate) {
      milestone.reachedDate = new Date().toISOString();

      // Show celebration
      Renderer.showToast(
        `🎉 ${threshold}% milestone reached for ${goal.name}!`,
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
- **Engagement:** Goal tracking increases app usage
- **Success:** Visual progress creates positive feedback loop
- **Differentiation:** Not all expense trackers have this

---

## 5. Split Transactions

**Priority:** P1 (High)
**Complexity:** Medium
**Impact:** Medium
**Target:** v1.3.0

### Problem Statement

Real-world transactions often span **multiple categories**:

- Grocery bill includes: Food (₹1,500) + Household items (₹500) + Medicine (₹300)
- Business trip: Transport (₹2,000) + Meals (₹1,000) + Hotel (₹3,000)
- Shared expense: Your portion (₹1,000) vs. Friend's portion (₹1,000)

Currently, users must:
- Either pick one category (inaccurate)
- Or create multiple transactions (tedious)

**Split transactions solve this problem.**

### Proposed Solution

Add **Split Transaction** capability:

1. **Simple Mode Enhancement**
   - "Split" button on transaction form
   - Add multiple category lines
   - Total must equal transaction amount

2. **Visual Split Builder**
   - Add line: Category + Amount
   - Running total shown
   - Validation (sum must match total)

3. **Display in Lists**
   - Show "Split" badge
   - Expand to show breakdown

### User Experience

```
Add Transaction (Simple Mode)

Type: Expense
Amount: ₹2,300

[Split this transaction]

Split Details:
  ┌────────────────────────────────┐
  │ Category: Groceries            │
  │ Amount: ₹1,500                 │
  │ [Remove]                       │
  └────────────────────────────────┘

  ┌────────────────────────────────┐
  │ Category: Household            │
  │ Amount: ₹500                   │
  │ [Remove]                       │
  └────────────────────────────────┘

  ┌────────────────────────────────┐
  │ Category: Healthcare           │
  │ Amount: ₹300                   │
  │ [Remove]                       │
  └────────────────────────────────┘

  [+ Add Another Category]

  Total: ₹2,300 / ₹2,300 ✓

From Account: Cash
Date: 2026-03-03
Notes: Big grocery shopping

[Add Transaction]
```

**In Transaction List:**
```
Transactions - March 2026

┌───────────────────────────────────────┐
│ Mar 03  Shopping [Split]              │
│         ₹2,300                        │
│                                       │
│ ▼ Show breakdown                      │
│   • Groceries: ₹1,500                │
│   • Household: ₹500                  │
│   • Healthcare: ₹300                 │
│                                       │
│ [Edit] [Delete]                       │
└───────────────────────────────────────┘
```

### Data Model

**No schema change needed!** Double-entry already supports this:

```javascript
// Split transaction journal entry
{
  id: 'uuid',
  date: '2026-03-03',
  type: 'expense',
  description: 'Big grocery shopping',
  lines: [
    // Multiple expense categories (debits)
    { accountId: '5000', debit: 1500, credit: 0, memo: 'Groceries' },
    { accountId: '5940', debit: 500, credit: 0, memo: 'Household' },
    { accountId: '5700', debit: 300, credit: 0, memo: 'Healthcare' },

    // Single payment source (credit)
    { accountId: '1001', debit: 0, credit: 2300, memo: 'Cash' }
  ],
  source: 'user-input',
  isSplit: true, // helper flag for UI
  createdAt: '2026-03-03T10:00:00Z'
}
```

**This is native to double-entry!** We just need UI support.

### Implementation Notes

**UI Enhancement:**
```javascript
// forms.js - Simple Mode Form
let splitLines = []; // Track split categories

function renderSimpleForm() {
  const isSplit = State.getIsSplitMode();

  if (isSplit) {
    return renderSplitBuilder();
  } else {
    return renderRegularForm();
  }
}

function renderSplitBuilder() {
  return `
    <div class="split-builder">
      ${splitLines.map((line, idx) => `
        <div class="split-line">
          <select class="split-category" data-idx="${idx}">
            ${renderCategoryOptions()}
          </select>
          <input type="number" class="split-amount"
                 value="${line.amount}" data-idx="${idx}">
          <button class="remove-split" data-idx="${idx}">Remove</button>
        </div>
      `).join('')}

      <button id="addSplitLine">+ Add Category</button>

      <div class="split-total">
        Total: ₹${getSplitTotal()} / ₹${totalAmount}
        ${getSplitTotal() === totalAmount ? '✓' : '⚠'}
      </div>
    </div>
  `;
}
```

**Transaction Creation:**
```javascript
// transaction-service.js
async function createSplitTransaction(formData) {
  // Validate split adds up
  const splitTotal = formData.splitLines.reduce((sum, line) => sum + line.amount, 0);
  if (Math.abs(splitTotal - formData.totalAmount) > 0.01) {
    return { success: false, errors: ['Split amounts must equal total'] };
  }

  // Build journal entry with multiple debit lines
  const lines = formData.splitLines.map(split => ({
    accountId: split.categoryAccountId,
    debit: split.amount,
    credit: 0,
    memo: split.notes || ''
  }));

  // Add credit line (payment source)
  lines.push({
    accountId: formData.assetAccountId,
    debit: 0,
    credit: formData.totalAmount
  });

  const entry = Ledger().createJournalEntry({
    type: 'expense',
    date: formData.date,
    description: formData.notes,
    lines
  });

  entry.isSplit = true; // Helper flag for UI

  const validation = Ledger().validateJournalEntry(entry);
  if (!validation.valid) return { success: false, errors: validation.errors };

  await DB().saveJournalEntry(entry);
  State().addEntry(entry);

  return { success: true, entry };
}
```

**Display Helper:**
```javascript
// renderer.js
function isSplitTransaction(entry) {
  return entry.isSplit || entry.lines.filter(l => l.debit > 0).length > 1;
}

function getSplitBreakdown(entry) {
  return entry.lines
    .filter(l => l.debit > 0)
    .map(l => ({
      account: State.getAccountById(l.accountId),
      amount: l.debit,
      memo: l.memo
    }));
}
```

### Business Impact

- **Accuracy:** Expenses categorized correctly
- **Reports:** Category summaries more accurate
- **Budgets:** Budget tracking more precise
- **User Experience:** Common use case solved elegantly

---

## 6. Receipt/Attachment Storage

**Priority:** P1 (High)
**Complexity:** High
**Impact:** Medium
**Target:** v1.4.0

### Problem Statement

Users need to:
- Store receipts for tax deduction claims
- Keep proof of payment
- Track warranty documents
- Maintain invoice records

Currently, **no way to attach documents to transactions.**

### Proposed Solution

Add **Attachment Management**:

1. **File Storage**
   - Store attachments in IndexedDB (as Base64 blobs)
   - Support images (JPEG, PNG), PDFs
   - Size limit: 5MB per attachment

2. **Capture Methods**
   - Upload from device
   - Camera capture (mobile)
   - Drag & drop (desktop)

3. **Attachment Management**
   - View attachments in transaction detail
   - Download attachment
   - Delete attachment
   - Multiple attachments per transaction

### User Experience

```
Transaction Detail

Mar 03  Laptop Purchase  ₹75,000
Type: Expense
Category: Personal/Shopping
From: Cash
Notes: New MacBook Pro

Attachments (2):
  ┌────────────────────────────────┐
  │ 📷 Receipt.jpg (850 KB)        │
  │ [View] [Download] [Delete]     │
  └────────────────────────────────┘

  ┌────────────────────────────────┐
  │ 📄 Invoice.pdf (1.2 MB)        │
  │ [View] [Download] [Delete]     │
  └────────────────────────────────┘

[+ Add Attachment]
  - 📷 Take Photo
  - 📁 Upload File
  - 📋 Scan Document
```

### Data Model

**New Store:** `attachments`

```javascript
{
  id: 'uuid',
  transactionId: 'journal_entry_uuid',
  fileName: 'Receipt_2026-03-03.jpg',
  fileType: 'image/jpeg', // MIME type
  fileSize: 850000, // bytes
  fileData: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...', // Base64
  thumbnailData: 'data:image/jpeg;base64,...', // Smaller preview
  uploadedAt: '2026-03-03T10:30:00Z',
  notes: 'Laptop invoice'
}
```

### Implementation Notes

**File Size Considerations:**
```javascript
// attachment-service.js
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_TOTAL_ATTACHMENTS = 100 * 1024 * 1024; // 100MB total

async function addAttachment(transactionId, file) {
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: 'File too large (max 5MB)' };
  }

  // Check total storage
  const totalSize = await getTotalAttachmentSize();
  if (totalSize + file.size > MAX_TOTAL_ATTACHMENTS) {
    return { success: false, error: 'Storage limit reached (100MB)' };
  }

  // Convert to Base64
  const fileData = await fileToBase64(file);

  // Generate thumbnail for images
  let thumbnailData = null;
  if (file.type.startsWith('image/')) {
    thumbnailData = await generateThumbnail(fileData, 200, 200);
  }

  const attachment = {
    id: Validators.generateId(),
    transactionId,
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    fileData,
    thumbnailData,
    uploadedAt: new Date().toISOString(),
    notes: ''
  };

  await DB.saveAttachment(attachment);
  return { success: true, attachment };
}
```

**Camera Capture (Mobile):**
```javascript
// modals.js
function showAttachmentModal(transactionId) {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const html = `
    <div class="modal">
      <h3>Add Attachment</h3>

      ${isMobile ? `
        <button id="captureCamera">
          <i class="ri-camera-line"></i>
          Take Photo
        </button>
      ` : ''}

      <button id="uploadFile">
        <i class="ri-upload-line"></i>
        Upload File
      </button>

      <input type="file" id="fileInput"
             accept="image/*,application/pdf"
             style="display:none"
             ${isMobile ? 'capture="environment"' : ''}>
    </div>
  `;

  // Event handlers
  document.getElementById('captureCamera')?.addEventListener('click', () => {
    document.getElementById('fileInput').click();
  });

  document.getElementById('fileInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    const result = await AttachmentService.addAttachment(transactionId, file);
    if (result.success) {
      Renderer.showToast('Attachment added', 'success');
      Renderer.updateUI();
    }
  });
}
```

**Storage Cleanup:**
```javascript
// When deleting transaction, also delete attachments
async function deleteTransaction(id) {
  const attachments = await DB.getAttachmentsByTransaction(id);
  for (const attachment of attachments) {
    await DB.deleteAttachment(attachment.id);
  }

  await DB.deleteJournalEntry(id);
  State.removeEntry(id);

  return { success: true };
}
```

### Business Impact

- **Tax Compliance:** Keep receipts for deductions
- **Proof of Payment:** Dispute resolution
- **Organization:** All financial documents in one place
- **Professional Use:** Essential for freelancers, businesses

**Note:** May need warning about IndexedDB storage limits (typically 50MB-1GB depending on browser).

---

## 7. Tags & Custom Categories

**Priority:** P1 (High)
**Complexity:** Low
**Impact:** Medium
**Target:** v1.2.0

### Problem Statement

Current categorization is **rigid**:
- Fixed chart of accounts
- One transaction → one category
- No cross-cutting tags

Users want to track:
- Transactions by project ("Project Alpha expenses")
- Transactions by client ("Client ABC payments")
- Tax-deductible items (tag: #TaxDeductible)
- Business vs. personal (tag: #Business)

**Tags provide flexible, multi-dimensional categorization.**

### Proposed Solution

Add **Tag System**:

1. **Tag Creation**
   - Create custom tags
   - Tag color coding
   - Tag icons (optional)

2. **Tagging Transactions**
   - Add multiple tags per transaction
   - Search/filter by tags
   - Tag autocomplete

3. **Tag Reports**
   - Total by tag
   - Tag combinations (e.g., #Business + #Travel)
   - Tag trends over time

### User Experience

```
Add Transaction

Type: Expense
Amount: ₹5,000
Category: Transport
From: Cash
Date: 2026-03-03
Notes: Client meeting travel

Tags: [#Business] [#ClientABC] [#TaxDeductible] [+ Add Tag]

[Add Transaction]
```

**Tag Management:**
```
Settings > Tags

My Tags (12):
  ┌────────────────────────────┐
  │ 🏢 #Business (35 uses)     │
  │ Color: Blue                │
  │ [Edit] [Delete]            │
  └────────────────────────────┘

  ┌────────────────────────────┐
  │ ✈️ #Travel (18 uses)        │
  │ Color: Green               │
  │ [Edit] [Delete]            │
  └────────────────────────────┘

  ┌────────────────────────────┐
  │ 💼 #ClientABC (8 uses)     │
  │ Color: Purple              │
  │ [Edit] [Delete]            │
  └────────────────────────────┘

[+ Create New Tag]
```

**Filter by Tag:**
```
List Tab > Filters

Month: [March 2026]
Category: [All Categories]
Tags: [#Business] [#Travel] ←  NEW

Showing 8 transactions
```

**Tag Report:**
```
Groups Tab > By Tag

Total by Tag - March 2026:
  #Business: ₹45,000 (12 transactions)
  #Travel: ₹15,000 (5 transactions)
  #TaxDeductible: ₹32,000 (8 transactions)
  #ClientABC: ₹25,000 (6 transactions)

Tag Combinations:
  #Business + #Travel: ₹12,000
  #Business + #TaxDeductible: ₹28,000
```

### Data Model

**New Store:** `tags`

```javascript
{
  id: 'uuid',
  name: 'Business',
  displayName: '#Business',
  color: '#3B82F6', // Hex color
  icon: '🏢', // optional emoji
  description: 'Business-related expenses',
  usageCount: 35, // calculated
  createdAt: '2026-01-01T00:00:00Z'
}
```

**Enhancement to `journal_entries`:**
```javascript
{
  // ... existing fields
  tags: ['tag_uuid_1', 'tag_uuid_2'] // array of tag IDs
}
```

### Implementation Notes

**Service Layer:**
```javascript
// tag-service.js
function createTag(name, color, icon) {
  const tag = {
    id: Validators.generateId(),
    name: name.replace(/^#/, ''), // Remove # if present
    displayName: name.startsWith('#') ? name : `#${name}`,
    color: color || getRandomColor(),
    icon: icon || '',
    description: '',
    usageCount: 0,
    createdAt: new Date().toISOString()
  };

  DB.saveTag(tag);
  State.addTag(tag);

  return { success: true, tag };
}

function getTagUsage(tagId) {
  const entries = State.getEntries();
  return entries.filter(e => e.tags?.includes(tagId)).length;
}

function getTagReport(month) {
  const tags = State.getTags();
  const entries = State.getEntries().filter(e => e.date.startsWith(month));

  const report = tags.map(tag => {
    const tagEntries = entries.filter(e => e.tags?.includes(tag.id));
    const total = tagEntries.reduce((sum, e) => sum + Ledger.getEntryTotal(e), 0);

    return {
      tag,
      total,
      count: tagEntries.length,
      entries: tagEntries
    };
  });

  return report.filter(r => r.count > 0).sort((a, b) => b.total - a.total);
}
```

**Autocomplete:**
```javascript
// forms.js - Tag input
function renderTagInput() {
  return `
    <div class="tag-input">
      <div class="selected-tags">
        ${selectedTags.map(tag => `
          <span class="tag-chip" style="background: ${tag.color}">
            ${tag.icon} ${tag.displayName}
            <button class="remove-tag" data-tag-id="${tag.id}">×</button>
          </span>
        `).join('')}
      </div>

      <input type="text" id="tagSearch" placeholder="Add tag..."
             autocomplete="off">

      <div class="tag-suggestions" style="display:none">
        ${availableTags.map(tag => `
          <div class="tag-suggestion" data-tag-id="${tag.id}">
            ${tag.icon} ${tag.displayName}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// Autocomplete logic
document.getElementById('tagSearch').addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase();
  const matches = availableTags.filter(tag =>
    tag.displayName.toLowerCase().includes(query)
  );

  if (matches.length > 0) {
    renderTagSuggestions(matches);
  } else {
    // Suggest creating new tag
    renderNewTagSuggestion(query);
  }
});
```

### Business Impact

- **Flexibility:** Multi-dimensional categorization
- **Power Users:** Essential for freelancers, small businesses
- **Tax Season:** Easily find all #TaxDeductible transactions
- **Client Tracking:** Track expenses by client/project
- **Low Complexity:** Easy to implement, high value

---

## 8. Cash Flow Forecasting

**Priority:** P1 (High)
**Complexity:** High
**Impact:** High
**Target:** v1.4.0

### Problem Statement

Users want to know:
- "Will I run out of money this month?"
- "When can I afford that ₹50,000 purchase?"
- "What will my balance be next month?"

Currently, they only see **historical data**, not **future predictions**.

**Cash flow forecasting answers "what's coming?"**

### Proposed Solution

Add **Cash Flow Forecast**:

1. **Prediction Engine**
   - Use historical data + recurring transactions
   - Predict income/expenses for next 3-6 months
   - Show projected balance over time

2. **Scenario Planning**
   - "What if I spend ₹20,000 extra?"
   - "What if I lose my job?"
   - "What if I get a bonus?"

3. **Visual Forecast**
   - Line chart: Projected balance
   - Highlight: Expected income/expense dates
   - Alerts: "Balance may go negative on Mar 25"

### User Experience

```
Cash Flow Tab (new tab)

Forecast: March - May 2026

Current Balance: ₹42,500

  ┌────────────────────────────────────────────┐
  │         Balance Forecast                   │
  │  ₹60k ┐                                    │
  │       │     ╱╲      ╱╲      ╱╲             │
  │  ₹50k ┤    ╱  ╲    ╱  ╲    ╱  ╲            │
  │       │   ╱    ╲  ╱    ╲  ╱    ╲           │
  │  ₹40k ┤  ╱      ╲╱      ╲╱      ╲          │
  │       │ ╱                        ╲         │
  │  ₹30k ┤╱                          ╲        │
  │       └────────────────────────────────    │
  │       Mar      Apr      May               │
  └────────────────────────────────────────────┘

Upcoming Transactions (Next 30 days):

  ✓ Expected Income:
    - Mar 01: Salary +₹50,000
    - Mar 15: Freelance +₹15,000

  ⚠ Expected Expenses:
    - Mar 01: Rent -₹15,000
    - Mar 05: Credit Card -₹8,000
    - Mar 10: Insurance -₹3,000
    - Mar 31: Rent -₹15,000 (next month)

  Projected Balance (Mar 31): ₹68,500 ✓

Scenarios:
  [+ What if I spend ₹20,000 on vacation?]
  [+ What if I lose my freelance income?]
  [+ What if I save ₹10,000 more per month?]

Alerts:
  ⚠ No alerts - Balance remains positive
```

**Scenario Planner:**
```
Scenario: Vacation Spending

Add one-time expense:
  Amount: ₹20,000
  Date: Mar 15
  Category: Travel

Result:
  Before: ₹68,500 (Mar 31)
  After: ₹48,500 (Mar 31)

  Still safe ✓

[Save Scenario] [Discard]
```

### Data Model

**New Store:** `forecasts`

```javascript
{
  id: 'uuid',
  generatedAt: '2026-03-03T00:00:00Z',
  forecastMonths: 3,
  currentBalance: 42500,
  projections: [
    {
      date: '2026-03-31',
      projectedBalance: 68500,
      expectedIncome: 65000,
      expectedExpenses: 39000,
      confidence: 85 // percentage (based on historical consistency)
    },
    {
      date: '2026-04-30',
      projectedBalance: 71200,
      expectedIncome: 50000,
      expectedExpenses: 47300,
      confidence: 80
    }
  ],
  upcomingTransactions: [
    {
      date: '2026-03-01',
      type: 'income',
      amount: 50000,
      description: 'Salary (recurring)',
      confidence: 95
    }
  ],
  alerts: []
}
```

**New Store:** `forecast_scenarios`

```javascript
{
  id: 'uuid',
  name: 'Vacation Spending',
  forecastId: 'forecast_uuid',
  adjustments: [
    {
      date: '2026-03-15',
      type: 'expense',
      amount: 20000,
      description: 'Vacation'
    }
  ],
  resultingBalance: 48500,
  createdAt: '2026-03-03T10:00:00Z'
}
```

### Implementation Notes

**Prediction Algorithm:**
```javascript
// forecast-service.js
function generateForecast(months = 3) {
  const currentBalance = getCurrentBalance();
  const recurringTransactions = DB.getActiveRecurringTemplates();
  const historicalData = getHistoricalAverages();

  const projections = [];
  let runningBalance = currentBalance;

  for (let i = 1; i <= months; i++) {
    const targetMonth = getMonthOffset(i);

    // 1. Predict from recurring transactions
    const recurringIncome = recurringTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const recurringExpenses = recurringTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // 2. Add historical variable expenses
    const variableExpenses = historicalData.averageVariableExpenses;

    // 3. Calculate projected balance
    const expectedIncome = recurringIncome;
    const expectedExpenses = recurringExpenses + variableExpenses;
    runningBalance = runningBalance + expectedIncome - expectedExpenses;

    // 4. Calculate confidence (based on historical consistency)
    const confidence = calculateConfidence(historicalData, i);

    projections.push({
      date: targetMonth,
      projectedBalance: Math.round(runningBalance),
      expectedIncome: Math.round(expectedIncome),
      expectedExpenses: Math.round(expectedExpenses),
      confidence
    });
  }

  // Check for alerts
  const alerts = generateAlerts(projections);

  return {
    id: Validators.generateId(),
    generatedAt: new Date().toISOString(),
    forecastMonths: months,
    currentBalance,
    projections,
    upcomingTransactions: getUpcomingTransactions(),
    alerts
  };
}

function calculateConfidence(historicalData, monthsOut) {
  // Confidence decreases as we look further out
  const baseConfidence = historicalData.consistency; // 0-100
  const decay = monthsOut * 5; // -5% per month
  return Math.max(50, baseConfidence - decay);
}

function generateAlerts(projections) {
  const alerts = [];

  for (const proj of projections) {
    if (proj.projectedBalance < 0) {
      alerts.push({
        type: 'danger',
        date: proj.date,
        message: `Balance may go negative on ${proj.date}`
      });
    } else if (proj.projectedBalance < 10000) {
      alerts.push({
        type: 'warning',
        date: proj.date,
        message: `Low balance warning: ₹${proj.projectedBalance} on ${proj.date}`
      });
    }
  }

  return alerts;
}
```

**Chart Rendering:**
```javascript
// Use Canvas API or SVG for chart
function renderForecastChart(forecast) {
  const canvas = document.getElementById('forecastChart');
  const ctx = canvas.getContext('2d');

  // Plot current balance
  const points = [
    { x: 0, y: forecast.currentBalance }
  ];

  // Plot projected balances
  forecast.projections.forEach((proj, idx) => {
    points.push({
      x: idx + 1,
      y: proj.projectedBalance
    });
  });

  // Draw line chart
  drawLineChart(ctx, points);
}
```

### Business Impact

- **Financial Awareness:** Know future financial position
- **Decision Making:** "Can I afford this?"
- **Stress Reduction:** No surprises, see problems coming
- **Goal Planning:** Know when you can reach savings goals
- **Premium Feature:** Differentiates from basic expense trackers

---

## 9-15: Quick Summaries

Due to document length, here are brief summaries of remaining features:

---

## 9. Tax Reporting & Categories

**Priority:** P2 | **Complexity:** Medium | **Target:** v1.4.0

- Mark transactions as tax-deductible
- Tax category tags (#TaxDeduction, #BusinessExpense)
- Generate tax reports by category
- Export for tax filing software
- Year-end summary with totals

**Business Impact:** Essential for freelancers, self-employed

---

## 10. Currency Conversion with Exchange Rates

**Priority:** P2 | **Complexity:** Medium | **Target:** v1.5.0

- Store exchange rates (manual or API)
- Convert multi-currency transactions to base currency
- Foreign transaction tracking
- Exchange rate history
- Multi-currency net worth

**Business Impact:** Critical for travelers, expats, international users

---

## 11. Payee Management

**Priority:** P2 | **Complexity:** Low | **Target:** v1.3.0

- Track who you paid/received from
- Payee autocomplete
- Payee history (all transactions with X)
- Vendor analysis (how much spent with each vendor)
- Quick re-pay feature

**Business Impact:** Better organization, useful for businesses

---

## 12. Financial Ratios Dashboard

**Priority:** P2 | **Complexity:** Medium | **Target:** v1.4.0

- Savings rate (savings / income)
- Expense ratio (expenses / income)
- Debt-to-income ratio
- Net worth trend
- Financial health score

**Business Impact:** Financial literacy, goal motivation

---

## 13. Custom Reports Builder

**Priority:** P2 | **Complexity:** High | **Target:** v1.5.0

- Drag-and-drop report builder
- Custom date ranges
- Filter by category, tag, payee
- Custom grouping (by week, quarter, year)
- Export reports as PDF/Excel

**Business Impact:** Power users, business users

---

## 14. Loan/Debt Tracking with Interest

**Priority:** P2 | **Complexity:** High | **Target:** v1.5.0

- Track loans (personal, business, mortgage)
- Calculate interest accrual
- Amortization schedules
- Payment tracking
- Early payoff calculator

**Business Impact:** Debt management, financial planning

---

## 15. Multi-Account Consolidation View

**Priority:** P3 | **Complexity:** Medium | **Target:** v1.6.0

- View all accounts at once
- Consolidated balance sheet
- Inter-account transfers
- Account comparison
- Portfolio view

**Business Impact:** Holistic financial picture

---

## Implementation Priority

### v1.2.0 (Next Release - Q2 2026)
- ✅ Recurring Transactions (P0)
- ✅ Budget Planning & Tracking (P0)
- ✅ Tags & Custom Categories (P1)

### v1.3.0 (Q3 2026)
- ✅ Transaction Reconciliation (P1)
- ✅ Financial Goals Tracking (P1)
- ✅ Split Transactions (P1)
- ✅ Payee Management (P2)

### v1.4.0 (Q4 2026)
- ✅ Receipt/Attachment Storage (P1)
- ✅ Cash Flow Forecasting (P1)
- ✅ Tax Reporting (P2)
- ✅ Financial Ratios Dashboard (P2)

### v1.5.0 (Q1 2027)
- ✅ Currency Conversion (P2)
- ✅ Custom Reports Builder (P2)
- ✅ Loan/Debt Tracking (P2)

### v1.6.0 (Q2 2027)
- ✅ Multi-Account Consolidation (P3)

---

## Technical Considerations

### Maintaining Architecture Principles

All features must:
- ✅ Maintain 4-layer architecture
- ✅ Keep domain layer pure
- ✅ Work 100% offline
- ✅ No external dependencies
- ✅ Respect privacy (no data transmission)

### Storage Management

- IndexedDB quotas: Typically 50MB-1GB
- Attachments consume most space
- Add storage monitoring dashboard
- Allow users to clean up old data

### Performance

- Pagination for large datasets
- Lazy loading for attachments
- Web Workers for heavy calculations (forecasting, reports)
- IndexedDB indexes for fast queries

---

## Conclusion

These **15 features** transform FinChronicleLedger from an expense tracker into a **comprehensive personal finance management system**.

**Priority:**
- **P0 features (2):** Critical for v1.2.0
- **P1 features (7):** High value, implement by v1.4.0
- **P2 features (5):** Nice-to-have, implement by v1.5.0
- **P3 features (1):** Future consideration

**Total Development Effort:** ~12-18 months for all features

**Recommended Approach:**
1. Start with **recurring transactions** and **budgets** (highest user demand)
2. Add **goals** and **split transactions** (easy wins)
3. Then tackle complex features (forecasting, reconciliation, custom reports)

---

**Document Author:** Architecture & Product Planning Team
**Date:** 2026-03-03
**Version:** 1.0
**Next Review:** After v1.2.0 release
