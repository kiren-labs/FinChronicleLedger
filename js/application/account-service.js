/**
 * FinChronicleLedger — Application: Account Service
 * Account seeding, CRUD, balance queries.
 */
(function (global) {
    'use strict';

    const DB = () => global.FCL.DB;
    const COA = () => global.FCL.ChartOfAccounts;
    const Accounting = () => global.FCL.Accounting;
    const State = () => global.FCL.State;

    // =====================================================================
    // Seeding
    // =====================================================================

    /**
     * Seed default accounts on first run. Skips if accounts already exist.
     * @returns {Promise<boolean>} true if seeded, false if already populated
     */
    async function seedDefaultAccounts() {
        const existing = await DB().getAllAccounts();
        if (existing.length > 0) return false;

        const accounts = COA().buildSeedAccounts();
        await DB().bulkSaveAccounts(accounts);
        State().setAccounts(accounts);
        return true;
    }

    // =====================================================================
    // Queries
    // =====================================================================

    /** @returns {Array} all accounts from in-memory state */
    function getAllAccounts() {
        return State().getAccounts();
    }

    /** @returns {Array} active accounts only */
    function getActiveAccounts() {
        return State().getAccounts().filter(a => a.isActive);
    }

    /**
     * Get accounts filtered by type.
     * @param {string} type
     * @returns {Array}
     */
    function getAccountsByType(type) {
        return State().getAccounts().filter(a => a.type === type);
    }

    /**
     * Get active accounts of a given type.
     * @param {string} type
     * @returns {Array}
     */
    function getActiveAccountsByType(type) {
        return State().getAccounts().filter(a => a.type === type && a.isActive);
    }

    /**
     * Find account by ID.
     * @param {string} id
     * @returns {Object|undefined}
     */
    function getAccountById(id) {
        return State().getAccounts().find(a => a.id === id);
    }

    /**
     * Find account by code.
     * @param {number} code
     * @returns {Object|undefined}
     */
    function getAccountByCode(code) {
        return State().getAccounts().find(a => a.code === code);
    }

    /**
     * Get the default asset account (for Simple Mode).
     * @returns {Object}
     */
    function getDefaultAssetAccount() {
        const defaultId = State().getSetting('default_asset_account');
        if (defaultId) {
            const acc = getAccountById(defaultId);
            if (acc && acc.isActive) return acc;
        }
        // Fallback: code 1100 (Checking Account)
        return getAccountByCode(1100) || getActiveAccountsByType('asset')[0];
    }

    // =====================================================================
    // Balance Queries
    // =====================================================================

    /**
     * Get balance for a single account.
     * @param {string} accountId
     * @returns {number}
     */
    function getAccountBalance(accountId) {
        const account = getAccountById(accountId);
        if (!account) return 0;
        return Accounting().getAccountBalance(accountId, account.type, State().getEntries());
    }

    /**
     * Get all account balances.
     * @returns {Map<string, number>}
     */
    function getAllBalances() {
        return Accounting().getAllBalances(State().getAccounts(), State().getEntries());
    }

    // =====================================================================
    // Mutations
    // =====================================================================

    /**
     * Rename an account (non-system only).
     * @param {string} id
     * @param {string} newName
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async function renameAccount(id, newName) {
        const account = getAccountById(id);
        if (!account) return { success: false, error: 'Account not found' };
        if (account.isSystem) return { success: false, error: 'Cannot rename system accounts' };
        if (!newName || newName.trim().length === 0) return { success: false, error: 'Name cannot be empty' };
        if (newName.length > 100) return { success: false, error: 'Name cannot exceed 100 characters' };

        const updated = Object.assign({}, account, {
            name: global.FCL.Validators.sanitizeHTML(newName.trim()),
            updatedAt: new Date().toISOString(),
        });
        await DB().updateAccount(updated);
        State().updateAccount(updated);
        return { success: true };
    }

    /**
     * Deactivate an account (non-system only).
     * @param {string} id
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async function deactivateAccount(id) {
        const account = getAccountById(id);
        if (!account) return { success: false, error: 'Account not found' };
        if (account.isSystem) return { success: false, error: 'Cannot deactivate system accounts' };

        const updated = Object.assign({}, account, {
            isActive: false,
            updatedAt: new Date().toISOString(),
        });
        await DB().updateAccount(updated);
        State().updateAccount(updated);
        return { success: true };
    }

    /**
     * Reactivate a previously deactivated account.
     * @param {string} id
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async function reactivateAccount(id) {
        const account = getAccountById(id);
        if (!account) return { success: false, error: 'Account not found' };

        const updated = Object.assign({}, account, {
            isActive: true,
            updatedAt: new Date().toISOString(),
        });
        await DB().updateAccount(updated);
        State().updateAccount(updated);
        return { success: true };
    }

    /**
     * Set the default asset account for Simple Mode.
     * @param {string} accountId
     * @returns {Promise<void>}
     */
    async function setDefaultAssetAccount(accountId) {
        await DB().setSetting('default_asset_account', accountId);
        State().setSetting('default_asset_account', accountId);
    }

    // =====================================================================
    // Export
    // =====================================================================
    global.FCL = global.FCL || {};
    global.FCL.AccountService = {
        seedDefaultAccounts,
        getAllAccounts,
        getActiveAccounts,
        getAccountsByType,
        getActiveAccountsByType,
        getAccountById,
        getAccountByCode,
        getDefaultAssetAccount,
        getAccountBalance,
        getAllBalances,
        renameAccount,
        deactivateAccount,
        reactivateAccount,
        setDefaultAssetAccount,
    };

})(window);
