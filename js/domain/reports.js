/**
 * FinChronicleLedger — Domain: Reports
 * Report calculations: monthly totals, MoM delta, top categories, budget health.
 * Pure functions — no I/O.
 */
(function (global) {
    'use strict';

    const T = () => global.FCL.Types;
    const A = () => global.FCL.Accounting;

    // =====================================================================
    // Monthly Totals
    // =====================================================================

    /**
     * Get income, expense totals (and count) for a given month (YYYY-MM).
     * @param {string} month - 'YYYY-MM'
     * @param {Array} journalEntries
     * @param {Array} accounts
     * @returns {{ income: number, expense: number, net: number, count: number }}
     */
    function getMonthlyTotals(month, journalEntries, accounts) {
        const accountMap = new Map(accounts.map(a => [a.id, a]));
        const monthEntries = journalEntries.filter(e => e.date.startsWith(month));

        let income = 0;
        let expense = 0;

        for (const entry of monthEntries) {
            for (const line of entry.lines) {
                const acc = accountMap.get(line.accountId);
                if (!acc) continue;
                if (acc.type === T().AccountType.INCOME) {
                    income += line.credit - line.debit; // Normal balance is credit
                } else if (acc.type === T().AccountType.EXPENSE) {
                    expense += line.debit - line.credit; // Normal balance is debit
                }
            }
        }

        income = A().round2(income);
        expense = A().round2(expense);

        return {
            income,
            expense,
            net: A().round2(income - expense),
            count: monthEntries.length,
        };
    }

    // =====================================================================
    // Month-over-Month Delta
    // =====================================================================

    /**
     * Calculate percentage change from previous to current value.
     * @param {number} current
     * @param {number} previous
     * @returns {{ pct: number|null, direction: 'up'|'down'|'flat' }}
     */
    function getMoMDelta(current, previous) {
        if (previous === 0) {
            return { pct: null, direction: current > 0 ? 'up' : 'flat' };
        }
        const pct = A().round2(((current - previous) / previous) * 100);
        let direction = 'flat';
        if (pct > 0) direction = 'up';
        else if (pct < 0) direction = 'down';
        return { pct, direction };
    }

    // =====================================================================
    // Expense-to-Income Ratio
    // =====================================================================

    /**
     * Calculate expense as percentage of income.
     * @param {number} expense
     * @param {number} income
     * @returns {number|null} — null if income is 0
     */
    function getExpensePercentage(expense, income) {
        if (income === 0) return null;
        return A().round2((expense / income) * 100);
    }

    // =====================================================================
    // Top Spending Categories
    // =====================================================================

    /**
     * Get top N expense accounts by amount for a given month.
     * @param {string} month - 'YYYY-MM'
     * @param {Array} journalEntries
     * @param {Array} accounts
     * @param {number} [limit=5]
     * @returns {Array<{ accountId: string, accountName: string, amount: number, pct: number }>}
     */
    function getTopSpendingCategories(month, journalEntries, accounts, limit) {
        limit = limit || 5;
        const accountMap = new Map(accounts.map(a => [a.id, a]));
        const monthEntries = journalEntries.filter(e => e.date.startsWith(month));

        // Accumulate expense per account
        const expenseTotals = new Map();
        for (const entry of monthEntries) {
            for (const line of entry.lines) {
                const acc = accountMap.get(line.accountId);
                if (!acc || acc.type !== T().AccountType.EXPENSE) continue;
                const amount = line.debit - line.credit;
                if (amount > 0) {
                    expenseTotals.set(acc.id, (expenseTotals.get(acc.id) || 0) + amount);
                }
            }
        }

        // Sort descending, take top N
        const sorted = [...expenseTotals.entries()]
            .map(([id, amount]) => ({ accountId: id, amount: A().round2(amount) }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, limit);

        // Calculate percentages
        const totalExpense = sorted.reduce((s, c) => s + c.amount, 0);
        return sorted.map(item => ({
            accountId: item.accountId,
            accountName: (accountMap.get(item.accountId) || {}).name || 'Unknown',
            amount: item.amount,
            pct: totalExpense > 0 ? A().round2((item.amount / totalExpense) * 100) : 0,
        }));
    }

    // =====================================================================
    // Budget Health / Spending Pace
    // =====================================================================

    /**
     * Calculate budget health for the current month.
     * Uses spending pace: are you on track to stay within last month's expense level?
     * @param {string} month - 'YYYY-MM'
     * @param {Array} journalEntries
     * @param {Array} accounts
     * @returns {{ dailyAverage: number, projectedMonthly: number, pace: string, daysElapsed: number, daysInMonth: number }}
     */
    function calculateBudgetHealth(month, journalEntries, accounts) {
        const [year, mon] = month.split('-').map(Number);
        const daysInMonth = new Date(year, mon, 0).getDate();
        const today = new Date();
        const isCurrentMonth =
            today.getFullYear() === year && today.getMonth() + 1 === mon;
        const daysElapsed = isCurrentMonth ? today.getDate() : daysInMonth;

        const totals = getMonthlyTotals(month, journalEntries, accounts);
        const dailyAverage = daysElapsed > 0 ? A().round2(totals.expense / daysElapsed) : 0;
        const projectedMonthly = A().round2(dailyAverage * daysInMonth);

        // Determine pace based on previous month
        const prevMonth = mon === 1
            ? `${year - 1}-12`
            : `${year}-${String(mon - 1).padStart(2, '0')}`;
        const prevTotals = getMonthlyTotals(prevMonth, journalEntries, accounts);

        let pace = 'on-track';
        if (prevTotals.expense > 0) {
            const ratio = projectedMonthly / prevTotals.expense;
            if (ratio > 1.15) pace = 'over';
            else if (ratio < 0.85) pace = 'under';
        }

        return {
            dailyAverage,
            projectedMonthly,
            pace,
            daysElapsed,
            daysInMonth,
        };
    }

    // =====================================================================
    // Available Months
    // =====================================================================

    /**
     * Get sorted, unique months (YYYY-MM) from all journal entries.
     * @param {Array} journalEntries
     * @returns {string[]}
     */
    function getAvailableMonths(journalEntries) {
        const set = new Set();
        for (const entry of journalEntries) {
            if (entry.date && entry.date.length >= 7) {
                set.add(entry.date.slice(0, 7));
            }
        }
        return [...set].sort().reverse(); // newest first
    }

    // =====================================================================
    // Grouped Data
    // =====================================================================

    /**
     * Group entries by month with totals.
     * @param {Array} journalEntries
     * @param {Array} accounts
     * @returns {Array<{ month: string, income: number, expense: number, net: number, count: number }>}
     */
    function getGroupedByMonth(journalEntries, accounts) {
        const months = getAvailableMonths(journalEntries);
        return months.map(m => ({
            month: m,
            ...getMonthlyTotals(m, journalEntries, accounts),
        }));
    }

    /**
     * Group expense entries by category (expense account) for a month.
     * @param {string} month
     * @param {Array} journalEntries
     * @param {Array} accounts
     * @returns {Array<{ accountId: string, accountName: string, amount: number }>}
     */
    function getGroupedByCategory(month, journalEntries, accounts) {
        const accountMap = new Map(accounts.map(a => [a.id, a]));
        const monthEntries = journalEntries.filter(e => e.date.startsWith(month));

        const totals = new Map();
        for (const entry of monthEntries) {
            for (const line of entry.lines) {
                const acc = accountMap.get(line.accountId);
                if (!acc || acc.type !== T().AccountType.EXPENSE) continue;
                const amount = line.debit - line.credit;
                if (amount > 0) {
                    totals.set(acc.id, (totals.get(acc.id) || 0) + amount);
                }
            }
        }

        return [...totals.entries()]
            .map(([id, amount]) => ({
                accountId: id,
                accountName: (accountMap.get(id) || {}).name || 'Unknown',
                amount: A().round2(amount),
            }))
            .sort((a, b) => b.amount - a.amount);
    }

    // =====================================================================
    // Export
    // =====================================================================
    global.FCL = global.FCL || {};
    global.FCL.Reports = {
        getMonthlyTotals,
        getMoMDelta,
        getExpensePercentage,
        getTopSpendingCategories,
        calculateBudgetHealth,
        getAvailableMonths,
        getGroupedByMonth,
        getGroupedByCategory,
    };

})(window);
