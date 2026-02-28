/**
 * FinChronicleLedger — Domain: Chart of Accounts
 * Default account definitions (seed data), lookups, migration category map.
 * Pure data — no I/O.
 */
(function (global) {
    'use strict';

    const T = () => global.FCL.Types;

    // =====================================================================
    // 45 Default Accounts
    // =====================================================================

    const DEFAULT_ACCOUNTS = [
        // Assets (1000-1999)
        { code: 1000, name: 'Cash',                    type: 'asset',     isSystem: false },
        { code: 1100, name: 'Checking Account',         type: 'asset',     isSystem: false },
        { code: 1200, name: 'Savings Account',          type: 'asset',     isSystem: false },
        { code: 1300, name: 'Secondary Checking',       type: 'asset',     isSystem: false },
        { code: 1400, name: 'Fixed Deposits',           type: 'asset',     isSystem: false },
        { code: 1500, name: 'Investment Account',       type: 'asset',     isSystem: false },

        // Liabilities (2000-2999)
        { code: 2000, name: 'Credit Card',              type: 'liability', isSystem: false },
        { code: 2100, name: 'Personal Loan',            type: 'liability', isSystem: false },
        { code: 2200, name: 'Auto Loan',                type: 'liability', isSystem: false },
        { code: 2300, name: 'Home Loan / Mortgage',     type: 'liability', isSystem: false },
        { code: 2400, name: 'Other Liabilities',        type: 'liability', isSystem: false },

        // Equity (3000-3999) — System accounts
        { code: 3000, name: 'Opening Balance Equity',   type: 'equity',    isSystem: true  },
        { code: 3100, name: 'Retained Earnings',        type: 'equity',    isSystem: true  },

        // Income (4000-4999)
        { code: 4000, name: 'Salary',                   type: 'income',    isSystem: false },
        { code: 4100, name: 'Business Income',          type: 'income',    isSystem: false },
        { code: 4200, name: 'Investment Returns',       type: 'income',    isSystem: false },
        { code: 4300, name: 'Rental Income',            type: 'income',    isSystem: false },
        { code: 4400, name: 'Freelance Income',         type: 'income',    isSystem: false },
        { code: 4500, name: 'Bonus',                    type: 'income',    isSystem: false },
        { code: 4600, name: 'Gifts & Refunds Received', type: 'income',    isSystem: false },
        { code: 4900, name: 'Other Income',             type: 'income',    isSystem: false },

        // Expenses (5000-5999)
        { code: 5000, name: 'Groceries',                type: 'expense',   isSystem: false },
        { code: 5100, name: 'Dining Out',               type: 'expense',   isSystem: false },
        { code: 5150, name: 'Coffee & Snacks',          type: 'expense',   isSystem: false },
        { code: 5200, name: 'Public Transit',           type: 'expense',   isSystem: false },
        { code: 5210, name: 'Fuel & Parking',           type: 'expense',   isSystem: false },
        { code: 5220, name: 'Car Maintenance',          type: 'expense',   isSystem: false },
        { code: 5300, name: 'Electricity & Water',      type: 'expense',   isSystem: false },
        { code: 5310, name: 'Internet & Phone',         type: 'expense',   isSystem: false },
        { code: 5320, name: 'Subscriptions',            type: 'expense',   isSystem: false },
        { code: 5400, name: 'Rent',                     type: 'expense',   isSystem: false },
        { code: 5410, name: 'Mortgage Payment',         type: 'expense',   isSystem: false },
        { code: 5500, name: 'Kids & School',            type: 'expense',   isSystem: false },
        { code: 5510, name: 'Tuition & Education',      type: 'expense',   isSystem: false },
        { code: 5600, name: 'Fees & Documents',         type: 'expense',   isSystem: false },
        { code: 5700, name: 'Medical & Healthcare',     type: 'expense',   isSystem: false },
        { code: 5710, name: 'Fitness & Gym',            type: 'expense',   isSystem: false },
        { code: 5800, name: 'Personal & Shopping',      type: 'expense',   isSystem: false },
        { code: 5810, name: 'Personal Care',            type: 'expense',   isSystem: false },
        { code: 5850, name: 'Clothing',                 type: 'expense',   isSystem: false },
        { code: 5900, name: 'Insurance & Taxes',        type: 'expense',   isSystem: false },
        { code: 5910, name: 'Savings & Investments',    type: 'expense',   isSystem: false },
        { code: 5920, name: 'Debt & Loan Payments',     type: 'expense',   isSystem: false },
        { code: 5930, name: 'Charity & Gifts',          type: 'expense',   isSystem: false },
        { code: 5940, name: 'Household',                type: 'expense',   isSystem: false },
        { code: 5950, name: 'Other Expenses',           type: 'expense',   isSystem: false },
    ];

    // =====================================================================
    // v3 Category → v4 Account Code Migration Map
    // =====================================================================

    const MIGRATION_CATEGORY_MAP = {
        // Income
        'Salary':             { code: 4000, name: 'Salary' },
        'Business':           { code: 4100, name: 'Business Income' },
        'Investment':         { code: 4200, name: 'Investment Returns' },
        'Rental Income':      { code: 4300, name: 'Rental Income' },
        'Freelance':          { code: 4400, name: 'Freelance Income' },
        'Bonus':              { code: 4500, name: 'Bonus' },
        'Gifts/Refunds':      { code: 4600, name: 'Gifts & Refunds Received' },
        'Other Income':       { code: 4900, name: 'Other Income' },
        // Expenses
        'Food':               { code: 5100, name: 'Dining Out' },
        'Groceries':          { code: 5000, name: 'Groceries' },
        'Transport':          { code: 5200, name: 'Public Transit' },
        'Utilities/Bills':    { code: 5300, name: 'Electricity & Water' },
        'Kids/School':        { code: 5500, name: 'Kids & School' },
        'Fees/Docs':          { code: 5600, name: 'Fees & Documents' },
        'Debt/Loans':         { code: 5920, name: 'Debt & Loan Payments' },
        'Household':          { code: 5940, name: 'Household' },
        'Other Expense':      { code: 5950, name: 'Other Expenses' },
        'Rent':               { code: 5400, name: 'Rent' },
        'Healthcare':         { code: 5700, name: 'Medical & Healthcare' },
        'Personal/Shopping':  { code: 5800, name: 'Personal & Shopping' },
        'Insurance/Taxes':    { code: 5900, name: 'Insurance & Taxes' },
        'Savings/Investments':{ code: 5910, name: 'Savings & Investments' },
        'Charity/Gifts':      { code: 5930, name: 'Charity & Gifts' },
        'Misc/Buffer':        { code: 5950, name: 'Other Expenses' },
    };

    // =====================================================================
    // Lookup Helpers
    // =====================================================================

    /**
     * Get account definition by code.
     * @param {number} code
     * @returns {Object|undefined}
     */
    function getDefaultAccountByCode(code) {
        return DEFAULT_ACCOUNTS.find(a => a.code === code);
    }

    /**
     * Get all default accounts of a given type.
     * @param {string} type
     * @returns {Array}
     */
    function getDefaultAccountsByType(type) {
        return DEFAULT_ACCOUNTS.filter(a => a.type === type);
    }

    /**
     * Get the normal balance direction ('debit' or 'credit') for an account type.
     * @param {string} accountType
     * @returns {'debit'|'credit'}
     */
    function getNormalBalance(accountType) {
        return T().NormalBalance[accountType] || 'debit';
    }

    /**
     * Prepare seed array: adds id, normalBalance, isActive, timestamps, sortOrder.
     * Called once on first-run to populate IndexedDB.
     * @returns {Array<Object>} fully-formed Account objects
     */
    function buildSeedAccounts() {
        const V = global.FCL.Validators;
        const now = new Date().toISOString();

        return DEFAULT_ACCOUNTS.map((a, idx) => ({
            id: V.generateId(),
            code: a.code,
            name: a.name,
            type: a.type,
            normalBalance: getNormalBalance(a.type),
            isActive: true,
            isSystem: a.isSystem,
            parentId: null,
            sortOrder: idx,
            createdAt: now,
            updatedAt: now,
        }));
    }

    // =====================================================================
    // Export
    // =====================================================================
    global.FCL = global.FCL || {};
    global.FCL.ChartOfAccounts = {
        DEFAULT_ACCOUNTS,
        MIGRATION_CATEGORY_MAP,
        getDefaultAccountByCode,
        getDefaultAccountsByType,
        getNormalBalance,
        buildSeedAccounts,
    };

})(window);
