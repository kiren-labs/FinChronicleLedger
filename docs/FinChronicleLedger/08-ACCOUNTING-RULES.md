# FinChronicleLedger — Accounting Rules Reference

> Double-entry accounting rules, transaction patterns, and validation logic for developers.

---

## 1. The Fundamental Rule

> **Every financial transaction must be recorded in at least two accounts, with total debits equal to total credits.**

$$\sum \text{Debits} = \sum \text{Credits}$$

This is non-negotiable. An unbalanced entry must **never** be persisted to the database.

---

## 2. Account Types & Normal Balances

### 2.1 The Five Account Types

| Type | Normal Balance | Debit Effect | Credit Effect | Represents |
|------|---------------|-------------|--------------|------------|
| **Asset** | Debit | Increase ↑ | Decrease ↓ | What you own (cash, bank accounts, investments) |
| **Liability** | Credit | Decrease ↓ | Increase ↑ | What you owe (credit cards, loans) |
| **Equity** | Credit | Decrease ↓ | Increase ↑ | Net ownership (opening balances, retained earnings) |
| **Income** | Credit | Decrease ↓ | Increase ↑ | Money earned (salary, business revenue) |
| **Expense** | Debit | Increase ↑ | Decrease ↓ | Money spent (groceries, rent, utilities) |

### 2.2 The Accounting Equation

$$\text{Assets} = \text{Liabilities} + \text{Equity} + (\text{Income} - \text{Expenses})$$

**Extended form:**

$$\text{Assets} + \text{Expenses} = \text{Liabilities} + \text{Equity} + \text{Income}$$

This is why debits always equal credits:
- Left side of equation (Assets + Expenses) → **Debit-normal**
- Right side of equation (Liabilities + Equity + Income) → **Credit-normal**

### 2.3 Balance Calculation

```
For debit-normal accounts (Asset, Expense):
    Balance = Total Debits − Total Credits
    Positive = normal
    Negative = contra (unusual, but valid for reversals)

For credit-normal accounts (Liability, Equity, Income):
    Balance = Total Credits − Total Debits
    Positive = normal
    Negative = contra (unusual, but valid for reversals)
```

---

## 3. Common Transaction Patterns

### 3.1 Recording an Expense

**Scenario:** Buy groceries for ₹500 using debit card (from checking account)

| Account | Type | Debit | Credit |
|---------|------|-------|--------|
| 5000 Groceries | Expense | ₹500 | — |
| 1100 Checking | Asset | — | ₹500 |

**Effect:** Expense goes up (debit), Cash goes down (credit). Net worth decreases.

### 3.2 Recording Income

**Scenario:** Receive salary of ₹50,000 into checking account

| Account | Type | Debit | Credit |
|---------|------|-------|--------|
| 1100 Checking | Asset | ₹50,000 | — |
| 4000 Salary | Income | — | ₹50,000 |

**Effect:** Cash goes up (debit), Income goes up (credit). Net worth increases.

### 3.3 Transferring Between Accounts

**Scenario:** Move ₹10,000 from checking to savings

| Account | Type | Debit | Credit |
|---------|------|-------|--------|
| 1200 Savings | Asset | ₹10,000 | — |
| 1100 Checking | Asset | — | ₹10,000 |

**Effect:** One asset increases, another decreases. Total assets unchanged. Net worth unchanged. **No income or expense involved.**

### 3.4 Credit Card Purchase

**Scenario:** Dine out for ₹1,200 on credit card

| Account | Type | Debit | Credit |
|---------|------|-------|--------|
| 5100 Dining Out | Expense | ₹1,200 | — |
| 2000 Credit Card | Liability | — | ₹1,200 |

**Effect:** Expense goes up, Liability goes up. No cash moved. Net worth decreases.

### 3.5 Paying Credit Card Bill

**Scenario:** Pay ₹5,000 of credit card bill from checking

| Account | Type | Debit | Credit |
|---------|------|-------|--------|
| 2000 Credit Card | Liability | ₹5,000 | — |
| 1100 Checking | Asset | — | ₹5,000 |

