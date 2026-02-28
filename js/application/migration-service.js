/**
 * FinChronicleLedger — Application: Migration Service
 * v3 → v4 data migration: parse v3 CSV backup, convert transactions, verify.
 */
(function (global) {
    'use strict';

    const DB = () => global.FCL.DB;
    const FileIO = () => global.FCL.FileIO;
    const Ledger = () => global.FCL.Ledger;
    const COA = () => global.FCL.ChartOfAccounts;
    const Accounting = () => global.FCL.Accounting;
    const Types = () => global.FCL.Types;
    const State = () => global.FCL.State;
    const AccountService = () => global.FCL.AccountService;

    // =====================================================================
    // Parse v3 Backup
    // =====================================================================

    /**
     * Parse a v3 CSV backup file into structured data.
     * Expected columns: Date, Type, Category, Amount, Notes
     * First row may be a metadata comment starting with #.
     * @param {string} csvText
     * @returns {{ transactions: Array, metadata: string|null, errors: string[] }}
     */
    function parseV3Backup(csvText) {
        const rows = FileIO().parseCSV(csvText);
        const errors = [];
        let metadata = null;
        let startRow = 0;

        // Check for metadata line
        if (rows.length > 0 && rows[0][0] && rows[0][0].startsWith('#')) {
            metadata = rows[0][0];
            startRow = 1;
        }

        // Check for header row
        if (rows.length > startRow) {
            const header = rows[startRow].map(h => h.trim().toLowerCase());
            if (header.includes('date') || header.includes('type')) {
                startRow++;
            }
        }

        const transactions = [];
        for (let i = startRow; i < rows.length; i++) {
            const row = rows[i];
            if (row.length < 4) continue; // Skip malformed rows
            if (row.every(cell => cell.trim() === '')) continue; // Skip empty rows

            const date = (row[0] || '').trim();
            const type = (row[1] || '').trim().toLowerCase();
            const category = (row[2] || '').trim();
            const amount = parseFloat(row[3]);
            const notes = (row[4] || '').trim();

            if (!date || isNaN(amount) || amount <= 0) {
                errors.push(`Row ${i + 1}: Invalid data (date="${date}", amount="${row[3]}")`);
                continue;
            }

            transactions.push({ date, type, category, amount, notes });
        }

        return { transactions, metadata, errors };
    }

    // =====================================================================
    // Migration
    // =====================================================================

    /**
     * Migrate v3 transactions to v4 journal entries.
     * @param {Array} v3Transactions - Output of parseV3Backup
     * @returns {Promise<{success: boolean, migrated: number, skipped: number, errors: string[]}>}
     */
    async function migrateFromV3(v3Transactions) {
        const accounts = State().getAccounts();
        const categoryMap = COA().MIGRATION_CATEGORY_MAP;
        const defaultAsset = AccountService().getDefaultAssetAccount();

        if (!defaultAsset) {
            return { success: false, migrated: 0, skipped: 0, errors: ['No default asset account found'] };
        }

        const entries = [];
        const errors = [];
        let skipped = 0;

        for (let i = 0; i < v3Transactions.length; i++) {
            const tx = v3Transactions[i];

            // Find the v4 account for this v3 category
            const mapping = categoryMap[tx.category];
            if (!mapping) {
                errors.push(`Row ${i + 1}: Unknown category "${tx.category}". Mapped to Other ${tx.type === 'income' ? 'Income' : 'Expenses'}.`);
                // Fallback
                const fallbackCode = tx.type === 'income' ? 4900 : 5950;
                const fallbackAcc = accounts.find(a => a.code === fallbackCode);
                if (!fallbackAcc) { skipped++; continue; }

                const entry = _buildMigratedEntry(tx, fallbackAcc.id, defaultAsset.id);
                if (entry) entries.push(entry); else skipped++;
                continue;
            }

            const targetAccount = accounts.find(a => a.code === mapping.code);
            if (!targetAccount) {
                errors.push(`Row ${i + 1}: Account code ${mapping.code} not found`);
                skipped++;
                continue;
            }

            const entry = _buildMigratedEntry(tx, targetAccount.id, defaultAsset.id);
            if (entry) entries.push(entry); else skipped++;
        }

        // Bulk save
        if (entries.length > 0) {
            await DB().bulkSaveJournalEntries(entries);
            // Reload state
            const allEntries = await DB().getAllJournalEntries();
            State().setEntries(allEntries);
        }

        // Mark migration as done
        await DB().setSetting('v3_migration_done', true);
        State().setSetting('v3_migration_done', true);

        return {
            success: true,
            migrated: entries.length,
            skipped,
            errors,
        };
    }

    /**
     * @private Build a single migrated journal entry.
     */
    function _buildMigratedEntry(tx, categoryAccountId, assetAccountId) {
        try {
            let entry;
            if (tx.type === 'income') {
                entry = Ledger().buildSimpleIncome(
                    tx.amount, categoryAccountId, assetAccountId, tx.date, tx.notes
                );
            } else {
                entry = Ledger().buildSimpleExpense(
                    tx.amount, categoryAccountId, assetAccountId, tx.date, tx.notes
                );
            }
            entry.source = Types().EntrySource.MIGRATION;
            return entry;
        } catch {
            return null;
        }
    }

    // =====================================================================
    // Verification
    // =====================================================================

    /**
     * Verify migration integrity (trial balance check).
     * @returns {Object}
     */
    function verifyMigration() {
        const entries = State().getEntries();
        const trialBalance = Accounting().verifyTrialBalance(entries);
        const migrated = entries.filter(e => e.source === Types().EntrySource.MIGRATION);

        return {
            totalEntries: entries.length,
            migratedEntries: migrated.length,
            trialBalance,
        };
    }

    // =====================================================================
    // Export
    // =====================================================================
    global.FCL = global.FCL || {};
    global.FCL.MigrationService = {
        parseV3Backup,
        migrateFromV3,
        verifyMigration,
    };

})(window);
