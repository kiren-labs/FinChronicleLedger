# FinChronicleLedger — Chart of Accounts

> Default accounts seeded on first run. Users can rename and deactivate. Custom account creation deferred to v1.2.

---

## 1. Account Numbering Scheme

| Range | Type | Normal Balance |
|-------|------|----------------|
| 1000–1999 | **Asset** | Debit |
| 2000–2999 | **Liability** | Credit |
| 3000–3999 | **Equity** | Credit |
| 4000–4999 | **Income** | Credit |
| 5000–5999 | **Expense** | Debit |

---

## 2. Default Accounts

### Assets (1000–1999)

| Code | Name | System | Notes |
|------|------|--------|-------|
| 1000 | Cash | No | Physical cash on hand |
| 1100 | Checking Account | No | Primary bank account (default for Simple Mode) |
| 1200 | Savings Account | No | Savings deposits |
| 1300 | Secondary Checking | No | Additional bank account |
| 1400 | Fixed Deposits | No | Term deposits |
| 1500 | Investment Account | No | Stocks, mutual funds, etc. |

### Liabilities (2000–2999)

| Code | Name | System | Notes |
|------|------|--------|-------|
| 2000 | Credit Card | No | Credit card balance owed |
| 2100 | Personal Loan | No | Outstanding personal loans |
| 2200 | Auto Loan | No | Vehicle financing |
| 2300 | Home Loan / Mortgage | No | Housing loan |
| 2400 | Other Liabilities | No | Catch-all for other debts |

### Equity (3000–3999)

| Code | Name | System | Notes |
|------|------|--------|-------|
| 3000 | Opening Balance Equity | **Yes** | Balancing account for opening balances. Cannot be deleted. |
| 3100 | Retained Earnings | **Yes** | System account for period closings. Cannot be deleted. |

### Income (4000–4999)

| Code | Name | System | v3 Category Mapping |
|------|------|--------|---------------------|
| 4000 | Salary | No | Salary |
| 4100 | Business Income | No | Business |
| 4200 | Investment Returns | No | Investment |
| 4300 | Rental Income | No | Rental Income |
| 4400 | Freelance Income | No | Freelance |
| 4500 | Bonus | No | Bonus |
| 4600 | Gifts & Refunds Received | No | Gifts/Refunds |
| 4900 | Other Income | No | Other Income |

### Expenses (5000–5999)

| Code | Name | System | v3 Category Mapping |
|------|------|--------|---------------------|
| 5000 | Groceries | No | Groceries |
| 5100 | Dining Out | No | Food |
| 5150 | Coffee & Snacks | No | Food (sub-category) |
| 5200 | Public Transit | No | Transport |
| 5210 | Fuel & Parking | No | Transport (sub-category) |
| 5220 | Car Maintenance | No | Transport (sub-category) |
| 5300 | Electricity & Water | No | Utilities/Bills |
| 5310 | Internet & Phone | No | Utilities/Bills (sub-category) |
| 5320 | Subscriptions | No | Utilities/Bills (sub-category) |
| 5400 | Rent | No | Rent |
| 5410 | Mortgage Payment | No | Rent (housing) |
| 5500 | Kids & School | No | Kids/School |
| 5510 | Tuition & Education | No | Kids/School (sub-category) |
| 5600 | Fees & Documents | No | Fees/Docs |
| 5700 | Medical & Healthcare | No | Healthcare |
| 5710 | Fitness & Gym | No | Healthcare (sub-category) |
| 5800 | Personal & Shopping | No | Personal/Shopping |
| 5810 | Personal Care | No | Personal/Shopping (sub-category) |
| 5850 | Clothing | No | Personal/Shopping (sub-category) |
| 5900 | Insurance & Taxes | No | Insurance/Taxes |
| 5910 | Savings & Investments | No | Savings/Investments |
| 5920 | Debt & Loan Payments | No | Debt/Loans |
| 5930 | Charity & Gifts | No | Charity/Gifts |
| 5940 | Household | No | Household |
| 5950 | Other Expenses | No | Other Expense, Misc/Buffer |

---

