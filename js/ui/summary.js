/**
 * FinChronicleLedger — UI: Summary
 * Summary dashboard, compact view, actionable tiles.
 */
(function (global) {
    'use strict';

    const State = () => global.FCL.State;
    const ReportService = () => global.FCL.ReportService;
    const Settings = () => global.FCL.SettingsService;
    const RecurringService = () => global.FCL.RecurringService;
    const BudgetService = () => global.FCL.BudgetService;
    const AccountService = () => global.FCL.AccountService;
    const BudgetDomain = () => global.FCL.Budget;
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
                    ${_renderBudgetWidget()}
                    ${_renderRecurringWidget()}
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

        // Bind recurring confirm/skip actions
        _bindRecurringActions();

        // Apply budget bar widths programmatically (CSP blocks inline style attributes)
        container.querySelectorAll('.budget-bar-fill[data-pct]').forEach(function (el) {
            el.style.width = el.dataset.pct + '%';
        });
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
    // Budget Widget
    // =====================================================================

    function _renderBudgetWidget() {
        if (!BudgetService()) return '';

        var month = State().getCurrentMonth();
        var status = BudgetService().getBudgetStatus(month);
        if (!status) return '';

        var html = '<div class="budget-widget">';
        html += '<h4 class="budget-widget-title"><i class="ri-wallet-3-line"></i> Budget</h4>';

        // Overall bar
        if (status.overallBudget) {
            var daysLeft = BudgetDomain().getDaysRemaining(month);
            var dailyAllowance = BudgetDomain().getDailyAllowance(status.overallRemaining, month);
            var overallCls = status.overallStatus === 'on-track' ? 'budget-on-track'
                : status.overallStatus === 'approaching' ? 'budget-approaching'
                : 'budget-over';

            html += '<div class="budget-overall-widget ' + overallCls + '">';
            html += '<div class="budget-overall-header">';
            html += '<span>' + R().formatCurrency(status.totalSpent) + ' / ' + R().formatCurrency(status.overallBudget) + '</span>';
            html += '<span>' + status.overallPercentage + '%</span>';
            html += '</div>';
            html += '<div class="budget-bar"><div class="budget-bar-fill" data-pct="' + Math.min(status.overallPercentage, 100) + '"></div></div>';
            html += '<div class="budget-overall-meta">';
            html += '<span>' + R().formatCurrency(Math.max(0, status.overallRemaining)) + ' remaining</span>';
            html += '<span>' + daysLeft + ' days left &middot; ' + R().formatCurrency(dailyAllowance) + '/day</span>';
            html += '</div>';
            html += '</div>';
        }

        // Top categories (show only approaching or over, max 3)
        var alerts = status.categoryBudgets.filter(function (cb) {
            return cb.status !== 'on-track';
        }).slice(0, 3);

        if (alerts.length > 0) {
            html += '<div class="budget-alerts">';
            for (var i = 0; i < alerts.length; i++) {
                var cb = alerts[i];
                var acc = AccountService().getAccountById(cb.categoryAccountId);
                var name = acc ? R().escapeHTML(acc.name) : 'Unknown';
                var cls = cb.status === 'approaching' ? 'budget-approaching' : 'budget-over';
                html += '<div class="budget-alert-item ' + cls + '">';
                html += '<span class="budget-alert-name">' + name + '</span>';
                html += '<span class="budget-alert-pct">' + cb.percentageUsed + '%</span>';
                html += '<div class="budget-bar budget-bar-sm"><div class="budget-bar-fill" data-pct="' + Math.min(cb.percentageUsed, 100) + '"></div></div>';
                html += '</div>';
            }
            html += '</div>';
        }

        html += '</div>';
        return html;
    }

    // =====================================================================
    // Recurring Widget
    // =====================================================================

    function _renderRecurringWidget() {
        if (!RecurringService()) return '';

        const pending = RecurringService().getPendingReminders();
        const upcoming = RecurringService().getUpcoming(7);

        if (pending.length === 0 && upcoming.length === 0) return '';

        let html = '<div class="recurring-upcoming-widget">';
        html += '<h4 class="recurring-widget-title"><i class="ri-calendar-schedule-line"></i> Recurring</h4>';

        // Pending reminders (need action)
        if (pending.length > 0) {
            html += '<div class="recurring-pending-list">';
            for (var i = 0; i < pending.length; i++) {
                var item = pending[i];
                html += '<div class="recurring-pending-item">';
                html += '<div class="recurring-pending-info">';
                html += '<span class="recurring-pending-name">' + R().escapeHTML(item.template.name) + '</span>';
                html += '<span class="recurring-pending-detail">' + R().formatCurrency(item.template.amount) + ' &middot; due ' + R().formatDate(item.record.dueDate) + '</span>';
                html += '</div>';
                html += '<div class="recurring-pending-actions">';
                html += '<button class="btn btn--small btn--primary recurring-confirm-btn" data-template-id="' + R().escapeHTML(item.template.id) + '" data-due-date="' + R().escapeHTML(item.record.dueDate) + '">Confirm</button>';
                html += '<button class="btn btn--small btn--ghost recurring-skip-btn" data-template-id="' + R().escapeHTML(item.template.id) + '" data-due-date="' + R().escapeHTML(item.record.dueDate) + '">Skip</button>';
                html += '</div>';
                html += '</div>';
            }
            html += '</div>';
        }

        // Upcoming (informational)
        if (upcoming.length > 0) {
            html += '<div class="recurring-upcoming-list">';
            for (var j = 0; j < upcoming.length; j++) {
                var u = upcoming[j];
                html += '<div class="recurring-upcoming-item">';
                html += '<span class="recurring-upcoming-name">' + R().escapeHTML(u.template.name) + '</span>';
                html += '<span class="recurring-upcoming-detail">' + R().formatCurrency(u.template.amount) + ' &middot; ' + R().formatDate(u.dueDate) + '</span>';
                html += '</div>';
            }
            html += '</div>';
        }

        html += '</div>';
        return html;
    }

    function _bindRecurringActions() {
        document.querySelectorAll('.recurring-confirm-btn').forEach(function (btn) {
            btn.addEventListener('click', async function () {
                var templateId = btn.dataset.templateId;
                var dueDate = btn.dataset.dueDate;
                await RecurringService().confirmPending(templateId, dueDate);

                // Reload entries into state since a new transaction was created
                var entries = await global.FCL.DB.getAllJournalEntries();
                State().setEntries(entries);
                R().showToast('Recurring transaction confirmed!', 'success');
            });
        });

        document.querySelectorAll('.recurring-skip-btn').forEach(function (btn) {
            btn.addEventListener('click', async function () {
                var templateId = btn.dataset.templateId;
                var dueDate = btn.dataset.dueDate;
                await RecurringService().skipPending(templateId, dueDate);
                R().showToast('Skipped', 'info');
                R().updateUI();
            });
        });
    }

    // =====================================================================
    // Export
    // =====================================================================
    global.FCL = global.FCL || {};
    global.FCL.UI = global.FCL.UI || {};
    global.FCL.UI.Summary = { render };

})(window);
