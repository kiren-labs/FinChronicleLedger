/**
 * FinChronicleLedger — UI: Summary
 * Summary dashboard, compact view, actionable tiles.
 */
(function (global) {
    'use strict';

    const State = () => global.FCL.State;
    const ReportService = () => global.FCL.ReportService;
    const Settings = () => global.FCL.SettingsService;
    const R = () => global.FCL.UI.Renderer;

    // =====================================================================
    // Render
    // =====================================================================

    function render(mode) {
        const container = document.getElementById('summary-container');
        if (!container) return;

        const month = State().getCurrentMonth();
        const insights = ReportService().getMonthlyInsights(month);
        const collapsed = Settings().isSummaryCollapsed();

        const netClass = insights.net >= 0 ? 'amount--income' : 'amount--expense';
        const incomeDeltaHTML = _deltaHTML(insights.incomeDelta);
        const expenseDeltaHTML = _deltaHTML(insights.expenseDelta);

        container.innerHTML = `
            <div class="summary ${collapsed ? 'summary--collapsed' : ''}">
                <div class="summary-header" id="summary-toggle">
                    <div class="summary-header-left">
                        <h3>${R().formatMonth(month)}</h3>
                        ${collapsed ? `
                        <div class="summary-compact-values">
                            <span class="compact-val amount--income">${R().formatCurrency(insights.income)}</span>
                            <span class="compact-sep">|</span>
                            <span class="compact-val amount--expense">${R().formatCurrency(insights.expense)}</span>
                            <span class="compact-sep">|</span>
                            <span class="compact-val ${netClass}">Net ${R().formatCurrency(insights.net)}</span>
                        </div>` : ''}
                    </div>
                    <button class="btn btn--ghost btn--small" aria-label="Toggle summary">
                        <i class="ri-${collapsed ? 'arrow-down-s-line' : 'arrow-up-s-line'}"></i>
                    </button>
                </div>
                <div class="summary-body">
                    <div class="summary-tiles">
                        <div class="tile">
                            <span class="tile-label">Income</span>
                            <span class="tile-value amount--income">${R().formatCurrency(insights.income)}</span>
                            ${incomeDeltaHTML}
                        </div>
                        <div class="tile">
                            <span class="tile-label">Expenses</span>
                            <span class="tile-value amount--expense">${R().formatCurrency(insights.expense)}</span>
                            ${expenseDeltaHTML}
                        </div>
                        <div class="tile">
                            <span class="tile-label">Net</span>
                            <span class="tile-value ${netClass}">${R().formatCurrency(insights.net)}</span>
                        </div>
                        <div class="tile">
                            <span class="tile-label">Entries</span>
                            <span class="tile-value">${insights.count}</span>
                        </div>
                    </div>
                    ${insights.expensePercentage !== null ? `
                    <div class="summary-ratio">
                        Expense-to-Income: <strong>${insights.expensePercentage}%</strong>
                    </div>` : ''}
                    ${mode === 'advanced' ? _renderNetWorth() : ''}
                </div>
            </div>
        `;

        // Toggle collapsed
        const toggleBtn = document.getElementById('summary-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', async () => {
                await Settings().toggleSummaryCollapsed();
                render(mode);
            });
        }
    }

    function _deltaHTML(delta) {
        if (!delta || delta.pct === null) return '';
        const icon = delta.direction === 'up' ? 'ri-arrow-up-s-fill' : delta.direction === 'down' ? 'ri-arrow-down-s-fill' : '';
        const cls = delta.direction === 'up' ? 'delta--up' : delta.direction === 'down' ? 'delta--down' : 'delta--flat';
        return `<span class="delta ${cls}"><i class="${icon}"></i> ${Math.abs(delta.pct)}%</span>`;
    }

    function _renderNetWorth() {
        const report = ReportService().getAccountBalancesReport();
        return `
            <div class="summary-net-worth" data-mode="advanced">
                <span class="tile-label">Net Worth</span>
                <span class="tile-value">${R().formatCurrency(report.netWorth)}</span>
            </div>
        `;
    }

    // =====================================================================
    // Export
    // =====================================================================
    global.FCL = global.FCL || {};
    global.FCL.UI = global.FCL.UI || {};
    global.FCL.UI.Summary = { render };

})(window);
