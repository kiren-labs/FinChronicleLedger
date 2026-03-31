/**
 * FinChronicleLedger — Application: Report Service
 * Report orchestration: monthly insights, trial balance, account balances.
 */
(function (global) {
    'use strict';

    const Reports = () => global.FCL.Reports;
    const Accounting = () => global.FCL.Accounting;
    const State = () => global.FCL.State;

    // =====================================================================
    // Monthly Insights (Summary dashboard)
    // =====================================================================

    /**
     * Get monthly insights for the summary dashboard.
     * @param {string} month - 'YYYY-MM'
     * @returns {Object}
     */
    function getMonthlyInsights(month) {
        const accounts = State().getAccounts();
        const entries = State().getEntries();

        const totals = Reports().getMonthlyTotals(month, entries, accounts);
        const topCategories = Reports().getTopSpendingCategories(month, entries, accounts, 5);
        const budgetHealth = Reports().calculateBudgetHealth(month, entries, accounts);
        const expensePct = Reports().getExpensePercentage(totals.expense, totals.income);

        // Previous month for comparison
        const [y, m] = month.split('-').map(Number);
        const prevMonth = m === 1
            ? `${y - 1}-12`
            : `${y}-${String(m - 1).padStart(2, '0')}`;
        const prevTotals = Reports().getMonthlyTotals(prevMonth, entries, accounts);

        const incomeDelta = Reports().getMoMDelta(totals.income, prevTotals.income);
        const expenseDelta = Reports().getMoMDelta(totals.expense, prevTotals.expense);
        const netDelta = Reports().getMoMDelta(totals.net, prevTotals.net);
        const countDelta = Reports().getMoMDelta(totals.count, prevTotals.count);

        return {
            month,
            income: totals.income,
            expense: totals.expense,
            net: totals.net,
            count: totals.count,
            expensePercentage: expensePct,
            incomeDelta,
            expenseDelta,
            netDelta,
            countDelta,
            topCategories,
            budgetHealth,
        };
    }

    // =====================================================================
    // Trial Balance (Advanced Mode)
    // =====================================================================

    /**
     * Get trial balance data — all accounts with balances.
     * @returns {Object}
     */
    function getTrialBalance() {
        const accounts = State().getAccounts();
        const entries = State().getEntries();

        const verification = Accounting().verifyTrialBalance(entries);
        const balances = Accounting().getAllBalances(accounts, entries);

        const rows = accounts
            .map(acc => {
                const balance = balances.get(acc.id) || 0;
                if (balance === 0) return null; // Skip zero-balance accounts
                const isDebitNormal = acc.type === 'asset' || acc.type === 'expense';
                return {
                    accountId: acc.id,
                    code: acc.code,
                    name: acc.name,
                    type: acc.type,
                    debit: isDebitNormal ? (balance >= 0 ? balance : 0) : (balance < 0 ? Math.abs(balance) : 0),
                    credit: isDebitNormal ? (balance < 0 ? Math.abs(balance) : 0) : (balance >= 0 ? balance : 0),
                };
            })
            .filter(Boolean)
            .sort((a, b) => a.code - b.code);

        const totalDebits = Accounting().round2(rows.reduce((s, r) => s + r.debit, 0));
        const totalCredits = Accounting().round2(rows.reduce((s, r) => s + r.credit, 0));

        return {
            rows,
            totalDebits,
            totalCredits,
            balanced: verification.balanced,
            difference: verification.difference,
        };
    }

    // =====================================================================
    // Account Balances Report (Advanced Mode)
    // =====================================================================

    /**
     * Get all account balances grouped by type.
     * @returns {Object}
     */
    function getAccountBalancesReport() {
        const accounts = State().getAccounts();
        const entries = State().getEntries();
        const balances = Accounting().getAllBalances(accounts, entries);
        const equation = Accounting().verifyAccountingEquation(accounts, entries);

        const grouped = {};
        for (const acc of accounts) {
            const balance = balances.get(acc.id) || 0;
            if (!grouped[acc.type]) grouped[acc.type] = [];
            grouped[acc.type].push({
                id: acc.id,
                code: acc.code,
                name: acc.name,
                balance,
                isActive: acc.isActive,
            });
        }

        // Sort each group by code
        for (const type of Object.keys(grouped)) {
            grouped[type].sort((a, b) => a.code - b.code);
        }

        return {
            grouped,
            netWorth: Accounting().calculateNetWorth(accounts, entries),
            equation,
        };
    }

    // =====================================================================
    // Budget Health
    // =====================================================================

    /**
     * Get budget health for a given month.
     * @param {string} month
     * @returns {Object}
     */
    function getBudgetHealth(month) {
        return Reports().calculateBudgetHealth(
            month, State().getEntries(), State().getAccounts()
        );
    }

    // =====================================================================
    // Grouped Views
    // =====================================================================

    /**
     * Get entries grouped by month with totals.
     * @returns {Array}
     */
    function getGroupedByMonth() {
        return Reports().getGroupedByMonth(State().getEntries(), State().getAccounts());
    }

    /**
     * Get expense entries grouped by category for a month.
     * @param {string} month
     * @returns {Array}
     */
    function getGroupedByCategory(month) {
        return Reports().getGroupedByCategory(month, State().getEntries(), State().getAccounts());
    }

    /**
     * Get available months.
     * @returns {string[]}
     */
    function getAvailableMonths() {
        return Reports().getAvailableMonths(State().getEntries());
    }

    /**
     * Get top spending categories for a month.
     * @param {string} month
     * @param {number} [limit=5]
     * @returns {Array}
     */
    function getTopSpendingCategories(month, limit) {
        return Reports().getTopSpendingCategories(
            month, State().getEntries(), State().getAccounts(), limit || 5
        );
    }

    // =====================================================================
    // Export
    // =====================================================================
    global.FCL = global.FCL || {};
    global.FCL.ReportService = {
        getMonthlyInsights,
        getTrialBalance,
        getAccountBalancesReport,
        getBudgetHealth,
        getGroupedByMonth,
        getGroupedByCategory,
        getAvailableMonths,
        getTopSpendingCategories,
    };

})(window);