**Effect:** Liability decreases, Cash decreases. **This is NOT an expense.** The expense was recorded when the purchase was made (3.4). This is just debt repayment. Net worth unchanged.

### 3.6 Opening Balances

**Scenario:** Set up accounts with existing balances

| Account | Type | Debit | Credit |
|---------|------|-------|--------|
| 1100 Checking | Asset | ₹1,00,000 | — |
| 1200 Savings | Asset | ₹3,00,000 | — |
| 1000 Cash | Asset | ₹5,000 | — |
| 2000 Credit Card | Liability | — | ₹12,000 |
| 3000 Opening Balance Equity | Equity | — | ₹3,93,000 |

**The equity line auto-balances:**
$$\text{OBE} = (1{,}00{,}000 + 3{,}00{,}000 + 5{,}000) - 12{,}000 = 3{,}93{,}000$$

### 3.7 Multi-Line Entry (Split Transaction)

**Scenario:** Grocery trip includes both food and household items

| Account | Type | Debit | Credit |
|---------|------|-------|--------|
| 5000 Groceries | Expense | ₹3,500 | — |
| 5940 Household | Expense | ₹1,500 | — |
| 1100 Checking | Asset | — | ₹5,000 |

**Effect:** Two expense accounts debited, one asset credited. Total debits (5,000) = Total credits (5,000). ✓

---

## 4. Validation Rules (Enforced in Code)

### 4.1 Journal Entry Validation (HARD FAIL)

These rules are checked before every write to IndexedDB. If any fail, the entry is **rejected**.

| Rule | Check | Error Message |
|------|-------|--------------|
| **Balanced** | `abs(sum(debits) - sum(credits)) < 0.001` | "Entry is not balanced" |
| **Min lines** | `lines.length >= 2` | "Must have at least 2 line items" |
| **No dual amounts** | For each line: `!(debit > 0 && credit > 0)` | "A line cannot have both debit and credit" |
| **No negatives** | For each line: `debit >= 0 && credit >= 0` | "Amounts cannot be negative" |
| **Decimal precision** | `Math.round(amount * 100) === amount * 100` | "Max 2 decimal places" |
| **Valid accounts** | All `accountId` values exist in accounts store | "Invalid account reference" |
| **Active accounts** | All referenced accounts have `isActive: true` | "Account is deactivated" |
| **Valid type** | `type in ['income', 'expense', 'transfer', 'opening']` | "Invalid entry type" |
| **Valid date** | Parseable, not future, not pre-1900 | "Invalid date" |

### 4.2 Amount Validation

| Rule | Constraint |
|------|-----------|
| Minimum | > 0 (no zero-amount transactions) |
| Maximum | ≤ 999,999,999 |
| Decimal places | ≤ 2 |
| Type | Must be a finite number |

### 4.3 Text Validation

| Field | Max Length | Sanitization |
|-------|-----------|-------------|
| Description / Notes | 500 chars | HTML entities escaped (XSS prevention) |
| Memo (line item) | 200 chars | HTML entities escaped |
| Account name | 100 chars | HTML entities escaped |

---

## 5. Trial Balance

### 5.1 What It Is
A report listing every account with a non-zero balance, showing whether total debits equal total credits across all accounts.

### 5.2 When to Verify
- **On app startup** — quick check, log warning if unbalanced
- **After every save** — already guaranteed by validation, but belt-and-suspenders
- **After migration** — critical verification step
- **After restore** — verify imported data integrity
- **On demand** — Advanced Mode "Trial Balance" view

### 5.3 What an Imbalance Means
If the trial balance doesn't balance, it means:
1. A bug in the journal entry creation logic, OR
2. Database corruption, OR
3. Manual database tampering

**Response:** Show a warning banner. Do NOT silently ignore it. Suggest the user restore from their last backup.

---

## 6. Reports Derived from Journal Entries

### 6.1 Monthly Income/Expense (Simple Mode Compatible)

