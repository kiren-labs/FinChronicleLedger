/**
 * FinChronicleLedger — Domain: Accounting
 * Core accounting logic — balance calculations, trial balance, accounting equation.
 * Pure functions — no I/O.
 */
(function (global) {
    'use strict';

    const T = () => global.FCL.Types;

    // =====================================================================
    // Balance Calculations
    // =====================================================================

    /**
     * Calculate account balance based on type.
     * Debit-normal (asset, expense): balance = debits − credits
     * Credit-normal (liability, equity, income): balance = credits − debits
     *
     * @param {string} accountType - 'asset'|'liability'|'equity'|'income'|'expense'
     * @param {number} totalDebits
     * @param {number} totalCredits
     * @returns {number}
     */
    function calculateAccountBalance(accountType, totalDebits, totalCredits) {
        if (accountType === T().AccountType.ASSET || accountType === T().AccountType.EXPENSE) {
            return round2(totalDebits - totalCredits);
        }
        return round2(totalCredits - totalDebits);
    }

    /**
     * Get total debits and credits for a specific account across all entries.
     * @param {string} accountId
     * @param {Array} journalEntries
     * @returns {{ totalDebits: number, totalCredits: number }}
     */
    function getAccountTotals(accountId, journalEntries) {
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

        return {
            totalDebits: round2(totalDebits),
            totalCredits: round2(totalCredits),
        };
    }

    /**
     * Calculate balance for a single account.
     * @param {string} accountId
     * @param {string} accountType
     * @param {Array} journalEntries
     * @returns {number}
     */
    function getAccountBalance(accountId, accountType, journalEntries) {
        const totals = getAccountTotals(accountId, journalEntries);
        return calculateAccountBalance(accountType, totals.totalDebits, totals.totalCredits);
    }

    /**
     * Calculate balances for all accounts.
     * @param {Array} accounts
     * @param {Array} journalEntries
     * @returns {Map<string, number>} accountId → balance
     */
    function getAllBalances(accounts, journalEntries) {
        // Accumulate totals in single pass
        const totals = new Map();
        for (const acc of accounts) {
            totals.set(acc.id, { debits: 0, credits: 0 });
        }

        for (const entry of journalEntries) {
            for (const line of entry.lines) {
                const t = totals.get(line.accountId);
                if (t) {
                    t.debits += line.debit;
                    t.credits += line.credit;
                }
            }
        }

        const balances = new Map();
        for (const acc of accounts) {
            const t = totals.get(acc.id);
            balances.set(acc.id, calculateAccountBalance(acc.type, t.debits, t.credits));
        }

        return balances;
    }

    // =====================================================================
    // Trial Balance
    // =====================================================================

    /**
     * Verify trial balance across all journal entries.
     * @param {Array} journalEntries
     * @returns {{ balanced: boolean, totalDebits: number, totalCredits: number, difference: number }}
     */
    function verifyTrialBalance(journalEntries) {
        let totalDebits = 0;
        let totalCredits = 0;

        for (const entry of journalEntries) {
            for (const line of entry.lines) {
                totalDebits += line.debit;
                totalCredits += line.credit;
            }
        }

        totalDebits = round2(totalDebits);
        totalCredits = round2(totalCredits);
        const difference = round2(totalDebits - totalCredits);

        return {
            balanced: Math.abs(difference) < T().BALANCE_TOLERANCE,
            totalDebits,
            totalCredits,
            difference,
        };
    }

    // =====================================================================
    // Accounting Equation
    // =====================================================================

    /**
     * Verify accounting equation: Assets = Liabilities + Equity + (Income - Expenses)
     * @param {Array} accounts
     * @param {Array} journalEntries
     * @returns {{ valid: boolean, assets: number, liabilities: number, equity: number, income: number, expenses: number }}
     */
    function verifyAccountingEquation(accounts, journalEntries) {
        const balances = getAllBalances(accounts, journalEntries);
        let assets = 0, liabilities = 0, equity = 0, income = 0, expenses = 0;

        for (const acc of accounts) {
            const bal = balances.get(acc.id) || 0;
            switch (acc.type) {
                case T().AccountType.ASSET: assets += bal; break;
                case T().AccountType.LIABILITY: liabilities += bal; break;
                case T().AccountType.EQUITY: equity += bal; break;
                case T().AccountType.INCOME: income += bal; break;
                case T().AccountType.EXPENSE: expenses += bal; break;
            }
        }

        assets = round2(assets);
        liabilities = round2(liabilities);
        equity = round2(equity);
        income = round2(income);
        expenses = round2(expenses);

        const leftSide = assets;
        const rightSide = round2(liabilities + equity + income - expenses);

        return {
            valid: Math.abs(leftSide - rightSide) < T().BALANCE_TOLERANCE,
            assets,
            liabilities,
            equity,
            income,
            expenses,
        };
    }

    /**
     * Calculate net worth: Assets − Liabilities
     * @param {Array} accounts
     * @param {Array} journalEntries
     * @returns {number}
     */
    function calculateNetWorth(accounts, journalEntries) {
        const eq = verifyAccountingEquation(accounts, journalEntries);
        return round2(eq.assets - eq.liabilities);
    }

    // =====================================================================
    // Utility
    // =====================================================================

    /** Round to 2 decimal places */
    function round2(n) {
        return Math.round(n * 100) / 100;
    }

    // =====================================================================
    // Export
    // =====================================================================
    global.FCL = global.FCL || {};
    global.FCL.Accounting = {
        calculateAccountBalance,
        getAccountTotals,
        getAccountBalance,
        getAllBalances,
        verifyTrialBalance,
        verifyAccountingEquation,
        calculateNetWorth,
        round2,
    };

})(window);
