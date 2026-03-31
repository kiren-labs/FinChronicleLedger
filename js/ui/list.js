/**
 * FinChronicleLedger — UI: List
 * Transaction list with filtering, pagination, edit/delete actions.
 */
(function (global) {
    'use strict';

    const State = () => global.FCL.State;
    const Types = () => global.FCL.Types;
    const AccountService = () => global.FCL.AccountService;
    const TransactionService = () => global.FCL.TransactionService;
    const ReportService = () => global.FCL.ReportService;
    const SearchService = () => global.FCL.SearchService;
    const R = () => global.FCL.UI.Renderer;

    const ITEMS_PER_PAGE = 20;

    // =====================================================================
    // Render
    // =====================================================================

    function render(mode) {
        renderFilters();
        renderTransactionList(mode);
    }

    // =====================================================================
    // Filters
    // =====================================================================

    function renderFilters() {
        const container = document.getElementById('filters-container');
        if (!container) return;

        const months = ReportService().getAvailableMonths();
        const currentMonth = State().getCurrentMonth();
        const searchQuery = State().getSearchQuery();
        const searching = SearchService().isSearchActive();

        let monthButtons = months.map(m => {
            const active = m === currentMonth ? 'filter-btn--active' : '';
            return `<button class="filter-btn ${active}" data-month="${m}">${R().formatMonth(m)}</button>`;
        }).join('');

        if (months.length === 0) {
            monthButtons = '<span class="text-muted">No transactions yet</span>';
        }

        container.innerHTML = `
            <div class="search-bar">
                <div class="search-input-wrapper">
                    <i class="ri-search-line search-icon"></i>
                    <input type="search" id="searchInput" class="search-input" placeholder="Search transactions..." value="${R().escapeHTML(searchQuery)}" autocomplete="off" aria-label="Search transactions">
                    ${searching ? '<button class="search-clear-btn" id="searchClear" aria-label="Clear search"><i class="ri-close-line"></i></button>' : ''}
                </div>
                ${searching ? '<div class="search-status">Searching across all months</div>' : ''}
            </div>
            <div class="filters">
                <div class="filter-months"${searching ? ' style="opacity:0.5;pointer-events:none"' : ''}>${monthButtons}</div>
            </div>
        `;

        // Bind search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            let debounceTimer;
            searchInput.addEventListener('input', () => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    State().setSearchQuery(searchInput.value);
                }, 250);
            });
            // Preserve focus after re-render
            if (document.activeElement && document.activeElement.id === 'searchInput') {
                searchInput.focus();
            }
        }

        // Bind clear button
        const clearBtn = document.getElementById('searchClear');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                State().setSearchQuery('');
            });
        }

        // Bind month filter clicks (disabled when searching)
        if (!searching) {
            container.querySelectorAll('.filter-btn[data-month]').forEach(btn => {
                btn.addEventListener('click', () => {
                    State().setCurrentMonth(btn.dataset.month);
                    State().setCurrentPage(1);
                });
            });
        }
    }

    // =====================================================================
    // Transaction List
    // =====================================================================

    function renderTransactionList(mode) {
        const container = document.getElementById('list-container');
        if (!container) return;

        const month = State().getCurrentMonth();
        const page = State().getCurrentPage();
        const searchQuery = State().getSearchQuery();
        const searching = SearchService().isSearchActive();

        // When searching, search across ALL entries (all months)
        // When not searching, filter by current month
        let entries = State().getEntries();
        if (!searching) {
            entries = entries.filter(e => e.date.startsWith(month));
        }
        entries = entries.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));

        // Category filter (only when not searching)
        if (!searching) {
            const catFilter = State().getCurrentCategory();
            if (catFilter) {
                entries = entries.filter(e => {
                    for (const line of e.lines) {
                        const acc = AccountService().getAccountById(line.accountId);
                        if (acc && acc.name === catFilter) return true;
                    }
                    return false;
                });
            }
        }

        // Apply search filter
        if (searching) {
            entries = SearchService().search(searchQuery, entries);
        }

        // Pagination
        const totalPages = Math.max(1, Math.ceil(entries.length / ITEMS_PER_PAGE));
        const startIdx = (page - 1) * ITEMS_PER_PAGE;
        const pageEntries = entries.slice(startIdx, startIdx + ITEMS_PER_PAGE);

        if (pageEntries.length === 0) {
            if (searching) {
                container.innerHTML = '<div class="empty-state"><p>No transactions match "<strong>' + R().escapeHTML(searchQuery) + '</strong>"</p></div>';
            } else {
                container.innerHTML = '<div class="empty-state"><p>No transactions this month.</p></div>';
            }
            return;
        }

        const accounts = new Map(State().getAccounts().map(a => [a.id, a]));

        let html = '';
        for (const entry of pageEntries) {
            if (mode === 'advanced') {
                html += _renderAdvancedListItem(entry, accounts);
            } else {
                html += _renderSimpleListItem(entry, accounts);
            }
        }

        // Pagination controls
        let paginationHTML = '';
        if (totalPages > 1) {
            paginationHTML = `
                <div class="pagination">
                    <button class="btn btn--small" id="prev-page" ${page <= 1 ? 'disabled' : ''}>← Prev</button>
                    <span class="pagination-info">${page} / ${totalPages}</span>
                    <button class="btn btn--small" id="next-page" ${page >= totalPages ? 'disabled' : ''}>Next →</button>
                </div>
            `;
        }

        container.innerHTML = `
            <div class="transaction-list">${html}</div>
            ${paginationHTML}
        `;

        _bindListEvents();
    }

    // =====================================================================
    // List Items
    // =====================================================================

    function _renderSimpleListItem(entry, accounts) {
        const info = TransactionService().getSimpleDisplayInfo(entry);
        let categoryName = '';
        let amountClass = '';
        let prefix = '';

        if (info) {
            if (info.type === 'transfer') {
                const from = accounts.get(info.fromAccountId);
                const to = accounts.get(info.toAccountId);
                categoryName = `${R().escapeHTML(from ? from.name : '?')} → ${R().escapeHTML(to ? to.name : '?')}`;
                amountClass = 'amount--transfer';
            } else {
                const acc = accounts.get(info.categoryAccountId);
                categoryName = R().escapeHTML(acc ? acc.name : 'Unknown');
                amountClass = info.type === 'income' ? 'amount--income' : 'amount--expense';
                prefix = info.type === 'income' ? '+' : '-';
            }
        }

        return `
            <div class="transaction-item" data-id="${R().escapeHTML(entry.id)}">
                <div class="transaction-header">
                    <span class="transaction-date">${R().formatDate(entry.date)}</span>
                    <span class="transaction-amount ${amountClass}">${prefix}${R().formatCurrency(info ? info.amount : 0)}</span>
                </div>
                <div class="transaction-body">
                    <span class="transaction-category">${categoryName}</span>
                    ${entry.description ? `<span class="transaction-notes">${R().escapeHTML(entry.description)}</span>` : ''}
                </div>
                <div class="transaction-actions">
                    <button class="btn btn--small btn--ghost action-edit" data-id="${R().escapeHTML(entry.id)}"><i class="ri-edit-line"></i> Edit</button>
                    <button class="btn btn--small btn--ghost btn--danger action-delete" data-id="${R().escapeHTML(entry.id)}"><i class="ri-delete-bin-line"></i> Delete</button>
                </div>
            </div>
        `;
    }

    function _renderAdvancedListItem(entry, accounts) {
        const total = TransactionService().getEntryTotal(entry);
        let linesHTML = entry.lines.map(line => {
            const acc = accounts.get(line.accountId);
            const accName = acc ? `${acc.code} ${R().escapeHTML(acc.name)}` : 'Unknown';
            if (line.debit > 0) {
                return `<div class="journal-line-display"><span class="line-dr">DR</span> <span>${accName}</span> <span class="amount--debit">${R().formatCurrency(line.debit)}</span></div>`;
            } else {
                return `<div class="journal-line-display"><span class="line-cr">CR</span> <span>${accName}</span> <span class="amount--credit">${R().formatCurrency(line.credit)}</span></div>`;
            }
        }).join('');

        return `
            <div class="transaction-item transaction-item--advanced" data-id="${R().escapeHTML(entry.id)}">
                <div class="transaction-header">
                    <span class="transaction-date">${R().formatDate(entry.date)} • ${R().escapeHTML(entry.type)}</span>
                </div>
                <div class="transaction-description">${R().escapeHTML(entry.description || '')}</div>
                <div class="journal-lines-display">${linesHTML}</div>
                <div class="transaction-actions">
                    <button class="btn btn--small btn--ghost action-edit" data-id="${R().escapeHTML(entry.id)}"><i class="ri-edit-line"></i> Edit</button>
                    <button class="btn btn--small btn--ghost btn--danger action-delete" data-id="${R().escapeHTML(entry.id)}"><i class="ri-delete-bin-line"></i> Delete</button>
                </div>
            </div>
        `;
    }

    // =====================================================================
    // Event Binding
    // =====================================================================

    function _bindListEvents() {
        // Edit buttons
        document.querySelectorAll('.action-edit').forEach(btn => {
            btn.addEventListener('click', () => {
                const entry = State().getEntryById(btn.dataset.id);
                if (entry && global.FCL.UI.Forms) {
                    global.FCL.UI.Forms.populateFormForEdit(entry);
                }
            });
        });

        // Delete buttons
        document.querySelectorAll('.action-delete').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (global.FCL.UI.Modals) {
                    global.FCL.UI.Modals.showDeleteConfirm(btn.dataset.id);
                } else {
                    // Fallback
                    if (confirm('Delete this transaction?')) {
                        await TransactionService().deleteTransaction(btn.dataset.id);
                        R().showToast('Transaction deleted', 'success');
                    }
                }
            });
        });

        // Pagination
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        if (prevBtn) prevBtn.addEventListener('click', () => State().setCurrentPage(State().getCurrentPage() - 1));
        if (nextBtn) nextBtn.addEventListener('click', () => State().setCurrentPage(State().getCurrentPage() + 1));
    }

    // =====================================================================
    // Export
    // =====================================================================
    global.FCL = global.FCL || {};
    global.FCL.UI = global.FCL.UI || {};
    global.FCL.UI.List = {
        render,
        renderFilters,
        renderTransactionList,
    };

})(window);
