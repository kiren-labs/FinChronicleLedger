/**
 * FinChronicleLedger — Application: State
 * Central in-memory store. Single source of truth for accounts, entries, settings.
 * All reads go through State; mutations update State then persist via services.
 */
(function (global) {
    'use strict';

    /** @type {Array} In-memory accounts */
    let _accounts = [];

    /** @type {Array} In-memory journal entries */
    let _entries = [];

    /** @type {Object} In-memory settings (key-value) */
    let _settings = {};

    /** @type {Array} In-memory tags */
    let _tags = [];

    /** @type {Array} In-memory payees */
    let _payees = [];

    /** @type {Array} In-memory financial goals */
    let _goals = [];

    /** @type {Array} In-memory goal contributions */
    let _contributions = [];

    /** @type {Array} In-memory reconciliations */
    let _reconciliations = [];

    /** @type {Set<Function>} UI listeners for re-render on data change */
    const _listeners = new Set();

    // =====================================================================
    // Accounts
    // =====================================================================

    function getAccounts() { return _accounts; }

    function setAccounts(accounts) {
        _accounts = accounts;
        _notify();
    }

    function updateAccount(updated) {
        const idx = _accounts.findIndex(a => a.id === updated.id);
        if (idx !== -1) _accounts[idx] = updated;
        _notify();
    }

    function addAccount(account) {
        _accounts.push(account);
        _notify();
    }

    function removeAccount(id) {
        _accounts = _accounts.filter(a => a.id !== id);
        _notify();
    }

    // =====================================================================
    // Tags
    // =====================================================================

    function getTags() { return _tags; }

    function setTags(tags) {
        _tags = tags;
    }

    function addTag(tag) {
        _tags.push(tag);
    }

    function updateTag(updated) {
        const idx = _tags.findIndex(t => t.id === updated.id);
        if (idx !== -1) _tags[idx] = updated;
    }

    function removeTag(id) {
        _tags = _tags.filter(t => t.id !== id);
    }

    // =====================================================================
    // Payees
    // =====================================================================

    function getPayees() { return _payees; }
    function setPayees(p) { _payees = p; }
    function addPayee(p) { _payees.push(p); }
    function updatePayee(updated) {
        var idx = _payees.findIndex(function (p) { return p.id === updated.id; });
        if (idx !== -1) _payees[idx] = updated;
    }
    function removePayee(id) {
        _payees = _payees.filter(function (p) { return p.id !== id; });
    }

    // =====================================================================
    // Financial Goals
    // =====================================================================

    function getGoals() { return _goals; }
    function setGoals(g) { _goals = g; _notify(); }
    function addGoal(g) { _goals.push(g); _notify(); }
    function updateGoal(updated) {
        var idx = _goals.findIndex(function (g) { return g.id === updated.id; });
        if (idx !== -1) _goals[idx] = updated;
        _notify();
    }
    function removeGoal(id) {
        _goals = _goals.filter(function (g) { return g.id !== id; });
        _notify();
    }

    // =====================================================================
    // Goal Contributions
    // =====================================================================

    function getContributions() { return _contributions; }
    function setContributions(c) { _contributions = c; }
    function addContribution(c) { _contributions.push(c); _notify(); }
    function removeContribution(id) {
        _contributions = _contributions.filter(function (c) { return c.id !== id; });
        _notify();
    }

    // =====================================================================
    // Reconciliations
    // =====================================================================

    function getReconciliations() { return _reconciliations; }
    function setReconciliations(r) { _reconciliations = r; }
    function addReconciliation(r) { _reconciliations.push(r); _notify(); }
    function updateReconciliation(updated) {
        var idx = _reconciliations.findIndex(function (r) { return r.id === updated.id; });
        if (idx !== -1) _reconciliations[idx] = updated;
        _notify();
    }
    function removeReconciliation(id) {
        _reconciliations = _reconciliations.filter(function (r) { return r.id !== id; });
        _notify();
    }

    // =====================================================================
    // Journal Entries
    // =====================================================================

    function getEntries() { return _entries; }

    function setEntries(entries) {
        _entries = entries;
        _notify();
    }

    function addEntry(entry) {
        _entries.push(entry);
        _notify();
    }

    function updateEntry(entry) {
        const idx = _entries.findIndex(e => e.id === entry.id);
        if (idx !== -1) _entries[idx] = entry;
        _notify();
    }

    function removeEntry(id) {
        _entries = _entries.filter(e => e.id !== id);
        _notify();
    }

    function getEntryById(id) {
        return _entries.find(e => e.id === id);
    }

    // =====================================================================
    // Settings
    // =====================================================================

    function getSetting(key) {
        return _settings[key];
    }

    function setSetting(key, value) {
        _settings[key] = value;
        // Settings changes don't always need UI re-render;
        // specific callers trigger re-render explicitly.
    }

    function getAllSettings() {
        return { ..._settings };
    }

    // =====================================================================
    // UI Filters (transient, not persisted)
    // =====================================================================

    let _currentMonth = null;
    let _currentCategory = null;
    let _currentPage = 1;
    let _editingEntryId = null;
    let _searchQuery = '';
    let _filterTagId = null;

    function getCurrentMonth() {
        return _currentMonth || new Date().toISOString().slice(0, 7);
    }
    function setCurrentMonth(m) { _currentMonth = m; _notify(); }

    function getCurrentCategory() { return _currentCategory; }
    function setCurrentCategory(c) { _currentCategory = c; _notify(); }

    function getCurrentPage() { return _currentPage; }
    function setCurrentPage(p) { _currentPage = p; _notify(); }

    function getEditingEntryId() { return _editingEntryId; }
    function setEditingEntryId(id) { _editingEntryId = id; }

    function getSearchQuery() { return _searchQuery; }
    function setSearchQuery(q) {
        _searchQuery = q;
        _currentPage = 1;
        _notify();
    }

    function getFilterTagId() { return _filterTagId; }
    function setFilterTagId(id) { _filterTagId = id; _currentPage = 1; _notify(); }

    // =====================================================================
    // Change Notification (Observer pattern)
    // =====================================================================

    function subscribe(fn) {
        _listeners.add(fn);
        return () => _listeners.delete(fn);
    }

    function _notify() {
        for (const fn of _listeners) {
            try { fn(); } catch (e) { console.error('State listener error:', e); }
        }
    }

    // =====================================================================
    // Export
    // =====================================================================
    global.FCL = global.FCL || {};
    global.FCL.State = {
        // Accounts
        getAccounts, setAccounts, updateAccount, addAccount, removeAccount,
        // Tags
        getTags, setTags, addTag, updateTag, removeTag,
        // Payees
        getPayees, setPayees, addPayee, updatePayee, removePayee,
        // Goals
        getGoals, setGoals, addGoal, updateGoal, removeGoal,
        // Contributions
        getContributions, setContributions, addContribution, removeContribution,
        // Reconciliations
        getReconciliations, setReconciliations, addReconciliation, updateReconciliation, removeReconciliation,
        // Entries
        getEntries, setEntries, addEntry, updateEntry, removeEntry, getEntryById,
        // Settings
        getSetting, setSetting, getAllSettings,
        // Filters
        getCurrentMonth, setCurrentMonth,
        getCurrentCategory, setCurrentCategory,
        getCurrentPage, setCurrentPage,
        getEditingEntryId, setEditingEntryId,
        getSearchQuery, setSearchQuery,
        getFilterTagId, setFilterTagId,
        // Observer
        subscribe,
    };

})(window);
