/**
 * FinChronicleLedger — UI: Forms
 * Simple Mode form, Advanced Mode journal editor, form submit handling.
 */
(function (global) {
    'use strict';

    const State = () => global.FCL.State;
    const Types = () => global.FCL.Types;
    const Settings = () => global.FCL.SettingsService;
    const AccountService = () => global.FCL.AccountService;
    const TransactionService = () => global.FCL.TransactionService;
    const BudgetService = () => global.FCL.BudgetService;
    const R = () => global.FCL.UI.Renderer;

    let _advancedLines = 2; // Number of journal lines in advanced editor
    let _splitMode = false; // Whether split transaction mode is active
    let _splitLines = 2;    // Number of split lines in simple mode

    // =====================================================================
    // Render
    // =====================================================================

    function render(mode) {
        if (mode === 'simple') {
            renderSimpleForm();
        } else {
            renderAdvancedForm();
        }
    }

    // =====================================================================
    // Simple Mode Form
    // =====================================================================

    function renderSimpleForm() {
        const container = document.getElementById('form-container');
        if (!container) return;

        const editingId = State().getEditingEntryId();
        const isEditing = !!editingId;

        // Get current type toggle value
        const formEl = document.getElementById('transaction-form');
        const currentType = formEl ? (formEl.dataset.type || 'expense') : 'expense';

        let categories;
        if (currentType === 'transfer') {
            categories = null; // Transfer uses account dropdowns
        } else if (currentType === 'income') {
            categories = Types().SimpleCategories.income;
        } else {
            categories = Types().SimpleCategories.expense;
        }

        const today = new Date().toISOString().slice(0, 10);

        // Build transfer-specific or category-based form
        if (currentType === 'transfer') {
            const assetAccounts = AccountService().getActiveAccountsByType('asset');
            const liabilityAccounts = AccountService().getActiveAccountsByType('liability');
            const transferAccounts = [...assetAccounts, ...liabilityAccounts];

            container.innerHTML = `
                <form id="transaction-form" data-type="transfer">
                    <div class="form-type-toggle">
                        <button type="button" class="type-btn" data-type="income">Income</button>
                        <button type="button" class="type-btn" data-type="expense">Expense</button>
                        <button type="button" class="type-btn type-btn--active" data-type="transfer">Transfer</button>
                    </div>
                    <div class="form-group">
                        <label for="amount">Amount (${Settings().getCurrencySymbol()})</label>
                        <input type="number" id="amount" step="0.01" min="0.01" required placeholder="0.00" inputmode="decimal">
                    </div>
                    <div class="form-group">
                        <label for="from-account">From Account</label>
                        <select id="from-account" required>
                            ${transferAccounts.map(a => `<option value="${R().escapeHTML(a.id)}">${R().escapeHTML(a.name)}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="to-account">To Account</label>
                        <select id="to-account" required>
                            ${transferAccounts.map(a => `<option value="${R().escapeHTML(a.id)}">${R().escapeHTML(a.name)}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="date">Date</label>
                        <input type="date" id="date" value="${today}" required>
                    </div>
                    <div class="form-group">
                        <label for="notes">Notes (optional)</label>
                        <input type="text" id="notes" maxlength="500" placeholder="Transfer notes">
                    </div>
                    <button type="submit" class="btn btn--primary btn--full">${isEditing ? 'Update Transfer' : 'Transfer'}</button>
                    ${isEditing ? '<button type="button" class="btn btn--secondary btn--full" id="cancel-edit">Cancel</button>' : ''}
                </form>
            `;
        } else {
            // Build split lines HTML if split mode is active
            let splitHTML = '';
            if (_splitMode) {
                const symbol = Settings().getCurrencySymbol();
                let splitLinesHTML = '';
                for (let i = 0; i < _splitLines; i++) {
                    splitLinesHTML += `
                        <div class="split-line" data-split="${i}">
                            <select class="split-category" data-split="${i}" required>
                                ${categories.map(c => `<option value="${c}">${c}</option>`).join('')}
                            </select>
                            <input type="number" class="split-amount" data-split="${i}" step="0.01" min="0.01" placeholder="0.00" inputmode="decimal" required>
                            ${_splitLines > 2 ? `<button type="button" class="btn btn--ghost btn--small split-remove-btn" data-split="${i}" title="Remove"><i class="ri-close-line"></i></button>` : ''}
                        </div>
                    `;
                }
                splitHTML = `
                    <div class="split-container">
                        <div class="split-header">
                            <span class="split-label">Split Categories</span>
                            <button type="button" class="btn btn--ghost btn--small" id="cancel-split">Cancel Split</button>
                        </div>
                        ${splitLinesHTML}
                        <button type="button" class="btn btn--secondary btn--small" id="add-split-line">+ Add Category</button>
                        <div class="split-total" id="split-total">Total: ${symbol}0.00</div>
                    </div>
                `;
            }

            container.innerHTML = `
                <form id="transaction-form" data-type="${currentType}">
                    <div class="form-type-toggle">
                        <button type="button" class="type-btn ${currentType === 'income' ? 'type-btn--active' : ''}" data-type="income">Income</button>
                        <button type="button" class="type-btn ${currentType === 'expense' ? 'type-btn--active' : ''}" data-type="expense">Expense</button>
                        <button type="button" class="type-btn ${currentType === 'transfer' ? 'type-btn--active' : ''}" data-type="transfer">Transfer</button>
                    </div>
                    ${_splitMode ? '' : `
                    <div class="form-group">
                        <label for="amount">Amount (${Settings().getCurrencySymbol()})</label>
                        <input type="number" id="amount" step="0.01" min="0.01" required placeholder="0.00" inputmode="decimal">
                    </div>
                    <div class="form-group">
                        <label for="category">Category</label>
                        <select id="category" required>
                            ${categories.map(c => `<option value="${c}">${c}</option>`).join('')}
                        </select>
                    </div>
                    `}
                    ${splitHTML}
                    <div class="form-group">
                        <label for="date">Date</label>
                        <input type="date" id="date" value="${today}" required>
                    </div>
                    <div class="form-group">
                        <label for="notes">Notes (optional)</label>
                        <input type="text" id="notes" maxlength="500" placeholder="Add a note">
                    </div>
                    ${!_splitMode && !isEditing ? '<button type="button" class="btn btn--ghost btn--small split-toggle-btn" id="toggle-split"><i class="ri-scissors-line"></i> Split this transaction</button>' : ''}
                    <button type="submit" class="btn btn--primary btn--full">${isEditing ? 'Update Transaction' : 'Add Transaction'}</button>
                    ${isEditing ? '<button type="button" class="btn btn--secondary btn--full" id="cancel-edit">Cancel</button>' : ''}
                </form>
            `;
        }

        // Bind events
        _bindSimpleFormEvents();
    }

    function _bindSimpleFormEvents() {
        // Type toggle buttons
        document.querySelectorAll('.form-type-toggle .type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const form = document.getElementById('transaction-form');
                if (form) form.dataset.type = btn.dataset.type;
                _splitMode = false;
                _splitLines = 2;
                renderSimpleForm();
            });
        });

        // Split toggle
        const splitToggle = document.getElementById('toggle-split');
        if (splitToggle) {
            splitToggle.addEventListener('click', () => {
                _splitMode = true;
                _splitLines = 2;
                renderSimpleForm();
            });
        }

        // Cancel split
        const cancelSplit = document.getElementById('cancel-split');
        if (cancelSplit) {
            cancelSplit.addEventListener('click', () => {
                _splitMode = false;
                _splitLines = 2;
                renderSimpleForm();
            });
        }

        // Add split line
        const addSplitLine = document.getElementById('add-split-line');
        if (addSplitLine) {
            addSplitLine.addEventListener('click', () => {
                _splitLines++;
                renderSimpleForm();
            });
        }

        // Remove split line
        document.querySelectorAll('.split-remove-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (_splitLines > 2) {
                    _splitLines--;
                    renderSimpleForm();
                }
            });
        });

        // Real-time split total
        document.querySelectorAll('.split-amount').forEach(input => {
            input.addEventListener('input', _updateSplitTotal);
        });

        // Form submit
        const form = document.getElementById('transaction-form');
        if (form) {
            form.addEventListener('submit', _splitMode ? handleSplitSubmit : handleSimpleSubmit);
        }

        // Cancel edit
        const cancelBtn = document.getElementById('cancel-edit');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                State().setEditingEntryId(null);
                _splitMode = false;
                _splitLines = 2;
                renderSimpleForm();
            });
        }
    }

    function _updateSplitTotal() {
        let total = 0;
        document.querySelectorAll('.split-amount').forEach(input => {
            total += parseFloat(input.value) || 0;
        });
        const el = document.getElementById('split-total');
        if (el) {
            el.textContent = 'Total: ' + Settings().getCurrencySymbol() + total.toFixed(2);
        }
    }

    // =====================================================================
    // Advanced Mode Form
    // =====================================================================

    function renderAdvancedForm() {
        const container = document.getElementById('form-container');
        if (!container) return;

        const accounts = AccountService().getActiveAccounts();
        const today = new Date().toISOString().slice(0, 10);

        let linesHTML = '';
        for (let i = 0; i < _advancedLines; i++) {
            const showRemove = _advancedLines > 2;
            linesHTML += `
                <div class="journal-line" data-line="${i}">
                    <select class="journal-account" data-line="${i}" required>
                        <option value="">Select account...</option>
                        ${accounts.map(a => `<option value="${R().escapeHTML(a.id)}">${R().escapeHTML(String(a.code))} ${R().escapeHTML(a.name)}</option>`).join('')}
                    </select>
                    <input type="number" class="journal-debit" data-line="${i}" step="0.01" min="0" placeholder="Debit" inputmode="decimal">
                    <input type="number" class="journal-credit" data-line="${i}" step="0.01" min="0" placeholder="Credit" inputmode="decimal">
                    ${showRemove ? `<button type="button" class="btn btn--ghost btn--small remove-line-btn" data-line="${i}" title="Remove line"><i class="ri-close-line"></i></button>` : ''}
                </div>
            `;
        }

        container.innerHTML = `
            <form id="transaction-form" data-mode="advanced">
                <h3 class="form-heading">New Journal Entry</h3>
                <div class="form-row">
                    <div class="form-group form-group--half">
                        <label for="date">Date</label>
                        <input type="date" id="date" value="${today}" required>
                    </div>
                    <div class="form-group form-group--half">
                        <label for="entry-type">Type</label>
                        <select id="entry-type" required>
                            <option value="expense">Expense</option>
                            <option value="income">Income</option>
                            <option value="transfer">Transfer</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label for="description">Description</label>
                    <input type="text" id="description" maxlength="500" placeholder="Transaction description" required>
                </div>
                <div class="journal-lines">
                    <div class="journal-header">
                        <span>Account</span><span>Debit</span><span>Credit</span>
                    </div>
                    ${linesHTML}
                </div>
                <button type="button" class="btn btn--secondary btn--small" id="add-line">+ Add Line</button>
                <div class="journal-totals" id="journal-totals">
                    <span>Total</span><span id="total-debits">0.00</span><span id="total-credits">0.00</span>
                </div>
                <div class="journal-balance" id="journal-balance"></div>
                <button type="submit" class="btn btn--primary btn--full" id="save-entry-btn">Save Journal Entry</button>
            </form>
        `;

        _bindAdvancedFormEvents();
    }

    function _bindAdvancedFormEvents() {
        // + Add Line
        const addLineBtn = document.getElementById('add-line');
        if (addLineBtn) {
            addLineBtn.addEventListener('click', () => {
                _advancedLines++;
                renderAdvancedForm();
            });
        }

        // − Remove Line
        document.querySelectorAll('.remove-line-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (_advancedLines > 2) {
                    _advancedLines--;
                    renderAdvancedForm();
                }
            });
        });

        // Real-time balance checking
        document.querySelectorAll('.journal-debit, .journal-credit').forEach(input => {
            input.addEventListener('input', _updateJournalTotals);
        });

        // Form submit
        const form = document.getElementById('transaction-form');
        if (form) {
            form.addEventListener('submit', handleAdvancedSubmit);
        }
    }

    function _updateJournalTotals() {
        let totalDebits = 0;
        let totalCredits = 0;

        document.querySelectorAll('.journal-debit').forEach(input => {
            totalDebits += parseFloat(input.value) || 0;
        });
        document.querySelectorAll('.journal-credit').forEach(input => {
            totalCredits += parseFloat(input.value) || 0;
        });

        const debitsEl = document.getElementById('total-debits');
        const creditsEl = document.getElementById('total-credits');
        const balanceEl = document.getElementById('journal-balance');

        if (debitsEl) debitsEl.textContent = totalDebits.toFixed(2);
        if (creditsEl) creditsEl.textContent = totalCredits.toFixed(2);

        if (balanceEl) {
            const diff = Math.abs(totalDebits - totalCredits);
            if (diff < 0.01 && totalDebits > 0) {
                balanceEl.innerHTML = '<span class="balance--ok">✓ Balanced</span>';
            } else {
                balanceEl.innerHTML = `<span class="balance--off">Difference: ${diff.toFixed(2)}</span>`;
            }
        }
    }

    // =====================================================================
    // Form Submission
    // =====================================================================

    async function handleSimpleSubmit(e) {
        e.preventDefault();

        const form = document.getElementById('transaction-form');
        const type = form.dataset.type;
        const amount = parseFloat(document.getElementById('amount').value);
        const date = document.getElementById('date').value;
        const notes = (document.getElementById('notes') || {}).value || '';
        const editingId = State().getEditingEntryId();

        let result;

        if (type === 'transfer') {
            const fromId = document.getElementById('from-account').value;
            const toId = document.getElementById('to-account').value;

            if (editingId) {
                result = await TransactionService().editTransaction(editingId, {
                    type: 'transfer', amount, fromAccountId: fromId,
                    toAccountId: toId, date, notes,
                }, 'simple');
            } else {
                result = await TransactionService().createTransfer({ amount, fromAccountId: fromId, toAccountId: toId, date, notes });
            }
        } else {
            const categoryName = document.getElementById('category').value;
            const categoryCode = Types().CategoryAccountMap[categoryName];
            const categoryAccount = AccountService().getAccountByCode(categoryCode);
            const assetAccount = AccountService().getDefaultAssetAccount();

            if (!categoryAccount || !assetAccount) {
                R().showToast('Account mapping error', 'error');
                return;
            }

            if (editingId) {
                result = await TransactionService().editTransaction(editingId, {
                    type, amount, categoryAccountId: categoryAccount.id,
                    assetAccountId: assetAccount.id, date, notes,
                }, 'simple');
            } else {
                result = await TransactionService().createSimpleTransaction({
                    type, amount, categoryAccountId: categoryAccount.id,
                    assetAccountId: assetAccount.id, date, notes,
                });
            }
        }

        if (result.success) {
            R().showToast(editingId ? 'Transaction updated!' : 'Transaction added!', 'success');
            State().setEditingEntryId(null);
            resetForm();
        } else {
            R().showToast(result.errors[0] || 'Error saving transaction', 'error');
        }
    }

    async function handleSplitSubmit(e) {
        e.preventDefault();

        const form = document.getElementById('transaction-form');
        const type = form.dataset.type;
        const date = document.getElementById('date').value;
        const notes = (document.getElementById('notes') || {}).value || '';
        const assetAccount = AccountService().getDefaultAssetAccount();

        if (!assetAccount) {
            R().showToast('Default asset account not found', 'error');
            return;
        }

        // Collect split lines
        const splitLines = [];
        let hasError = false;
        document.querySelectorAll('.split-line').forEach(lineEl => {
            const categoryName = lineEl.querySelector('.split-category').value;
            const amount = parseFloat(lineEl.querySelector('.split-amount').value);
            const categoryCode = Types().CategoryAccountMap[categoryName];
            const categoryAccount = AccountService().getAccountByCode(categoryCode);

            if (!categoryAccount) {
                hasError = true;
                return;
            }
            if (!amount || amount <= 0) {
                hasError = true;
                return;
            }
            splitLines.push({ accountId: categoryAccount.id, amount });
        });

        if (hasError || splitLines.length < 2) {
            R().showToast('Each split line needs a category and amount (min. 2 lines)', 'error');
            return;
        }

        const result = await TransactionService().createSplitTransaction({
            type, splitLines, assetAccountId: assetAccount.id, date, notes,
        });

        if (result.success) {
            R().showToast('Split transaction added!', 'success');
            _splitMode = false;
            _splitLines = 2;
            resetForm();
        } else {
            R().showToast(result.errors[0] || 'Error saving split transaction', 'error');
        }
    }

    async function handleAdvancedSubmit(e) {
        e.preventDefault();

        const type = document.getElementById('entry-type').value;
        const date = document.getElementById('date').value;
        const description = document.getElementById('description').value;

        const lines = [];
        document.querySelectorAll('.journal-line').forEach(lineEl => {
            const accountId = lineEl.querySelector('.journal-account').value;
            const debit = parseFloat(lineEl.querySelector('.journal-debit').value) || 0;
            const credit = parseFloat(lineEl.querySelector('.journal-credit').value) || 0;
            if (accountId && (debit > 0 || credit > 0)) {
                lines.push({ accountId, debit, credit });
            }
        });

        const result = await TransactionService().createAdvancedTransaction({
            type, date, description, lines,
        });

        if (result.success) {
            R().showToast('Journal entry saved!', 'success');
            _advancedLines = 2;
            renderAdvancedForm();
        } else {
            R().showToast(result.errors[0] || 'Error saving entry', 'error');
        }
    }

    // =====================================================================
    // Reset & Edit
    // =====================================================================

    function resetForm() {
        _splitMode = false;
        _splitLines = 2;
        const form = document.getElementById('transaction-form');
        if (form) {
            form.dataset.type = 'expense';
            renderSimpleForm();
        }
    }

    /**
     * Populate the form for editing an existing entry.
     * @param {Object} entry
     */
    function populateFormForEdit(entry) {
        State().setEditingEntryId(entry.id);
        const info = TransactionService().getSimpleDisplayInfo(entry);
        if (!info) return;

        // Switch to Add tab
        if (global.FCL.UI.Navigation) global.FCL.UI.Navigation.switchTab('add');

        const form = document.getElementById('transaction-form');
        if (form) form.dataset.type = info.type;

        // Re-render then fill values
        renderSimpleForm();

        setTimeout(() => {
            const amountEl = document.getElementById('amount');
            const dateEl = document.getElementById('date');
            const notesEl = document.getElementById('notes');

            if (amountEl) amountEl.value = info.amount;
            if (dateEl) dateEl.value = entry.date;
            if (notesEl) notesEl.value = entry.description;

            if (info.type === 'transfer') {
                const fromEl = document.getElementById('from-account');
                const toEl = document.getElementById('to-account');
                if (fromEl) fromEl.value = info.fromAccountId;
                if (toEl) toEl.value = info.toAccountId;
            } else {
                const catEl = document.getElementById('category');
                if (catEl) {
                    // Reverse-map accountId to category name
                    const acc = AccountService().getAccountById(info.categoryAccountId);
                    if (acc) {
                        const map = Types().CategoryAccountMap;
                        for (const [name, code] of Object.entries(map)) {
                            if (code === acc.code) { catEl.value = name; break; }
                        }
                    }
                }
            }
        }, 50);
    }

    // =====================================================================
    // Export
    // =====================================================================
    global.FCL = global.FCL || {};
    global.FCL.UI = global.FCL.UI || {};
    global.FCL.UI.Forms = {
        render,
        renderSimpleForm,
        renderAdvancedForm,
        resetForm,
        populateFormForEdit,
    };

})(window);
