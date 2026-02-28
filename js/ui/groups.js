/**
 * FinChronicleLedger — UI: Groups
 * Grouped views (by month, by category), insights, budget health card.
 */
(function (global) {
    'use strict';

    const State = () => global.FCL.State;
    const ReportService = () => global.FCL.ReportService;
    const R = () => global.FCL.UI.Renderer;

    // =====================================================================
    // Render
    // =====================================================================

    function render(mode) {
        const container = document.getElementById('groups-container');
        if (!container) return;

        const month = State().getCurrentMonth();
        const byMonth = ReportService().getGroupedByMonth();
        const byCategory = ReportService().getGroupedByCategory(month);
        const budgetHealth = ReportService().getBudgetHealth(month);
        const topCategories = _getTopCategories(month);

        container.innerHTML = `
            ${_renderBudgetHealth(budgetHealth)}
            ${_renderTopCategories(topCategories)}
            <h3 class="section-title">By Month</h3>
            ${_renderByMonth(byMonth)}
            <h3 class="section-title">By Category — ${R().formatMonth(month)}</h3>
            ${_renderByCategory(byCategory)}
        `;
    }

    // =====================================================================
    // Budget Health Card
    // =====================================================================

    function _renderBudgetHealth(bh) {
        const paceClass = bh.pace === 'over' ? 'health--over' : bh.pace === 'under' ? 'health--under' : 'health--on-track';
        const paceLabel = bh.pace === 'over' ? 'Over Pace' : bh.pace === 'under' ? 'Under Pace' : 'On Track';

        return `
            <div class="budget-health-card ${paceClass}">
                <h3>Budget Health</h3>
                <div class="health-status">${paceLabel}</div>
                <div class="health-details">
                    <div>Daily Average: ${R().formatCurrency(bh.dailyAverage)}</div>
                    <div>Projected: ${R().formatCurrency(bh.projectedMonthly)}</div>
                    <div>Day ${bh.daysElapsed} of ${bh.daysInMonth}</div>
                </div>
            </div>
        `;
    }

    // =====================================================================
    // Top Spending Categories
    // =====================================================================

    function _getTopCategories(month) {
        const entries = State().getEntries();
        const accounts = State().getAccounts();
        return global.FCL.Reports.getTopSpendingCategories(month, entries, accounts, 5);
    }

    function _renderTopCategories(categories) {
        if (categories.length === 0) return '';

        const items = categories.map(c => `
            <div class="top-category-item">
                <span class="category-name">${c.accountName}</span>
                <span class="category-amount">${R().formatCurrency(c.amount)}</span>
                <span class="category-pct">${c.pct}%</span>
            </div>
        `).join('');

        return `
            <div class="top-categories">
                <h3 class="section-title">Top Spending</h3>
                ${items}
            </div>
        `;
    }

    // =====================================================================
    // By Month
    // =====================================================================

    function _renderByMonth(groups) {
        if (groups.length === 0) return '<p class="text-muted">No data yet.</p>';

        return `<div class="grouped-list">${groups.map(g => `
            <div class="group-item">
                <div class="group-header">
                    <span class="group-month">${R().formatMonth(g.month)}</span>
                    <span class="group-count">${g.count} entries</span>
                </div>
                <div class="group-totals">
                    <span class="amount--income">+${R().formatCurrency(g.income)}</span>
                    <span class="amount--expense">-${R().formatCurrency(g.expense)}</span>
                    <span class="${g.net >= 0 ? 'amount--income' : 'amount--expense'}">Net: ${R().formatCurrency(g.net)}</span>
                </div>
            </div>
        `).join('')}</div>`;
    }

    // =====================================================================
    // By Category
    // =====================================================================

    function _renderByCategory(categories) {
        if (categories.length === 0) return '<p class="text-muted">No expenses this month.</p>';

        return `<div class="grouped-list">${categories.map(c => `
            <div class="group-item">
                <span class="group-name">${c.accountName}</span>
                <span class="amount--expense">${R().formatCurrency(c.amount)}</span>
            </div>
        `).join('')}</div>`;
    }

    // =====================================================================
    // Export
    // =====================================================================
    global.FCL = global.FCL || {};
    global.FCL.UI = global.FCL.UI || {};
    global.FCL.UI.Groups = { render };

})(window);
