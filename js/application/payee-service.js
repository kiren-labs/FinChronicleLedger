/**
 * FinChronicleLedger — Application: Payee Service
 * Payee CRUD, autocomplete, spending-by-vendor analysis.
 */
(function (global) {
    'use strict';

    var DB = function () { return global.FCL.DB; };
    var State = function () { return global.FCL.State; };
    var Validators = function () { return global.FCL.Validators; };
    var Ledger = function () { return global.FCL.Ledger; };

    // =====================================================================
    // Initialization
    // =====================================================================

    async function loadAll() {
        var payees = await DB().getAllPayees();
        State().setPayees(payees);
    }

    // =====================================================================
    // Queries
    // =====================================================================

    function getAllPayees() {
        return State().getPayees();
    }

    function getPayeeById(id) {
        return State().getPayees().find(function (p) { return p.id === id; });
    }

    function getPayeeByName(name) {
        var lower = name.toLowerCase().trim();
        return State().getPayees().find(function (p) {
            return p.name.toLowerCase() === lower;
        });
    }

    /**
     * Autocomplete — returns payees whose names start with or contain the query.
     * @param {string} query
     * @param {number} [limit=5]
     * @returns {Array}
     */
    function autocomplete(query, limit) {
        if (!query || query.length < 1) return [];
        limit = limit || 5;
        var q = query.toLowerCase().trim();
        var payees = State().getPayees();

        // Prioritize starts-with, then contains
        var startsWith = [];
        var contains = [];
        for (var i = 0; i < payees.length; i++) {
            var name = payees[i].name.toLowerCase();
            if (name.indexOf(q) === 0) {
                startsWith.push(payees[i]);
            } else if (name.indexOf(q) !== -1) {
                contains.push(payees[i]);
            }
        }
        return startsWith.concat(contains).slice(0, limit);
    }

    /**
     * Get spending analysis grouped by payee.
     * @param {string} [month] Optional month filter (YYYY-MM)
     * @returns {Array<{payee: Object, total: number, count: number}>}
     */
    function getPayeeSpending(month) {
        var entries = State().getEntries();
        if (month) {
            entries = entries.filter(function (e) { return e.date.startsWith(month); });
        }

        var payeeMap = {};
        for (var i = 0; i < entries.length; i++) {
            var e = entries[i];
            if (!e.payeeId) continue;
            if (!payeeMap[e.payeeId]) {
                payeeMap[e.payeeId] = { total: 0, count: 0 };
            }
            payeeMap[e.payeeId].total += Ledger().getEntryTotal(e);
            payeeMap[e.payeeId].count++;
        }

        var results = [];
        var keys = Object.keys(payeeMap);
        for (var k = 0; k < keys.length; k++) {
            var payee = getPayeeById(keys[k]);
            if (payee) {
                results.push({
                    payee: payee,
                    total: payeeMap[keys[k]].total,
                    count: payeeMap[keys[k]].count,
                });
            }
        }
        return results.sort(function (a, b) { return b.total - a.total; });
    }

    /**
     * Get all transactions for a specific payee.
     */
    function getTransactionsForPayee(payeeId) {
        return State().getEntries().filter(function (e) { return e.payeeId === payeeId; });
    }

    // =====================================================================
    // Mutations
    // =====================================================================

    async function createPayee(name, defaultCategoryAccountId) {
        var cleanName = (name || '').trim();
        if (cleanName.length < 1 || cleanName.length > 100) {
            return { success: false, errors: ['Payee name must be 1–100 characters'] };
        }
        if (getPayeeByName(cleanName)) {
            return { success: false, errors: ['A payee with this name already exists'] };
        }

        var payee = {
            id: Validators().generateId(),
            name: Validators().sanitizeHTML(cleanName),
            defaultCategoryAccountId: defaultCategoryAccountId || null,
            notes: '',
            createdAt: new Date().toISOString(),
        };

        await DB().savePayee(payee);
        State().addPayee(payee);
        return { success: true, payee: payee };
    }

    async function updatePayee(id, updates) {
        var payee = getPayeeById(id);
        if (!payee) return { success: false, errors: ['Payee not found'] };

        var updated = Object.assign({}, payee);
        if (updates.name != null) {
            var cleanName = updates.name.trim();
            if (cleanName.length < 1 || cleanName.length > 100) {
                return { success: false, errors: ['Payee name must be 1–100 characters'] };
            }
            var existing = getPayeeByName(cleanName);
            if (existing && existing.id !== id) {
                return { success: false, errors: ['A payee with this name already exists'] };
            }
            updated.name = Validators().sanitizeHTML(cleanName);
        }
        if (updates.defaultCategoryAccountId !== undefined) {
            updated.defaultCategoryAccountId = updates.defaultCategoryAccountId;
        }
        if (updates.notes !== undefined) {
            updated.notes = Validators().sanitizeHTML(String(updates.notes || ''));
        }

        await DB().savePayee(updated);
        State().updatePayee(updated);
        return { success: true, payee: updated };
    }

    async function deletePayee(id) {
        var payee = getPayeeById(id);
        if (!payee) return { success: false, errors: ['Payee not found'] };

        // Remove payeeId from entries referencing this payee
        var entries = State().getEntries();
        for (var i = 0; i < entries.length; i++) {
            if (entries[i].payeeId === id) {
                entries[i].payeeId = null;
                await DB().saveJournalEntry(entries[i]);
                State().updateEntry(entries[i]);
            }
        }

        await DB().deletePayee(id);
        State().removePayee(id);
        return { success: true };
    }

    /**
     * Find-or-create a payee by name (used in form autocomplete).
     * If exists, returns existing. If not, creates new.
     */
    async function findOrCreate(name, defaultCategoryAccountId) {
        var existing = getPayeeByName(name);
        if (existing) return { success: true, payee: existing };
        return createPayee(name, defaultCategoryAccountId);
    }

    // =====================================================================
    // Export
    // =====================================================================
    global.FCL = global.FCL || {};
    global.FCL.PayeeService = {
        loadAll: loadAll,
        getAllPayees: getAllPayees,
        getPayeeById: getPayeeById,
        getPayeeByName: getPayeeByName,
        autocomplete: autocomplete,
        getPayeeSpending: getPayeeSpending,
        getTransactionsForPayee: getTransactionsForPayee,
        createPayee: createPayee,
        updatePayee: updatePayee,
        deletePayee: deletePayee,
        findOrCreate: findOrCreate,
    };

})(window);
