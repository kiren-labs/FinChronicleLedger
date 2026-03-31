/**
 * FinChronicleLedger — Infrastructure: Database
 * IndexedDB initialization, CRUD operations, migrations, bulk ops.
 * All DB access goes through this module.
 */
(function (global) {
    'use strict';

    const DB_NAME = 'FinChronicleLedgerDB';
    const DB_VERSION = 7;

    let _db = null;

    // =====================================================================
    // Initialization
    // =====================================================================

    /**
     * Open (or create) the IndexedDB database.
     * @returns {Promise<IDBDatabase>}
     */
    function initDB() {
        return new Promise((resolve, reject) => {
            if (_db) { resolve(_db); return; }

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                const oldVersion = event.oldVersion;

                // === v1 baseline: accounts, journal_entries, app_settings ===
                if (oldVersion < 1) {
                    // Accounts store
                    if (!db.objectStoreNames.contains('accounts')) {
                        const accountStore = db.createObjectStore('accounts', { keyPath: 'id' });
                        accountStore.createIndex('type', 'type', { unique: false });
                        accountStore.createIndex('code', 'code', { unique: true });
                        accountStore.createIndex('isActive', 'isActive', { unique: false });
                    }

                    // Journal entries store
                    if (!db.objectStoreNames.contains('journal_entries')) {
                        const entryStore = db.createObjectStore('journal_entries', { keyPath: 'id' });
                        entryStore.createIndex('date', 'date', { unique: false });
                        entryStore.createIndex('type', 'type', { unique: false });
                        entryStore.createIndex('date_type', ['date', 'type'], { unique: false });
                        entryStore.createIndex('source', 'source', { unique: false });
                    }

                    // App settings store (key-value)
                    if (!db.objectStoreNames.contains('app_settings')) {
                        db.createObjectStore('app_settings', { keyPath: 'key' });
                    }
                }

                // === v2: recurring_templates, recurring_history ===
                if (oldVersion < 2) {
                    if (!db.objectStoreNames.contains('recurring_templates')) {
                        const templateStore = db.createObjectStore('recurring_templates', { keyPath: 'id' });
                        templateStore.createIndex('isActive', 'isActive', { unique: false });
                        templateStore.createIndex('nextDueDate', 'nextDueDate', { unique: false });
                    }

                    if (!db.objectStoreNames.contains('recurring_history')) {
                        const historyStore = db.createObjectStore('recurring_history', { keyPath: 'id' });
                        historyStore.createIndex('templateId', 'templateId', { unique: false });
                        historyStore.createIndex('dueDate', 'dueDate', { unique: false });
                    }
                }

                // === v3: budgets ===
                if (oldVersion < 3) {
                    if (!db.objectStoreNames.contains('budgets')) {
                        const budgetStore = db.createObjectStore('budgets', { keyPath: 'id' });
                        budgetStore.createIndex('month', 'month', { unique: true });
                    }
                }

                // === v4: tags ===
                if (oldVersion < 4) {
                    if (!db.objectStoreNames.contains('tags')) {
                        const tagStore = db.createObjectStore('tags', { keyPath: 'id' });
                        tagStore.createIndex('name', 'name', { unique: true });
                    }
                }

                // === v5: payees ===
                if (oldVersion < 5) {
                    if (!db.objectStoreNames.contains('payees')) {
                        var payeeStore = db.createObjectStore('payees', { keyPath: 'id' });
                        payeeStore.createIndex('name', 'name', { unique: true });
                    }
                }

                // === v6: financial_goals + goal_contributions ===
                if (oldVersion < 6) {
                    if (!db.objectStoreNames.contains('financial_goals')) {
                        var goalStore = db.createObjectStore('financial_goals', { keyPath: 'id' });
                        goalStore.createIndex('status', 'status', { unique: false });
                    }
                    if (!db.objectStoreNames.contains('goal_contributions')) {
                        var contribStore = db.createObjectStore('goal_contributions', { keyPath: 'id' });
                        contribStore.createIndex('goalId', 'goalId', { unique: false });
                        contribStore.createIndex('date', 'date', { unique: false });
                    }
                }

                // === v7: reconciliations ===
                if (oldVersion < 7) {
                    if (!db.objectStoreNames.contains('reconciliations')) {
                        var reconStore = db.createObjectStore('reconciliations', { keyPath: 'id' });
                        reconStore.createIndex('accountId', 'accountId', { unique: false });
                        reconStore.createIndex('month', 'month', { unique: false });
                        reconStore.createIndex('status', 'status', { unique: false });
                    }
                }
            };

            request.onsuccess = (event) => {
                _db = event.target.result;
                resolve(_db);
            };

            request.onerror = (event) => {
                reject(new Error('Failed to open IndexedDB: ' + event.target.error));
            };
        });
    }

    /**
     * Get a reference to the open database. Must call initDB() first.
     * @returns {IDBDatabase}
     */
    function getDB() {
        if (!_db) throw new Error('Database not initialized. Call initDB() first.');
        return _db;
    }

    // =====================================================================
    // Generic Helpers
    // =====================================================================

    function _tx(storeNames, mode) {
        return getDB().transaction(storeNames, mode);
    }

    function _promisify(request) {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    function _promisifyTx(tx) {
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
            tx.onabort = () => reject(tx.error || new Error('Transaction aborted'));
        });
    }

    // =====================================================================
    // Accounts CRUD
    // =====================================================================

    /**
     * Save a single account.
     * @param {Object} account
     * @returns {Promise<void>}
     */
    async function saveAccount(account) {
        const tx = _tx('accounts', 'readwrite');
        tx.objectStore('accounts').put(account);
        return _promisifyTx(tx);
    }

    /**
     * Save multiple accounts in a single transaction.
     * @param {Array<Object>} accounts
     * @returns {Promise<void>}
     */
    async function bulkSaveAccounts(accounts) {
        const tx = _tx('accounts', 'readwrite');
        const store = tx.objectStore('accounts');
        for (const acc of accounts) {
            store.put(acc);
        }
        return _promisifyTx(tx);
    }

    /**
     * Get all accounts.
     * @returns {Promise<Array<Object>>}
     */
    async function getAllAccounts() {
        const tx = _tx('accounts', 'readonly');
        return _promisify(tx.objectStore('accounts').getAll());
    }

    /**
     * Update a single account.
     * Caller must set updatedAt before calling.
     * @param {Object} account
     * @returns {Promise<void>}
     */
    async function updateAccount(account) {
        const tx = _tx('accounts', 'readwrite');
        tx.objectStore('accounts').put(account);
        return _promisifyTx(tx);
    }

    /**
     * Delete an account by ID.
     * @param {string} id
     * @returns {Promise<void>}
     */
    async function deleteAccount(id) {
        const tx = _tx('accounts', 'readwrite');
        tx.objectStore('accounts').delete(id);
        return _promisifyTx(tx);
    }

    /**
     * Get account by ID.
     * @param {string} id
     * @returns {Promise<Object|undefined>}
     */
    async function getAccount(id) {
        const tx = _tx('accounts', 'readonly');
        return _promisify(tx.objectStore('accounts').get(id));
    }

    // =====================================================================
    // Journal Entries CRUD
    // =====================================================================

    /**
     * Save a single journal entry.
     * @param {Object} entry
     * @returns {Promise<void>}
     */
    async function saveJournalEntry(entry) {
        const tx = _tx('journal_entries', 'readwrite');
        tx.objectStore('journal_entries').put(entry);
        return _promisifyTx(tx);
    }

    /**
     * Get a single journal entry by ID.
     * @param {string} id
     * @returns {Promise<Object|undefined>}
     */
    async function getJournalEntry(id) {
        const tx = _tx('journal_entries', 'readonly');
        return _promisify(tx.objectStore('journal_entries').get(id));
    }

    /**
     * Get all journal entries.
     * @returns {Promise<Array<Object>>}
     */
    async function getAllJournalEntries() {
        const tx = _tx('journal_entries', 'readonly');
        return _promisify(tx.objectStore('journal_entries').getAll());
    }

    /**
     * Delete a journal entry by ID.
     * @param {string} id
     * @returns {Promise<void>}
     */
    async function deleteJournalEntry(id) {
        const tx = _tx('journal_entries', 'readwrite');
        tx.objectStore('journal_entries').delete(id);
        return _promisifyTx(tx);
    }

    /**
     * Save multiple journal entries in a single transaction.
     * @param {Array<Object>} entries
     * @returns {Promise<void>}
     */
    async function bulkSaveJournalEntries(entries) {
        const tx = _tx('journal_entries', 'readwrite');
        const store = tx.objectStore('journal_entries');
        for (const entry of entries) {
            store.put(entry);
        }
        return _promisifyTx(tx);
    }

    /**
     * Delete all journal entries.
     * @returns {Promise<void>}
     */
    async function clearAllJournalEntries() {
        const tx = _tx('journal_entries', 'readwrite');
        tx.objectStore('journal_entries').clear();
        return _promisifyTx(tx);
    }

    /**
     * Delete all accounts.
     * @returns {Promise<void>}
     */
    async function clearAllAccounts() {
        const tx = _tx('accounts', 'readwrite');
        tx.objectStore('accounts').clear();
        return _promisifyTx(tx);
    }

    // =====================================================================
    // Settings CRUD
    // =====================================================================

    /**
     * Get a setting value by key.
     * @param {string} key
     * @returns {Promise<any>}
     */
    async function getSetting(key) {
        const tx = _tx('app_settings', 'readonly');
        const result = await _promisify(tx.objectStore('app_settings').get(key));
        return result ? result.value : undefined;
    }

    /**
     * Set a setting value.
     * @param {string} key
     * @param {*} value
     * @returns {Promise<void>}
     */
    async function setSetting(key, value) {
        const tx = _tx('app_settings', 'readwrite');
        tx.objectStore('app_settings').put({ key, value });
        return _promisifyTx(tx);
    }

    /**
     * Get all settings as an object.
     * @returns {Promise<Object>}
     */
    async function getAllSettings() {
        const tx = _tx('app_settings', 'readonly');
        const rows = await _promisify(tx.objectStore('app_settings').getAll());
        const obj = {};
        for (const row of rows) {
            obj[row.key] = row.value;
        }
        return obj;
    }

    // =====================================================================
    // Recurring Templates CRUD
    // =====================================================================

    async function saveRecurringTemplate(template) {
        const tx = _tx('recurring_templates', 'readwrite');
        tx.objectStore('recurring_templates').put(template);
        return _promisifyTx(tx);
    }

    async function getAllRecurringTemplates() {
        const tx = _tx('recurring_templates', 'readonly');
        return _promisify(tx.objectStore('recurring_templates').getAll());
    }

    async function deleteRecurringTemplate(id) {
        const tx = _tx('recurring_templates', 'readwrite');
        tx.objectStore('recurring_templates').delete(id);
        return _promisifyTx(tx);
    }

    // =====================================================================
    // Recurring History CRUD
    // =====================================================================

    async function saveRecurringHistory(record) {
        const tx = _tx('recurring_history', 'readwrite');
        tx.objectStore('recurring_history').put(record);
        return _promisifyTx(tx);
    }

    async function getAllRecurringHistory() {
        const tx = _tx('recurring_history', 'readonly');
        return _promisify(tx.objectStore('recurring_history').getAll());
    }

    async function getRecurringHistoryByTemplate(templateId) {
        const tx = _tx('recurring_history', 'readonly');
        const index = tx.objectStore('recurring_history').index('templateId');
        return _promisify(index.getAll(templateId));
    }

    // =====================================================================
    // Budgets CRUD
    // =====================================================================

    async function saveBudget(budget) {
        const tx = _tx('budgets', 'readwrite');
        tx.objectStore('budgets').put(budget);
        return _promisifyTx(tx);
    }

    async function getAllBudgets() {
        const tx = _tx('budgets', 'readonly');
        return _promisify(tx.objectStore('budgets').getAll());
    }

    async function getBudgetByMonth(month) {
        const tx = _tx('budgets', 'readonly');
        const index = tx.objectStore('budgets').index('month');
        return _promisify(index.get(month));
    }

    async function deleteBudget(id) {
        const tx = _tx('budgets', 'readwrite');
        tx.objectStore('budgets').delete(id);
        return _promisifyTx(tx);
    }

    // =====================================================================
    // Tags CRUD
    // =====================================================================

    async function saveTag(tag) {
        const tx = _tx('tags', 'readwrite');
        tx.objectStore('tags').put(tag);
        return _promisifyTx(tx);
    }

    async function getAllTags() {
        const tx = _tx('tags', 'readonly');
        return _promisify(tx.objectStore('tags').getAll());
    }

    async function deleteTag(id) {
        const tx = _tx('tags', 'readwrite');
        tx.objectStore('tags').delete(id);
        return _promisifyTx(tx);
    }

    async function bulkSaveTags(tags) {
        const tx = _tx('tags', 'readwrite');
        const store = tx.objectStore('tags');
        for (var i = 0; i < tags.length; i++) {
            store.put(tags[i]);
        }
        return _promisifyTx(tx);
    }

    async function clearAllTags() {
        const tx = _tx('tags', 'readwrite');
        tx.objectStore('tags').clear();
        return _promisifyTx(tx);
    }

    // =====================================================================
    // Payees CRUD
    // =====================================================================

    async function savePayee(payee) {
        var tx = _tx('payees', 'readwrite');
        tx.objectStore('payees').put(payee);
        return _promisifyTx(tx);
    }

    async function getAllPayees() {
        var tx = _tx('payees', 'readonly');
        return _promisify(tx.objectStore('payees').getAll());
    }

    async function deletePayee(id) {
        var tx = _tx('payees', 'readwrite');
        tx.objectStore('payees').delete(id);
        return _promisifyTx(tx);
    }

    async function clearAllPayees() {
        var tx = _tx('payees', 'readwrite');
        tx.objectStore('payees').clear();
        return _promisifyTx(tx);
    }

    // =====================================================================
    // Financial Goals CRUD
    // =====================================================================

    async function saveGoal(goal) {
        var tx = _tx('financial_goals', 'readwrite');
        tx.objectStore('financial_goals').put(goal);
        return _promisifyTx(tx);
    }

    async function getAllGoals() {
        var tx = _tx('financial_goals', 'readonly');
        return _promisify(tx.objectStore('financial_goals').getAll());
    }

    async function deleteGoal(id) {
        var tx = _tx('financial_goals', 'readwrite');
        tx.objectStore('financial_goals').delete(id);
        return _promisifyTx(tx);
    }

    // =====================================================================
    // Goal Contributions CRUD
    // =====================================================================

    async function saveContribution(contribution) {
        var tx = _tx('goal_contributions', 'readwrite');
        tx.objectStore('goal_contributions').put(contribution);
        return _promisifyTx(tx);
    }

    async function getAllContributions() {
        var tx = _tx('goal_contributions', 'readonly');
        return _promisify(tx.objectStore('goal_contributions').getAll());
    }

    async function getContributionsByGoal(goalId) {
        var tx = _tx('goal_contributions', 'readonly');
        var index = tx.objectStore('goal_contributions').index('goalId');
        return _promisify(index.getAll(goalId));
    }

    async function deleteContribution(id) {
        var tx = _tx('goal_contributions', 'readwrite');
        tx.objectStore('goal_contributions').delete(id);
        return _promisifyTx(tx);
    }

    async function deleteContributionsByGoal(goalId) {
        var tx = _tx('goal_contributions', 'readwrite');
        var index = tx.objectStore('goal_contributions').index('goalId');
        var request = index.openCursor(goalId);
        return new Promise(function (resolve, reject) {
            request.onsuccess = function (e) {
                var cursor = e.target.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                }
            };
            tx.oncomplete = resolve;
            tx.onerror = function () { reject(tx.error); };
        });
    }

    // =====================================================================
    // Reconciliations CRUD
    // =====================================================================

    async function saveReconciliation(record) {
        var tx = _tx('reconciliations', 'readwrite');
        tx.objectStore('reconciliations').put(record);
        return _promisifyTx(tx);
    }

    async function getAllReconciliations() {
        var tx = _tx('reconciliations', 'readonly');
        return _promisify(tx.objectStore('reconciliations').getAll());
    }

    async function getReconciliationsByAccount(accountId) {
        var tx = _tx('reconciliations', 'readonly');
        var index = tx.objectStore('reconciliations').index('accountId');
        return _promisify(index.getAll(accountId));
    }

    async function deleteReconciliation(id) {
        var tx = _tx('reconciliations', 'readwrite');
        tx.objectStore('reconciliations').delete(id);
        return _promisifyTx(tx);
    }

    // =====================================================================
    // Export
    // =====================================================================
    global.FCL = global.FCL || {};
    global.FCL.DB = {
        initDB,
        getDB,
        // Accounts
        saveAccount,
        bulkSaveAccounts,
        getAllAccounts,
        updateAccount,
        deleteAccount,
        getAccount,
        clearAllAccounts,
        // Journal Entries
        saveJournalEntry,
        getJournalEntry,
        getAllJournalEntries,
        deleteJournalEntry,
        bulkSaveJournalEntries,
        clearAllJournalEntries,
        // Settings
        getSetting,
        setSetting,
        getAllSettings,
        // Recurring Templates
        saveRecurringTemplate,
        getAllRecurringTemplates,
        deleteRecurringTemplate,
        // Recurring History
        saveRecurringHistory,
        getAllRecurringHistory,
        getRecurringHistoryByTemplate,
        // Budgets
        saveBudget,
        getAllBudgets,
        getBudgetByMonth,
        deleteBudget,
        // Tags
        saveTag,
        getAllTags,
        deleteTag,
        bulkSaveTags,
        clearAllTags,
        // Payees
        savePayee,
        getAllPayees,
        deletePayee,
        clearAllPayees,
        // Financial Goals
        saveGoal,
        getAllGoals,
        deleteGoal,
        // Goal Contributions
        saveContribution,
        getAllContributions,
        getContributionsByGoal,
        deleteContribution,
        deleteContributionsByGoal,
        // Reconciliations
        saveReconciliation,
        getAllReconciliations,
        getReconciliationsByAccount,
        deleteReconciliation,
    };

})(window);
