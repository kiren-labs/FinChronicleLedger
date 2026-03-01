/**
 * FinChronicleLedger — Application: Import/Export Service
 * CSV export, CSV import, backup creation, backup restoration.
 */
(function (global) {
    'use strict';

    const DB = () => global.FCL.DB;
    const FileIO = () => global.FCL.FileIO;
    const Ledger = () => global.FCL.Ledger;
    const Accounting = () => global.FCL.Accounting;
    const Types = () => global.FCL.Types;
    const State = () => global.FCL.State;
    const AccountService = () => global.FCL.AccountService;

    // =====================================================================
    // CSV Export
    // =====================================================================

    /**
     * Export all journal entries as a CSV file.
     * Simple Mode format: Date, Type, Category, Amount, Notes
     * @returns {void} — triggers download
     */
    function exportCSV() {
        const entries = State().getEntries();
        const accounts = State().getAccounts();
        const accountMap = new Map(accounts.map(a => [a.id, a]));
        const currency = State().getSetting('currency') || 'INR';

        const headers = ['Date', 'Type', 'Category', 'Amount', 'Notes'];
        const rows = [];

        // Sort by date ascending
        const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));

        for (const entry of sorted) {
            const info = Ledger().getSimpleDisplayInfo(entry);
            if (info) {
                const categoryAcc = accountMap.get(info.categoryAccountId || info.toAccountId);
                rows.push([
                    entry.date,
                    entry.type,
                    categoryAcc ? categoryAcc.name : 'Unknown',
                    info.amount,
                    entry.description,
                ]);
            } else {
                // Advanced multi-line entries: export as single row with total
                const total = Ledger().getEntryTotal(entry);
                rows.push([
                    entry.date,
                    entry.type,
                    'Multi-line entry',
                    total,
                    entry.description,
                ]);
            }
        }

        const metadata = FileIO().generateBackupMetadata(
            Types().APP_VERSION, currency, entries.length
        );
        const csv = metadata + '\n' + FileIO().generateCSV(headers, rows);
        const filename = `FinChronicleLedger_backup_${new Date().toISOString().slice(0, 10)}.csv`;

        FileIO().triggerDownload(csv, filename, 'text/csv');
    }

    // =====================================================================
    // Full Backup (JSON)
    // =====================================================================

    /**
     * Create a full JSON backup of all data and trigger download.
     */
    async function createFullBackup() {
        const accounts = await DB().getAllAccounts();
        const entries = await DB().getAllJournalEntries();
        const settings = await DB().getAllSettings();

        const backup = {
            app: Types().APP_NAME,
            version: Types().APP_VERSION,
            exportedAt: new Date().toISOString(),
            accounts,
            journalEntries: entries,
            settings,
        };

        const json = JSON.stringify(backup, null, 2);
        const filename = `FinChronicleLedger_full_backup_${new Date().toISOString().slice(0, 10)}.json`;
        FileIO().triggerDownload(json, filename, 'application/json');

        // Update last backup timestamp
        await DB().setSetting('last_backup_timestamp', Date.now());
        State().setSetting('last_backup_timestamp', Date.now());
    }

    // =====================================================================
    // Restore from JSON Backup
    // =====================================================================

    /**
     * Restore from a full JSON backup.
     * Validates and sanitizes all imported data to prevent XSS and corruption.
     * @param {string} jsonText
     * @returns {Promise<{success: boolean, errors?: string[], stats?: Object}>}
     */
    async function restoreFromBackup(jsonText) {
        const Validators = () => global.FCL.Validators;

        let backup;
        try {
            backup = JSON.parse(jsonText);
        } catch {
            return { success: false, errors: ['Invalid JSON file'] };
        }

        // Structural validation
        if (!backup || typeof backup !== 'object') {
            return { success: false, errors: ['Invalid backup format'] };
        }
        if (!Array.isArray(backup.accounts) || !Array.isArray(backup.journalEntries)) {
            return { success: false, errors: ['Invalid backup format: missing accounts or journalEntries'] };
        }

        // Sanitize account data
        const sanitizedAccounts = backup.accounts.map(function (acc) {
            return {
                id: String(acc.id || ''),
                code: Number(acc.code) || 0,
                name: Validators().sanitizeHTML(String(acc.name || '')),
                type: String(acc.type || ''),
                normalBalance: String(acc.normalBalance || 'debit'),
                isActive: Boolean(acc.isActive),
                isSystem: Boolean(acc.isSystem),
                parentId: acc.parentId ? String(acc.parentId) : null,
                sortOrder: Number(acc.sortOrder) || 0,
                createdAt: String(acc.createdAt || ''),
                updatedAt: String(acc.updatedAt || ''),
            };
        });

        // Sanitize journal entry data
        const sanitizedEntries = backup.journalEntries.map(function (entry) {
            return {
                id: String(entry.id || ''),
                date: String(entry.date || ''),
                type: String(entry.type || ''),
                description: Validators().sanitizeHTML(String(entry.description || '')),
                reference: entry.reference ? Validators().sanitizeHTML(String(entry.reference)) : null,
                tags: Array.isArray(entry.tags) ? entry.tags.map(function (t) { return Validators().sanitizeHTML(String(t)); }) : [],
                source: String(entry.source || 'import'),
                lines: Array.isArray(entry.lines) ? entry.lines.map(function (line) {
                    return {
                        id: String(line.id || ''),
                        accountId: String(line.accountId || ''),
                        debit: Math.max(0, Number(line.debit) || 0),
                        credit: Math.max(0, Number(line.credit) || 0),
                        memo: Validators().sanitizeHTML(String(line.memo || '')),
                    };
                }) : [],
                createdAt: String(entry.createdAt || ''),
                updatedAt: String(entry.updatedAt || ''),
            };
        });

        // Validate account types
        const validTypes = Object.values(Types().AccountType);
        for (const acc of sanitizedAccounts) {
            if (!validTypes.includes(acc.type)) {
                return { success: false, errors: ['Invalid account type: ' + acc.type] };
            }
            if (!acc.id || !acc.name) {
                return { success: false, errors: ['Backup contains accounts with missing id or name'] };
            }
        }

        // Clear existing data
        await DB().clearAllAccounts();
        await DB().clearAllJournalEntries();

        // Restore sanitized accounts
        if (sanitizedAccounts.length > 0) {
            await DB().bulkSaveAccounts(sanitizedAccounts);
        }

        // Restore sanitized entries
        if (sanitizedEntries.length > 0) {
            await DB().bulkSaveJournalEntries(sanitizedEntries);
        }

        // Restore settings (only known safe keys)
        if (backup.settings && typeof backup.settings === 'object') {
            var safeSettingKeys = [
                'currency', 'darkMode', 'uiMode', 'app_version',
                'last_backup_timestamp', 'summaryCollapsed', 'installPromptHidden',
                'default_asset_account', 'v3_migration_done'
            ];
            for (var _i = 0; _i < safeSettingKeys.length; _i++) {
                var key = safeSettingKeys[_i];
                if (key in backup.settings) {
                    await DB().setSetting(key, backup.settings[key]);
                }
            }
        }

        // Reload state
        State().setAccounts(await DB().getAllAccounts());
        State().setEntries(await DB().getAllJournalEntries());
        const allSettings = await DB().getAllSettings();
        for (const [k, v] of Object.entries(allSettings)) {
            State().setSetting(k, v);
        }

        // Verify trial balance after restore
        const tb = Accounting().verifyTrialBalance(State().getEntries());

        return {
            success: true,
            stats: {
                accounts: sanitizedAccounts.length,
                entries: sanitizedEntries.length,
                trialBalanced: tb.balanced,
            },
        };
    }

    // =====================================================================
    // Export
    // =====================================================================
    global.FCL = global.FCL || {};
    global.FCL.ImportExportService = {
        exportCSV,
        createFullBackup,
        restoreFromBackup,
    };

})(window);