## 3. v3 Category → v4 Account Migration Map

### Income Categories

| v3 Category | v4 Account Code | v4 Account Name |
|-------------|-----------------|-----------------|
| Salary | 4000 | Salary |
| Business | 4100 | Business Income |
| Investment | 4200 | Investment Returns |
| Rental Income | 4300 | Rental Income |
| Freelance | 4400 | Freelance Income |
| Bonus | 4500 | Bonus |
| Gifts/Refunds | 4600 | Gifts & Refunds Received |
| Other Income | 4900 | Other Income |

### Expense Categories

| v3 Category | v4 Account Code | v4 Account Name |
|-------------|-----------------|-----------------|
| Food | 5100 | Dining Out |
| Groceries | 5000 | Groceries |
| Transport | 5200 | Public Transit |
| Utilities/Bills | 5300 | Electricity & Water |
| Kids/School | 5500 | Kids & School |
| Fees/Docs | 5600 | Fees & Documents |
| Debt/Loans | 5920 | Debt & Loan Payments |
| Household | 5940 | Household |
| Other Expense | 5950 | Other Expenses |
| Rent | 5400 | Rent |
| Healthcare | 5700 | Medical & Healthcare |
| Personal/Shopping | 5800 | Personal & Shopping |
| Insurance/Taxes | 5900 | Insurance & Taxes |
| Savings/Investments | 5910 | Savings & Investments |
| Charity/Gifts | 5930 | Charity & Gifts |
| Misc/Buffer | 5950 | Other Expenses |

---

## 4. Account Management Rules (MVP)

### What Users CAN Do
- **Rename** any non-system account (change display name, keep code and type)
- **Deactivate** any non-system account (hides from dropdowns, preserves in reports)
- **Reactivate** previously deactivated accounts
- **Set a default asset account** for Simple Mode transactions

### What Users CANNOT Do (MVP)
- ❌ Create new accounts (deferred to v1.2)
- ❌ Delete accounts (would orphan journal entry references)
- ❌ Change account type/code (would break accounting integrity)
- ❌ Deactivate system accounts (Opening Balance Equity, Retained Earnings)

### Future (v1.2+)
- Create custom accounts with user-chosen code + name
- Sub-account hierarchies
- Account grouping for reports
- Merge accounts (consolidate two accounts into one)

---

## 5. Simple Mode Category Mapping

In Simple Mode, users see familiar category names (identical to v3). Behind the scenes, these map to accounts:

### Simple Mode Income Categories → Accounts
| User Sees | Maps To |
|-----------|---------|
| Salary | 4000 Salary |
| Business | 4100 Business Income |
| Investment | 4200 Investment Returns |
| Rental Income | 4300 Rental Income |
| Freelance | 4400 Freelance Income |
| Bonus | 4500 Bonus |
| Gifts/Refunds | 4600 Gifts & Refunds Received |
| Other Income | 4900 Other Income |

### Simple Mode Expense Categories → Accounts
| User Sees | Maps To |
|-----------|---------|
| Food | 5100 Dining Out |
| Groceries | 5000 Groceries |
| Transport | 5200 Public Transit |
| Utilities/Bills | 5300 Electricity & Water |
| Kids/School | 5500 Kids & School |
| Fees/Docs | 5600 Fees & Documents |
| Debt/Loans | 5920 Debt & Loan Payments |
| Household | 5940 Household |
| Other Expense | 5950 Other Expenses |
| Rent | 5400 Rent |
| Healthcare | 5700 Medical & Healthcare |
| Personal/Shopping | 5800 Personal & Shopping |
| Insurance/Taxes | 5900 Insurance & Taxes |
| Savings/Investments | 5910 Savings & Investments |
| Charity/Gifts | 5930 Charity & Gifts |
| Misc/Buffer | 5950 Other Expenses |

*In Simple Mode, the default source/destination account is the user's default asset account (defaults to 1100 Checking Account).*

---

## 6. Account Data Definition (Seed Data)

