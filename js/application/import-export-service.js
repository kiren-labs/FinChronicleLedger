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
     * @param {string} jsonText
     * @returns {Promise<{success: boolean, errors?: string[], stats?: Object}>}
     */
    async function restoreFromBackup(jsonText) {
        let backup;
        try {
            backup = JSON.parse(jsonText);
        } catch {
            return { success: false, errors: ['Invalid JSON file'] };
        }

        if (!backup.accounts || !backup.journalEntries) {
            return { success: false, errors: ['Invalid backup format: missing accounts or journalEntries'] };
        }

        // Clear existing data
        await DB().clearAllAccounts();
        await DB().clearAllJournalEntries();

        // Restore accounts
        if (backup.accounts.length > 0) {
            await DB().bulkSaveAccounts(backup.accounts);
        }

        // Restore entries
        if (backup.journalEntries.length > 0) {
            await DB().bulkSaveJournalEntries(backup.journalEntries);
        }

        // Restore settings
        if (backup.settings) {
            for (const [key, value] of Object.entries(backup.settings)) {
                await DB().setSetting(key, value);
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
                accounts: backup.accounts.length,
                entries: backup.journalEntries.length,
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
