/**
 * FinChronicleLedger — Domain: Budget
 * Pure budget types, templates, validation, and status calculation.
 * No I/O — all functions are pure.
 */
(function (global) {
    'use strict';

    var Validators = function () { return global.FCL.Validators; };

    // =====================================================================
    // Budget Templates
    // =====================================================================

    var BudgetTemplates = Object.freeze({
        '50/30/20': { name: '50/30/20 Rule', description: '50% Needs / 30% Wants / 20% Savings', percentages: { needs: 50, wants: 30, savings: 20 } },
        '60/20/10/10': { name: '60/20/10/10', description: '60% Living / 20% Savings / 10% Debt / 10% Fun', percentages: { living: 60, savings: 20, debt: 10, fun: 10 } },
        'zero-based': { name: 'Zero-Based', description: 'Every unit assigned (Income - Expenses = 0)', percentages: null },
    });

    // =====================================================================
    // Create
    // =====================================================================

    /**
     * Create a new budget object.
     * @param {Object} params
     * @returns {Object} budget
     */
    function createBudget(params) {
        return {
            id: Validators().generateId(),
            month: params.month,
            overallBudget: params.overallBudget || null,
            alertThreshold: params.alertThreshold || 80,
            categoryBudgets: (params.categoryBudgets || []).map(function (cb) {
                return {
                    categoryAccountId: cb.categoryAccountId,
                    budgetAmount: cb.budgetAmount,
                };
            }),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    }

    // =====================================================================
    // Validation
    // =====================================================================

    /**
     * Validate a budget object.
     * @param {Object} budget
     * @returns {{valid: boolean, errors: string[]}}
     */
    function validateBudget(budget) {
        var errors = [];

        if (!budget.month || !/^\d{4}-\d{2}$/.test(budget.month)) {
            errors.push('Month must be in YYYY-MM format');
        }

        if (budget.overallBudget !== null && budget.overallBudget !== undefined) {
            if (typeof budget.overallBudget !== 'number' || budget.overallBudget <= 0) {
                errors.push('Overall budget must be a positive number');
            }
        }

        if (typeof budget.alertThreshold !== 'number' || budget.alertThreshold < 1 || budget.alertThreshold > 100) {
            errors.push('Alert threshold must be between 1 and 100');
        }

        if (!Array.isArray(budget.categoryBudgets)) {
            errors.push('Category budgets must be an array');
        } else {
            for (var i = 0; i < budget.categoryBudgets.length; i++) {
                var cb = budget.categoryBudgets[i];
                if (!cb.categoryAccountId) {
                    errors.push('Category budget ' + (i + 1) + ': missing account');
                }
                if (typeof cb.budgetAmount !== 'number' || cb.budgetAmount <= 0) {
                    errors.push('Category budget ' + (i + 1) + ': amount must be positive');
                }
            }
        }

        return { valid: errors.length === 0, errors: errors };
    }

    // =====================================================================
    // Status Calculation (pure — takes budget + entries, returns status)
    // =====================================================================

    /**
     * Calculate budget status from budget config and expense entries.
     * @param {Object} budget - the stored budget object
     * @param {Array} monthEntries - all journal entries for that month
     * @returns {Object} enriched budget status with computed fields
     */
    function calculateBudgetStatus(budget, monthEntries) {
        var expenseEntries = monthEntries.filter(function (e) {
            return e.type === 'expense';
        });

        var totalSpent = 0;
        var categoryStatuses = budget.categoryBudgets.map(function (cb) {
            var spent = 0;
            for (var i = 0; i < expenseEntries.length; i++) {
                var lines = expenseEntries[i].lines || [];
                for (var j = 0; j < lines.length; j++) {
                    if (lines[j].accountId === cb.categoryAccountId && lines[j].debit > 0) {
                        spent += lines[j].debit;
                    }
                }
            }
            totalSpent += spent;
            var pct = cb.budgetAmount > 0 ? Math.round((spent / cb.budgetAmount) * 100) : 0;
            var status = pct < budget.alertThreshold ? 'on-track'
                : pct < 100 ? 'approaching'
                : 'over';

            return {
                categoryAccountId: cb.categoryAccountId,
                budgetAmount: cb.budgetAmount,
                spentAmount: spent,
                percentageUsed: pct,
                status: status,
                remaining: cb.budgetAmount - spent,
            };
        });

        var overallPct = budget.overallBudget
            ? Math.round((totalSpent / budget.overallBudget) * 100)
            : null;

        return {
            id: budget.id,
            month: budget.month,
            overallBudget: budget.overallBudget,
            alertThreshold: budget.alertThreshold,
            totalSpent: totalSpent,
            overallPercentage: overallPct,
            overallRemaining: budget.overallBudget ? budget.overallBudget - totalSpent : null,
            overallStatus: overallPct === null ? null
                : overallPct < budget.alertThreshold ? 'on-track'
                : overallPct < 100 ? 'approaching'
                : 'over',
            categoryBudgets: categoryStatuses,
        };
    }

    /**
     * Calculate daily allowance.
     * @param {number} remaining - remaining budget
     * @param {string} month - YYYY-MM
     * @returns {number} daily allowance
     */
    function getDailyAllowance(remaining, month) {
        var today = new Date();
        var year = parseInt(month.slice(0, 4), 10);
        var mon = parseInt(month.slice(5, 7), 10);
        var daysInMonth = new Date(year, mon, 0).getDate();
        var currentDay = today.getFullYear() === year && (today.getMonth() + 1) === mon
            ? today.getDate()
            : 1;
        var daysLeft = Math.max(daysInMonth - currentDay + 1, 1);
        return Math.max(0, Math.round(remaining / daysLeft));
    }

    /**
     * Get days remaining in a month.
     * @param {string} month - YYYY-MM
     * @returns {number}
     */
    function getDaysRemaining(month) {
        var today = new Date();
        var year = parseInt(month.slice(0, 4), 10);
        var mon = parseInt(month.slice(5, 7), 10);
        var daysInMonth = new Date(year, mon, 0).getDate();
        var currentDay = today.getFullYear() === year && (today.getMonth() + 1) === mon
            ? today.getDate()
            : 0;
        return Math.max(daysInMonth - currentDay, 0);
    }

    // =====================================================================
    // Export
    // =====================================================================
    global.FCL = global.FCL || {};
    global.FCL.Budget = {
        BudgetTemplates: BudgetTemplates,
        createBudget: createBudget,
        validateBudget: validateBudget,
        calculateBudgetStatus: calculateBudgetStatus,
        getDailyAllowance: getDailyAllowance,
        getDaysRemaining: getDaysRemaining,
    };

})(window);
