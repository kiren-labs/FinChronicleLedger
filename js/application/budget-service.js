/**
 * FinChronicleLedger — Application: Budget Service
 * Budget CRUD, status queries, alerts, and copy-forward.
 */
(function (global) {
    'use strict';

    var DB = function () { return global.FCL.DB; };
    var State = function () { return global.FCL.State; };
    var BudgetDomain = function () { return global.FCL.Budget; };
    var AccountService = function () { return global.FCL.AccountService; };

    /** In-memory budget cache */
    var _budgets = [];

    // =====================================================================
    // Load
    // =====================================================================

    /**
     * Load all budgets from IndexedDB into memory.
     */
    async function loadAll() {
        _budgets = await DB().getAllBudgets();
    }

    function getBudgets() { return _budgets; }

    // =====================================================================
    // Queries
    // =====================================================================

    /**
     * Get the raw budget for a month.
     * @param {string} month - YYYY-MM
     * @returns {Object|null}
     */
    function getBudgetForMonth(month) {
        return _budgets.find(function (b) { return b.month === month; }) || null;
    }

    /**
     * Get the computed budget status for a month (budget vs. actual spending).
     * @param {string} month - YYYY-MM
     * @returns {Object|null}
     */
    function getBudgetStatus(month) {
        var budget = getBudgetForMonth(month);
        if (!budget) return null;

        var entries = State().getEntries().filter(function (e) {
            return e.date && e.date.startsWith(month);
        });

        return BudgetDomain().calculateBudgetStatus(budget, entries);
    }

    // =====================================================================
    // CRUD
    // =====================================================================

    /**
     * Create or update a budget for a month.
     * @param {Object} params
     * @returns {Promise<{success: boolean, budget?: Object, errors?: string[]}>}
     */
    async function saveBudgetForMonth(params) {
        var existing = getBudgetForMonth(params.month);

        var budget;
        if (existing) {
            budget = Object.assign({}, existing, {
                overallBudget: params.overallBudget,
                alertThreshold: params.alertThreshold,
                categoryBudgets: params.categoryBudgets,
                updatedAt: new Date().toISOString(),
            });
        } else {
            budget = BudgetDomain().createBudget(params);
        }

        var validation = BudgetDomain().validateBudget(budget);
        if (!validation.valid) return { success: false, errors: validation.errors };

        await DB().saveBudget(budget);

        // Update in-memory cache
        var idx = _budgets.findIndex(function (b) { return b.month === params.month; });
        if (idx !== -1) {
            _budgets[idx] = budget;
        } else {
            _budgets.push(budget);
        }

        return { success: true, budget: budget };
    }

    /**
     * Delete a budget.
     * @param {string} month - YYYY-MM
     */
    async function deleteBudgetForMonth(month) {
        var budget = getBudgetForMonth(month);
        if (!budget) return;

        await DB().deleteBudget(budget.id);
        _budgets = _budgets.filter(function (b) { return b.month !== month; });
    }

    /**
     * Copy a budget to another month.
     * @param {string} sourceMonth - YYYY-MM
     * @param {string} targetMonth - YYYY-MM
     * @returns {Promise<{success: boolean, errors?: string[]}>}
     */
    async function copyBudgetToMonth(sourceMonth, targetMonth) {
        var source = getBudgetForMonth(sourceMonth);
        if (!source) return { success: false, errors: ['No budget found for ' + sourceMonth] };

        return saveBudgetForMonth({
            month: targetMonth,
            overallBudget: source.overallBudget,
            alertThreshold: source.alertThreshold,
            categoryBudgets: source.categoryBudgets.map(function (cb) {
                return { categoryAccountId: cb.categoryAccountId, budgetAmount: cb.budgetAmount };
            }),
        });
    }

    // =====================================================================
    // Alerts (called after transaction create)
    // =====================================================================

    /**
     * Check if a category budget is approaching or over. Returns alert info.
     * @param {string} month
     * @param {string} categoryAccountId
     * @returns {{type: string, percentageUsed: number, remaining: number}|null}
     */
    function checkBudgetAlert(month, categoryAccountId) {
        var status = getBudgetStatus(month);
        if (!status) return null;

        var cb = status.categoryBudgets.find(function (c) {
            return c.categoryAccountId === categoryAccountId;
        });
        if (!cb || cb.status === 'on-track') return null;

        return {
            type: cb.status,
            percentageUsed: cb.percentageUsed,
            remaining: cb.remaining,
            budgetAmount: cb.budgetAmount,
            spentAmount: cb.spentAmount,
        };
    }

    /**
     * Build template-based category budgets from income.
     * @param {string} templateKey
     * @param {number} monthlyIncome
     * @returns {Array<{categoryAccountId: string, budgetAmount: number}>}
     */
    function buildFromTemplate(templateKey, monthlyIncome) {
        // For templates, we distribute to expense categories proportionally
        var expenseAccounts = AccountService().getActiveAccountsByType('expense');
        if (expenseAccounts.length === 0) return [];

        var template = BudgetDomain().BudgetTemplates[templateKey];
        if (!template || !template.percentages) {
            // zero-based: split evenly
            var perCat = Math.round(monthlyIncome / expenseAccounts.length);
            return expenseAccounts.map(function (a) {
                return { categoryAccountId: a.id, budgetAmount: perCat };
            });
        }

        // For named templates, allocate the "needs" percentage across expense categories
        var needsPct = template.percentages.needs || template.percentages.living || 60;
        var totalForExpenses = Math.round(monthlyIncome * (needsPct / 100));
        var perCat2 = Math.round(totalForExpenses / expenseAccounts.length);
        return expenseAccounts.map(function (a) {
            return { categoryAccountId: a.id, budgetAmount: perCat2 };
        });
    }

    // =====================================================================
    // Export
    // =====================================================================
    global.FCL = global.FCL || {};
    global.FCL.BudgetService = {
        loadAll: loadAll,
        getBudgets: getBudgets,
        getBudgetForMonth: getBudgetForMonth,
        getBudgetStatus: getBudgetStatus,
        saveBudgetForMonth: saveBudgetForMonth,
        deleteBudgetForMonth: deleteBudgetForMonth,
        copyBudgetToMonth: copyBudgetToMonth,
        checkBudgetAlert: checkBudgetAlert,
        buildFromTemplate: buildFromTemplate,
    };

})(window);