```javascript
const DEFAULT_ACCOUNTS = [
    // Assets
    { code: 1000, name: "Cash",                    type: "asset",     isSystem: false },
    { code: 1100, name: "Checking Account",         type: "asset",     isSystem: false },
    { code: 1200, name: "Savings Account",          type: "asset",     isSystem: false },
    { code: 1300, name: "Secondary Checking",       type: "asset",     isSystem: false },
    { code: 1400, name: "Fixed Deposits",           type: "asset",     isSystem: false },
    { code: 1500, name: "Investment Account",       type: "asset",     isSystem: false },
    
    // Liabilities
    { code: 2000, name: "Credit Card",              type: "liability", isSystem: false },
    { code: 2100, name: "Personal Loan",            type: "liability", isSystem: false },
    { code: 2200, name: "Auto Loan",                type: "liability", isSystem: false },
    { code: 2300, name: "Home Loan / Mortgage",     type: "liability", isSystem: false },
    { code: 2400, name: "Other Liabilities",        type: "liability", isSystem: false },
    
    // Equity (System)
    { code: 3000, name: "Opening Balance Equity",   type: "equity",    isSystem: true  },
    { code: 3100, name: "Retained Earnings",        type: "equity",    isSystem: true  },
    
    // Income
    { code: 4000, name: "Salary",                   type: "income",    isSystem: false },
    { code: 4100, name: "Business Income",          type: "income",    isSystem: false },
    { code: 4200, name: "Investment Returns",       type: "income",    isSystem: false },
    { code: 4300, name: "Rental Income",            type: "income",    isSystem: false },
    { code: 4400, name: "Freelance Income",         type: "income",    isSystem: false },
    { code: 4500, name: "Bonus",                    type: "income",    isSystem: false },
    { code: 4600, name: "Gifts & Refunds Received", type: "income",    isSystem: false },
    { code: 4900, name: "Other Income",             type: "income",    isSystem: false },
    
    // Expenses
    { code: 5000, name: "Groceries",                type: "expense",   isSystem: false },
    { code: 5100, name: "Dining Out",               type: "expense",   isSystem: false },
    { code: 5150, name: "Coffee & Snacks",          type: "expense",   isSystem: false },
    { code: 5200, name: "Public Transit",            type: "expense",   isSystem: false },
    { code: 5210, name: "Fuel & Parking",            type: "expense",   isSystem: false },
    { code: 5220, name: "Car Maintenance",           type: "expense",   isSystem: false },
    { code: 5300, name: "Electricity & Water",       type: "expense",   isSystem: false },
    { code: 5310, name: "Internet & Phone",          type: "expense",   isSystem: false },
    { code: 5320, name: "Subscriptions",             type: "expense",   isSystem: false },
    { code: 5400, name: "Rent",                      type: "expense",   isSystem: false },
    { code: 5410, name: "Mortgage Payment",          type: "expense",   isSystem: false },
    { code: 5500, name: "Kids & School",             type: "expense",   isSystem: false },
    { code: 5510, name: "Tuition & Education",       type: "expense",   isSystem: false },
    { code: 5600, name: "Fees & Documents",          type: "expense",   isSystem: false },
    { code: 5700, name: "Medical & Healthcare",      type: "expense",   isSystem: false },
    { code: 5710, name: "Fitness & Gym",             type: "expense",   isSystem: false },
    { code: 5800, name: "Personal & Shopping",       type: "expense",   isSystem: false },
    { code: 5810, name: "Personal Care",             type: "expense",   isSystem: false },
    { code: 5850, name: "Clothing",                  type: "expense",   isSystem: false },
    { code: 5900, name: "Insurance & Taxes",         type: "expense",   isSystem: false },
    { code: 5910, name: "Savings & Investments",     type: "expense",   isSystem: false },
    { code: 5920, name: "Debt & Loan Payments",      type: "expense",   isSystem: false },
    { code: 5930, name: "Charity & Gifts",           type: "expense",   isSystem: false },
    { code: 5940, name: "Household",                 type: "expense",   isSystem: false },
    { code: 5950, name: "Other Expenses",            type: "expense",   isSystem: false },
];
```

**Total: 45 default accounts** (6 Asset + 5 Liability + 2 Equity + 8 Income + 24 Expense)
