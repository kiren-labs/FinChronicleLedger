/**
 * FinChronicleLedger — Application: Search Service
 * Full-text search across transaction descriptions, line memos, and amounts.
 * Operates over in-memory state — no new store required.
 */
(function (global) {
    'use strict';

    const State = () => global.FCL.State;
    const AccountService = () => global.FCL.AccountService;

    /**
     * Search entries by query string.
     * Matches against: description, line memos, account names, and exact amounts.
     * @param {string} query - User search input
     * @param {Array} entries - Entries to search (pre-filtered by month/category or all)
     * @returns {Array} Filtered entries matching the query
     */
    function search(query, entries) {
        if (!query || !query.trim()) return entries;

        const q = query.trim().toLowerCase();

        // Check if query is a numeric amount (exact match)
        const numericQuery = parseFloat(q.replace(/,/g, ''));
        const isAmountSearch = !isNaN(numericQuery) && numericQuery > 0;

        return entries.filter(function (entry) {
            // 1. Match description
            if (entry.description && entry.description.toLowerCase().indexOf(q) !== -1) {
                return true;
            }

            // 2. Match line memos
            if (entry.lines) {
                for (var i = 0; i < entry.lines.length; i++) {
                    if (entry.lines[i].memo && entry.lines[i].memo.toLowerCase().indexOf(q) !== -1) {
                        return true;
                    }
                }
            }

            // 3. Match account names on lines
            if (entry.lines) {
                for (var j = 0; j < entry.lines.length; j++) {
                    var acc = AccountService().getAccountById(entry.lines[j].accountId);
                    if (acc && acc.name.toLowerCase().indexOf(q) !== -1) {
                        return true;
                    }
                }
            }

            // 4. Match exact amount (debit or credit on any line)
            if (isAmountSearch && entry.lines) {
                for (var k = 0; k < entry.lines.length; k++) {
                    if (entry.lines[k].debit === numericQuery || entry.lines[k].credit === numericQuery) {
                        return true;
                    }
                }
            }

            // 5. Match entry type
            if (entry.type && entry.type.toLowerCase().indexOf(q) !== -1) {
                return true;
            }

            return false;
        });
    }

    /**
     * Check if a search query is active.
     * @returns {boolean}
     */
    function isSearchActive() {
        var q = State().getSearchQuery();
        return !!(q && q.trim());
    }

    // =====================================================================
    // Export
    // =====================================================================
    global.FCL = global.FCL || {};
    global.FCL.SearchService = {
        search: search,
        isSearchActive: isSearchActive,
    };

})(window);
