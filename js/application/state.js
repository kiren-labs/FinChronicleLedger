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
        getAccounts, setAccounts, updateAccount,
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
        // Observer
        subscribe,
    };

})(window);
