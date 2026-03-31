/**
 * FinChronicleLedger — UI: Settings
 * Settings tab rendering, FAQ, backup status, export/import controls.
 */
(function (global) {
    'use strict';

    const State = () => global.FCL.State;
    const Types = () => global.FCL.Types;
    const Settings = () => global.FCL.SettingsService;
    const BackupService = () => global.FCL.BackupService;
    const ImportExport = () => global.FCL.ImportExportService;
    const RecurringService = () => global.FCL.RecurringService;
    const RecurringDomain = () => global.FCL.Recurring;
    const AccountService = () => global.FCL.AccountService;
    const BudgetService = () => global.FCL.BudgetService;
    const FileIO = () => global.FCL.FileIO;
    const R = () => global.FCL.UI.Renderer;
    const Modals = () => global.FCL.UI.Modals;

    // =====================================================================
    // Render
    // =====================================================================

    function render() {
        const container = document.getElementById('settings-container');
        if (!container) return;

        const mode = Settings().getUIMode();
        const darkMode = State().getSetting('darkMode') || 'disabled';
        const currency = Settings().getCurrency();
        const backupStatus = BackupService().getBackupStatus();

        container.innerHTML = `
            <!-- Interface Mode -->
            <div class="settings-section">
                <h3>Interface Mode</h3>
                <div class="mode-toggle">
                    <button class="mode-btn ${mode === 'simple' ? 'mode-btn--active' : ''}" id="mode-simple">Simple</button>
                    <button class="mode-btn ${mode === 'advanced' ? 'mode-btn--active' : ''}" id="mode-advanced">Advanced</button>
                </div>
                <p class="text-muted">Simple Mode shows familiar categories. Advanced Mode shows accounts, debits & credits.</p>
            </div>

            <!-- Theme -->
            <div class="settings-section">
                <h3>Appearance</h3>
                <div class="setting-row">
                    <span>Dark Mode</span>
                    <button class="btn btn--small" id="dark-mode-toggle">
                        ${darkMode === 'enabled' ? '☀ Light' : '🌙 Dark'}
                    </button>
                </div>
            </div>

            <!-- Currency -->
            <div class="settings-section">
                <h3>Currency</h3>
                <div class="setting-row">
                    <span>Current: <strong>${Settings().getCurrencySymbol()} ${currency}</strong></span>
                    <button class="btn btn--small" id="change-currency">Change</button>
                </div>
            </div>

            <!-- Data -->
            <div class="settings-section">
                <h3>Data</h3>
                <div class="settings-buttons">
                    <button class="btn btn--secondary btn--full" id="export-csv">
                        <i class="ri-download-line"></i> Export CSV
                    </button>
                    <button class="btn btn--secondary btn--full" id="create-backup">
                        <i class="ri-save-line"></i> Create Full Backup (JSON)
                    </button>
                    <button class="btn btn--secondary btn--full" id="restore-backup">
                        <i class="ri-upload-line"></i> Restore from Backup
                    </button>
                </div>
                <input type="file" id="restore-file-input" accept=".json" class="hidden">
            </div>

            <!-- Backup Status -->
            <div class="settings-section">
                <h3>Backup Status</h3>
                ${backupStatus.lastBackup
                    ? `<p>Last backup: <strong>${new Date(backupStatus.lastBackup).toLocaleDateString()}</strong> (${backupStatus.daysSince} days ago)</p>`
                    : '<p class="text-warning">No backup created yet. Please backup your data regularly.</p>'
                }
                ${backupStatus.reminderDue ? '<p class="text-warning">⚠ Backup recommended — it\'s been a while!</p>' : ''}
            </div>

            <!-- Recurring Transactions -->
            <div class="settings-section">
                <h3>Recurring Transactions</h3>
                ${_renderRecurringList()}
                <button class="btn btn--secondary btn--full" id="add-recurring">
                    <i class="ri-add-line"></i> Create Recurring Transaction
                </button>
            </div>

            <!-- Monthly Budget -->
            <div class="settings-section">
                <h3>Monthly Budget</h3>
                ${_renderBudgetSummary()}
                <button class="btn btn--secondary btn--full" id="edit-budget">
                    <i class="ri-money-dollar-circle-line"></i> ${BudgetService().getBudgetForMonth(State().getCurrentMonth()) ? 'Edit Budget' : 'Set Up Budget'}
                </button>
            </div>

            <!-- About -->
            <div class="settings-section">
                <h3>About</h3>
                <p>${Types().APP_NAME} v${Types().APP_VERSION}</p>
                <p class="text-muted">A privacy-first, offline personal finance tracker with double-entry accounting.</p>
            </div>

            <!-- FAQ -->
            <div class="settings-section">
                <h3>FAQ</h3>
                <details class="faq-item">
                    <summary>Where is my data stored?</summary>
                    <p>All data is stored locally on your device using IndexedDB. Nothing is sent to any server.</p>
                </details>
                <details class="faq-item">
                    <summary>What is double-entry accounting?</summary>
                    <p>Every transaction records both where money comes from and where it goes. This ensures your books always balance.</p>
                </details>
                <details class="faq-item">
                    <summary>What's the difference between Simple and Advanced Mode?</summary>
                    <p>Simple Mode hides accounting details — you just pick a category and amount. Advanced Mode shows the full journal entry with debits and credits. Both use the same data.</p>
                </details>
                <details class="faq-item">
                    <summary>How do I backup my data?</summary>
                    <p>Go to Settings → Create Full Backup. This downloads a JSON file you can restore later.</p>
                </details>
            </div>
        `;

        _bindSettingsEvents();
        _applyBarWidths(container);
    }

    function _applyBarWidths(root) {
        root.querySelectorAll('.budget-bar-fill[data-pct]').forEach(function (el) {
            el.style.width = el.dataset.pct + '%';
        });
    }

    // =====================================================================
    // Event Binding
    // =====================================================================

    function _bindSettingsEvents() {
        // Mode toggle
        const simpleBtn = document.getElementById('mode-simple');
        const advancedBtn = document.getElementById('mode-advanced');
        if (simpleBtn) simpleBtn.addEventListener('click', async () => {
            await Settings().setUIMode('simple');
            if (global.FCL.UI.Navigation) global.FCL.UI.Navigation.updateNav();
            R().updateUI();
        });
        if (advancedBtn) advancedBtn.addEventListener('click', async () => {
            await Settings().setUIMode('advanced');
            if (global.FCL.UI.Navigation) global.FCL.UI.Navigation.updateNav();
            R().updateUI();
        });

        // Dark mode
        const darkBtn = document.getElementById('dark-mode-toggle');
        if (darkBtn) darkBtn.addEventListener('click', async () => {
            await Settings().toggleDarkMode();
            render();
        });

        // Currency
        const currencyBtn = document.getElementById('change-currency');
        if (currencyBtn) currencyBtn.addEventListener('click', () => {
            Modals().showCurrencyPicker(Types().Currencies, Settings().getCurrency(), async (code) => {
                await Settings().setCurrency(code);
                R().updateUI();
            });
        });

        // Export CSV
        const exportBtn = document.getElementById('export-csv');
        if (exportBtn) exportBtn.addEventListener('click', () => {
            ImportExport().exportCSV();
            R().showToast('CSV exported!', 'success');
        });

        // Create backup
        const backupBtn = document.getElementById('create-backup');
        if (backupBtn) backupBtn.addEventListener('click', async () => {
            await ImportExport().createFullBackup();
            R().showToast('Backup created!', 'success');
            render(); // refresh backup status
        });

        // Restore
        const restoreBtn = document.getElementById('restore-backup');
        const fileInput = document.getElementById('restore-file-input');
        if (restoreBtn && fileInput) {
            restoreBtn.addEventListener('click', () => {
                Modals().showRestoreConfirm(() => fileInput.click());
            });

            fileInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                try {
                    // Create pre-restore backup first
                    await ImportExport().createFullBackup();

                    const text = await FileIO().readFile(file);
                    const result = await ImportExport().restoreFromBackup(text);

                    if (result.success) {
                        R().showToast(`Restored: ${result.stats.entries} entries, ${result.stats.accounts} accounts`, 'success');
                        R().updateUI();
                    } else {
                        R().showToast(result.errors[0] || 'Restore failed', 'error');
                    }
                } catch (err) {
                    R().showToast('Restore failed: ' + err.message, 'error');
                }

                fileInput.value = ''; // Reset
            });
        }

        // Add recurring
        const addRecurringBtn = document.getElementById('add-recurring');
        if (addRecurringBtn) {
            addRecurringBtn.addEventListener('click', () => _showRecurringForm());
        }

        // Recurring template actions
        document.querySelectorAll('.recurring-pause-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                const template = RecurringService().getTemplateById(id);
                if (template) {
                    await RecurringService().toggleTemplate(id, !template.isActive);
                    render();
                }
            });
        });

        document.querySelectorAll('.recurring-delete-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                if (confirm('Delete this recurring template?')) {
                    await RecurringService().deleteTemplate(id);
                    render();
                }
            });
        });

        // Edit budget
        const editBudgetBtn = document.getElementById('edit-budget');
        if (editBudgetBtn) {
            editBudgetBtn.addEventListener('click', () => _showBudgetForm());
        }
    }

    // =====================================================================
    // Recurring Templates UI
    // =====================================================================

    function _renderRecurringList() {
        const templates = RecurringService().getTemplates();
        if (templates.length === 0) {
            return '<p class="text-muted">No recurring transactions set up yet.</p>';
        }

        const labels = RecurringDomain().FREQUENCY_LABELS;
        return templates.map(t => {
            const statusClass = t.isActive ? 'recurring-active' : 'recurring-paused';
            const statusLabel = t.isActive ? (t.autoCreate ? 'Auto' : 'Reminder') : 'Paused';
            const acc = t.categoryAccountId ? AccountService().getAccountById(t.categoryAccountId) : null;
            const catName = acc ? R().escapeHTML(acc.name) : (t.type === 'transfer' ? 'Transfer' : '');

            return `
                <div class="recurring-item ${statusClass}">
                    <div class="recurring-item-header">
                        <strong>${R().escapeHTML(t.name)}</strong>
                        <span class="recurring-amount">${R().formatCurrency(t.amount)}</span>
                    </div>
                    <div class="recurring-item-meta">
                        <span class="transaction-badge recurring-badge-${t.type}">${R().escapeHTML(t.type)}</span>
                        <span>${catName}</span>
                        <span>${labels[t.frequency] || t.frequency}</span>
                        <span class="recurring-status-badge">${statusLabel}</span>
                    </div>
                    ${t.nextDueDate ? `<div class="recurring-next-due">Next: ${R().formatDate(t.nextDueDate)}</div>` : ''}
                    <div class="recurring-item-actions">
                        <button class="btn btn--small btn--ghost recurring-pause-btn" data-id="${R().escapeHTML(t.id)}">${t.isActive ? 'Pause' : 'Resume'}</button>
                        <button class="btn btn--small btn--ghost btn--danger recurring-delete-btn" data-id="${R().escapeHTML(t.id)}">Delete</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    function _showRecurringForm() {
        const mount = document.getElementById('modalMount');
        if (!mount) return;

        const today = new Date().toISOString().slice(0, 10);
        const expenseCategories = Types().SimpleCategories.expense;
        const incomeCategories = Types().SimpleCategories.income;
        const assetAccounts = AccountService().getActiveAccountsByType('asset');
        const liabilityAccounts = AccountService().getActiveAccountsByType('liability');
        const transferAccounts = [...assetAccounts, ...liabilityAccounts];

        mount.innerHTML = `
            <div class="modal-overlay" id="recurring-modal-overlay">
                <div class="modal recurring-modal">
                    <h3>Create Recurring Transaction</h3>
                    <form id="recurring-form">
                        <div class="form-group">
                            <label for="rec-name">Name</label>
                            <input type="text" id="rec-name" maxlength="100" required placeholder="e.g., Monthly Rent">
                        </div>
                        <div class="form-group">
                            <label for="rec-type">Type</label>
                            <select id="rec-type" required>
                                <option value="expense">Expense</option>
                                <option value="income">Income</option>
                                <option value="transfer">Transfer</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="rec-amount">Amount</label>
                            <input type="number" id="rec-amount" step="0.01" min="0.01" required placeholder="0.00" inputmode="decimal">
                        </div>
                        <div class="form-group" id="rec-category-group">
                            <label for="rec-category">Category</label>
                            <select id="rec-category" required>
                                ${expenseCategories.map(c => `<option value="${c}">${c}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group hidden" id="rec-from-group">
                            <label for="rec-from">From Account</label>
                            <select id="rec-from">
                                ${transferAccounts.map(a => `<option value="${R().escapeHTML(a.id)}">${R().escapeHTML(a.name)}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group hidden" id="rec-to-group">
                            <label for="rec-to">To Account</label>
                            <select id="rec-to">
                                ${transferAccounts.map(a => `<option value="${R().escapeHTML(a.id)}">${R().escapeHTML(a.name)}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="rec-frequency">Frequency</label>
                            <select id="rec-frequency" required>
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly" selected>Monthly</option>
                                <option value="quarterly">Quarterly</option>
                                <option value="yearly">Yearly</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="rec-start">Start Date</label>
                            <input type="date" id="rec-start" value="${today}" required>
                        </div>
                        <div class="form-group">
                            <label for="rec-end">End Date (optional)</label>
                            <input type="date" id="rec-end">
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="rec-auto" checked>
                                Create automatically (otherwise reminder only)
                            </label>
                        </div>
                        <div class="form-group">
                            <label for="rec-notes">Notes (optional)</label>
                            <input type="text" id="rec-notes" maxlength="500" placeholder="Notes">
                        </div>
                        <button type="submit" class="btn btn--primary btn--full">Save Template</button>
                        <button type="button" class="btn btn--secondary btn--full" id="rec-cancel">Cancel</button>
                    </form>
                </div>
            </div>
        `;

        // Type toggle → show/hide category vs transfer fields
        const typeSelect = document.getElementById('rec-type');
        typeSelect.addEventListener('change', () => {
            const type = typeSelect.value;
            document.getElementById('rec-category-group').classList.toggle('hidden', type === 'transfer');
            document.getElementById('rec-from-group').classList.toggle('hidden', type !== 'transfer');
            document.getElementById('rec-to-group').classList.toggle('hidden', type !== 'transfer');

            // Swap category options
            if (type !== 'transfer') {
                const cats = type === 'income' ? incomeCategories : expenseCategories;
                document.getElementById('rec-category').innerHTML = cats.map(c => `<option value="${c}">${c}</option>`).join('');
            }
        });

        // Cancel
        document.getElementById('rec-cancel').addEventListener('click', () => {
            mount.innerHTML = '';
        });

        // Overlay click to close
        document.getElementById('recurring-modal-overlay').addEventListener('click', (e) => {
            if (e.target.id === 'recurring-modal-overlay') mount.innerHTML = '';
        });

        // Submit
        document.getElementById('recurring-form').addEventListener('submit', async (e) => {
            e.preventDefault();

            const type = typeSelect.value;
            const params = {
                name: document.getElementById('rec-name').value,
                type: type,
                amount: parseFloat(document.getElementById('rec-amount').value),
                frequency: document.getElementById('rec-frequency').value,
                startDate: document.getElementById('rec-start').value,
                endDate: document.getElementById('rec-end').value || null,
                autoCreate: document.getElementById('rec-auto').checked,
                notes: document.getElementById('rec-notes').value,
            };

            if (type === 'transfer') {
                params.fromAccountId = document.getElementById('rec-from').value;
                params.toAccountId = document.getElementById('rec-to').value;
            } else {
                const categoryName = document.getElementById('rec-category').value;
                const categoryCode = Types().CategoryAccountMap[categoryName];
                const categoryAccount = AccountService().getAccountByCode(categoryCode);
                const assetAccount = AccountService().getDefaultAssetAccount();
                if (!categoryAccount || !assetAccount) {
                    R().showToast('Account mapping error', 'error');
                    return;
                }
                params.categoryAccountId = categoryAccount.id;
                params.assetAccountId = assetAccount.id;
            }

            const result = await RecurringService().createTemplate(params);
            if (result.success) {
                R().showToast('Recurring template created!', 'success');
                mount.innerHTML = '';
                render();
            } else {
                R().showToast(result.errors[0] || 'Error creating template', 'error');
            }
        });
    }

    // =====================================================================
    // Budget UI
    // =====================================================================

    function _renderBudgetSummary() {
        var month = State().getCurrentMonth();
        var status = BudgetService().getBudgetStatus(month);
        if (!status) {
            return '<p class="text-muted">No budget set for this month.</p>';
        }

        var overallHTML = '';
        if (status.overallBudget) {
            var statusClass = status.overallStatus === 'on-track' ? 'budget-on-track'
                : status.overallStatus === 'approaching' ? 'budget-approaching'
                : 'budget-over';
            overallHTML = '<div class="budget-overall ' + statusClass + '">'
                + '<span>Overall: ' + R().formatCurrency(status.overallBudget) + ' budget</span>'
                + '<span>' + R().formatCurrency(status.totalSpent) + ' spent (' + status.overallPercentage + '%)</span>'
                + '<div class="budget-bar"><div class="budget-bar-fill" data-pct="' + Math.min(status.overallPercentage, 100) + '"></div></div>'
                + '</div>';
        }

        var catHTML = status.categoryBudgets.map(function (cb) {
            var acc = AccountService().getAccountById(cb.categoryAccountId);
            var name = acc ? R().escapeHTML(acc.name) : 'Unknown';
            var cls = cb.status === 'on-track' ? 'budget-on-track'
                : cb.status === 'approaching' ? 'budget-approaching'
                : 'budget-over';
            return '<div class="budget-category-row ' + cls + '">'
                + '<div class="budget-cat-header">'
                + '<span class="budget-cat-name">' + name + '</span>'
                + '<span class="budget-cat-amounts">' + R().formatCurrency(cb.spentAmount) + ' / ' + R().formatCurrency(cb.budgetAmount) + '</span>'
                + '</div>'
                + '<div class="budget-bar"><div class="budget-bar-fill" data-pct="' + Math.min(cb.percentageUsed, 100) + '"></div></div>'
                + '<span class="budget-cat-pct">' + cb.percentageUsed + '% — ' + _budgetStatusLabel(cb.status) + '</span>'
                + '</div>';
        }).join('');

        return overallHTML + '<div class="budget-categories">' + catHTML + '</div>';
    }

    function _budgetStatusLabel(status) {
        if (status === 'on-track') return 'On track';
        if (status === 'approaching') return 'Approaching limit';
        return 'Over budget';
    }

    function _showBudgetForm() {
        var mount = document.getElementById('modalMount');
        if (!mount) return;

        var month = State().getCurrentMonth();
        var existing = BudgetService().getBudgetForMonth(month);
        var expenseAccounts = AccountService().getActiveAccountsByType('expense');

        // Build category rows from existing budget or defaults
        var catBudgets = {};
        if (existing) {
            existing.categoryBudgets.forEach(function (cb) {
                catBudgets[cb.categoryAccountId] = cb.budgetAmount;
            });
        }

        var categoryRowsHTML = expenseAccounts.map(function (a) {
            var val = catBudgets[a.id] || '';
            return '<div class="budget-form-row">'
                + '<label>' + R().escapeHTML(a.name) + '</label>'
                + '<input type="number" step="0.01" min="0" data-account-id="' + R().escapeHTML(a.id) + '" class="budget-cat-input" value="' + val + '" placeholder="0.00" inputmode="decimal">'
                + '</div>';
        }).join('');

        // Previous month for copy button
        var parts = month.split('-');
        var prevDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 2, 1);
        var prevMonth = prevDate.getFullYear() + '-' + String(prevDate.getMonth() + 1).padStart(2, '0');
        var hasPrevBudget = !!BudgetService().getBudgetForMonth(prevMonth);

        mount.innerHTML = '<div class="modal-overlay" id="budget-modal-overlay">'
            + '<div class="modal budget-modal">'
            + '<h3>Budget — ' + R().formatMonth(month) + '</h3>'
            + '<form id="budget-form">'
            + '<div class="form-group">'
            + '<label for="budget-overall">Overall Budget (optional)</label>'
            + '<input type="number" id="budget-overall" step="0.01" min="0" value="' + (existing && existing.overallBudget ? existing.overallBudget : '') + '" placeholder="Total spending cap" inputmode="decimal">'
            + '</div>'
            + '<div class="form-group">'
            + '<label for="budget-threshold">Alert Threshold (%)</label>'
            + '<input type="number" id="budget-threshold" min="1" max="100" value="' + (existing ? existing.alertThreshold : 80) + '">'
            + '</div>'
            + '<div class="budget-form-categories">'
            + '<h4>Category Budgets</h4>'
            + categoryRowsHTML
            + '</div>'
            + '<button type="submit" class="btn btn--primary btn--full">Save Budget</button>'
            + (hasPrevBudget ? '<button type="button" class="btn btn--secondary btn--full" id="budget-copy-prev"><i class="ri-file-copy-line"></i> Copy from ' + R().formatMonth(prevMonth) + '</button>' : '')
            + (existing ? '<button type="button" class="btn btn--ghost btn--full btn--danger" id="budget-delete">Delete Budget</button>' : '')
            + '<button type="button" class="btn btn--secondary btn--full" id="budget-cancel">Cancel</button>'
            + '</form>'
            + '</div>'
            + '</div>';

        // Cancel
        document.getElementById('budget-cancel').addEventListener('click', function () {
            mount.innerHTML = '';
        });

        // Overlay click
        document.getElementById('budget-modal-overlay').addEventListener('click', function (e) {
            if (e.target.id === 'budget-modal-overlay') mount.innerHTML = '';
        });

        // Copy from previous
        var copyBtn = document.getElementById('budget-copy-prev');
        if (copyBtn) {
            copyBtn.addEventListener('click', async function () {
                var result = await BudgetService().copyBudgetToMonth(prevMonth, month);
                if (result.success) {
                    R().showToast('Copied from ' + prevMonth, 'success');
                    mount.innerHTML = '';
                    render();
                } else {
                    R().showToast(result.errors[0] || 'Copy failed', 'error');
                }
            });
        }

        // Delete
        var deleteBtn = document.getElementById('budget-delete');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', async function () {
                if (confirm('Delete budget for ' + month + '?')) {
                    await BudgetService().deleteBudgetForMonth(month);
                    R().showToast('Budget deleted', 'info');
                    mount.innerHTML = '';
                    render();
                }
            });
        }

        // Submit
        document.getElementById('budget-form').addEventListener('submit', async function (e) {
            e.preventDefault();

            var overallVal = document.getElementById('budget-overall').value;
            var thresholdVal = document.getElementById('budget-threshold').value;

            var categoryBudgets = [];
            document.querySelectorAll('.budget-cat-input').forEach(function (inp) {
                var amount = parseFloat(inp.value);
                if (amount > 0) {
                    categoryBudgets.push({
                        categoryAccountId: inp.dataset.accountId,
                        budgetAmount: amount,
                    });
                }
            });

            if (categoryBudgets.length === 0) {
                R().showToast('Set at least one category budget', 'error');
                return;
            }

            var result = await BudgetService().saveBudgetForMonth({
                month: month,
                overallBudget: overallVal ? parseFloat(overallVal) : null,
                alertThreshold: parseInt(thresholdVal, 10) || 80,
                categoryBudgets: categoryBudgets,
            });

            if (result.success) {
                R().showToast('Budget saved!', 'success');
                mount.innerHTML = '';
                render();
            } else {
                R().showToast(result.errors[0] || 'Error saving budget', 'error');
            }
        });
    }

    // =====================================================================
    // Export
    // =====================================================================
    global.FCL = global.FCL || {};
    global.FCL.UI = global.FCL.UI || {};
    global.FCL.UI.SettingsUI = { render };

})(window);