For a given month, scan all journal entries:
- **Income** = Sum of credits to Income accounts minus debits to Income accounts
- **Expenses** = Sum of debits to Expense accounts minus credits to Expense accounts
- **Net** = Income − Expenses

This gives identical results to v3's simple `type === 'income'` / `type === 'expense'` filtering.

### 6.2 Account Balances (Advanced Mode)

For each account, sum all debits and credits from all journal entry lines referencing that account, then calculate balance based on normal balance direction.

### 6.3 Net Worth

$$\text{Net Worth} = \sum \text{Asset Balances} - \sum \text{Liability Balances}$$

### 6.4 Income Statement (v1.1)

```
Income
    Salary                    ₹50,000
    Freelance                 ₹10,000
    ─────────────────────────────────
    Total Income              ₹60,000

Expenses
    Groceries                  ₹4,500
    Dining Out                 ₹2,300
    Rent                      ₹15,000
    ─────────────────────────────────
    Total Expenses            ₹21,800

─────────────────────────────────────
Net Income                    ₹38,200
```

### 6.5 Balance Sheet (v1.1)

```
Assets
    Cash                       ₹5,000
    Checking                ₹1,45,000
    Savings                 ₹3,00,000
    ─────────────────────────────────
    Total Assets           ₹4,50,000

Liabilities
    Credit Card               ₹12,000
    ─────────────────────────────────
    Total Liabilities         ₹12,000

Equity
    Opening Balance Equity  ₹3,93,000
    Retained Earnings        ₹45,000
    ─────────────────────────────────
    Total Equity           ₹4,38,000

─────────────────────────────────────
Total Liabilities + Equity ₹4,50,000  ✓
```

---

## 7. Important Accounting Gotchas

### 7.1 Credit Card Is ALWAYS a Liability
- ❌ Never an asset (even if you have a credit balance/refund)
- A credit card with a positive credit balance is still a liability with a negative balance
- This was caught as a bug in early documentation — enforce it in code

### 7.2 Paying a Credit Card Is NOT an Expense
- The expense was recorded when the purchase was made
- Paying the card moves money from Asset (Checking) to Liability (Credit Card)
- If treated as an expense, expenses would be double-counted

### 7.3 Transfers Are NOT Income or Expense
- Moving money between your own accounts is just rearranging assets
- No P&L (profit & loss) impact
- Net worth unchanged

### 7.4 Savings/Investment Is NOT (Always) an Expense
- v3 has "Savings/Investments" as an expense category
- In v4, investing should be a transfer: DR Investment Account, CR Checking
- During migration, preserve as expense for fidelity. User can reclassify.

### 7.5 Opening Balance Equity Is a Real Account
- It's not a "magic" number — it's a proper equity account
- After opening balances, this account typically stays unchanged
- Its balance represents the net worth at the time the user started tracking

### 7.6 Rounding and Precision
- All amounts stored with exactly 2 decimal places
- Use `Math.round(amount * 100) / 100` for all calculations
- Trial balance tolerance: 0.001 (to handle floating-point drift)
- Display: Always show 2 decimal places in reports

---

## 8. Quick Reference: "What Happens When..."

| User Action | Debit | Credit | P&L Impact | Net Worth |
|-------------|-------|--------|-----------|-----------|
| Buy groceries (cash) | Expense ↑ | Asset ↓ | Expense ↑ | Decreases |
| Buy groceries (credit card) | Expense ↑ | Liability ↑ | Expense ↑ | Decreases |
| Receive salary | Asset ↑ | Income ↑ | Income ↑ | Increases |
| Transfer checking → savings | Asset (savings) ↑ | Asset (checking) ↓ | None | No change |
| Pay credit card bill | Liability ↓ | Asset ↓ | None | No change |
| Get a loan | Asset ↑ | Liability ↑ | None | No change |
| Repay a loan | Liability ↓ | Asset ↓ | None | No change |
| Set opening balances | Assets/Liabilities | Equity | None | Sets initial |
| Receive refund | Asset ↑ | Expense ↓ | Expense ↓ | Increases |
