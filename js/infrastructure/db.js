/**
 * FinChronicleLedger — Infrastructure: Database
 * IndexedDB initialization, CRUD operations, migrations, bulk ops.
 * All DB access goes through this module.
 */
(function (global) {
    'use strict';

    const DB_NAME = 'FinChronicleLedgerDB';
    const DB_VERSION = 1;

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
     * @param {Object} account
     * @returns {Promise<void>}
     */
    async function updateAccount(account) {
        account.updatedAt = new Date().toISOString();
        const tx = _tx('accounts', 'readwrite');
        tx.objectStore('accounts').put(account);
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
    };

})(window);
