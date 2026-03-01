/**
 * FinChronicleLedger — UI: Reports (Advanced Mode)
 * Account balances, trial balance views.
 */
(function (global) {
    'use strict';

    const ReportService = () => global.FCL.ReportService;
    const R = () => global.FCL.UI.Renderer;

    // =====================================================================
    // Render
    // =====================================================================

    function render() {
        const container = document.getElementById('reports-container');
        if (!container) return;

        const balancesReport = ReportService().getAccountBalancesReport();
        const trialBalance = ReportService().getTrialBalance();

        container.innerHTML = `
            ${_renderAccountBalances(balancesReport)}
            ${_renderTrialBalance(trialBalance)}
        `;
    }

    // =====================================================================
    // Account Balances
    // =====================================================================

    function _renderAccountBalances(report) {
        const typeOrder = ['asset', 'liability', 'equity', 'income', 'expense'];
        const typeLabels = { asset: 'Assets', liability: 'Liabilities', equity: 'Equity', income: 'Income', expense: 'Expenses' };

        let html = '<div class="account-balances"><h3>Account Balances</h3>';

        for (const type of typeOrder) {
            const accounts = report.grouped[type] || [];
            const nonZero = accounts.filter(a => a.balance !== 0);
            if (nonZero.length === 0) continue;

            html += `<div class="balance-group"><h4>${typeLabels[type]}</h4>`;
            for (const acc of nonZero) {
                html += `
                    <div class="balance-row">
                        <span class="balance-code">${acc.code}</span>
                        <span class="balance-name">${R().escapeHTML(acc.name)}</span>
                        <span class="balance-amount">${R().formatCurrency(acc.balance)}</span>
                    </div>
                `;
            }
            html += '</div>';
        }

        html += `
            <div class="net-worth-row">
                <strong>Net Worth</strong>
                <strong>${R().formatCurrency(report.netWorth)}</strong>
            </div>
        </div>`;

        return html;
    }

    // =====================================================================
    // Trial Balance
    // =====================================================================

    function _renderTrialBalance(tb) {
        let rowsHTML = tb.rows.map(r => `
            <tr>
                <td>${R().escapeHTML(String(r.code))}</td>
                <td>${R().escapeHTML(r.name)}</td>
                <td class="text-right">${r.debit > 0 ? R().formatCurrency(r.debit) : ''}</td>
                <td class="text-right">${r.credit > 0 ? R().formatCurrency(r.credit) : ''}</td>
            </tr>
        `).join('');

        const statusIcon = tb.balanced ? '✓' : '✗';
        const statusClass = tb.balanced ? 'balance--ok' : 'balance--off';

        return `
            <div class="trial-balance">
                <h3>Trial Balance</h3>
                <table class="tb-table">
                    <thead>
                        <tr><th>Code</th><th>Account</th><th class="text-right">Debit</th><th class="text-right">Credit</th></tr>
                    </thead>
                    <tbody>${rowsHTML}</tbody>
                    <tfoot>
                        <tr class="tb-totals">
                            <td colspan="2"><strong>Total</strong></td>
                            <td class="text-right"><strong>${R().formatCurrency(tb.totalDebits)}</strong></td>
                            <td class="text-right"><strong>${R().formatCurrency(tb.totalCredits)}</strong></td>
                        </tr>
                    </tfoot>
                </table>
                <div class="tb-status ${statusClass}">${statusIcon} ${tb.balanced ? 'Balanced' : `Difference: ${R().formatCurrency(tb.difference)}`}</div>
            </div>
        `;
    }

    // =====================================================================
    // Export
    // =====================================================================
    global.FCL = global.FCL || {};
    global.FCL.UI = global.FCL.UI || {};
    global.FCL.UI.ReportsUI = { render };

})(window);
