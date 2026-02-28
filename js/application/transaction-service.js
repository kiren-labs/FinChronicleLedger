/**
 * FinChronicleLedger — Application: Transaction Service
 * Create, edit, delete transactions in Simple & Advanced Mode.
 * Orchestrates Domain validation + Infrastructure persistence.
 */
(function (global) {
    'use strict';

    const DB = () => global.FCL.DB;
    const Ledger = () => global.FCL.Ledger;
    const Accounting = () => global.FCL.Accounting;
    const Types = () => global.FCL.Types;
    const Validators = () => global.FCL.Validators;
    const State = () => global.FCL.State;

    // =====================================================================
    // Create
    // =====================================================================

    /**
     * Create a transaction from Simple Mode form data.
     * @param {Object} formData
     * @param {string} formData.type - 'income'|'expense'
     * @param {number} formData.amount
     * @param {string} formData.categoryAccountId
     * @param {string} formData.assetAccountId
     * @param {string} formData.date
     * @param {string} formData.notes
     * @returns {Promise<{success: boolean, entry?: Object, errors?: string[]}>}
     */
    async function createSimpleTransaction(formData) {
        // Validate amount
        const amtResult = Validators().validateAmount(formData.amount);
        if (!amtResult.valid) return { success: false, errors: [amtResult.error] };

        // Build the entry
        let entry;
        if (formData.type === Types().EntryType.EXPENSE) {
            entry = Ledger().buildSimpleExpense(
                formData.amount, formData.categoryAccountId,
                formData.assetAccountId, formData.date, formData.notes
            );
        } else {
            entry = Ledger().buildSimpleIncome(
                formData.amount, formData.categoryAccountId,
                formData.assetAccountId, formData.date, formData.notes
            );
        }

        // Validate the journal entry
        const validation = Ledger().validateJournalEntry(entry);
        if (!validation.valid) return { success: false, errors: validation.errors };

        // Persist
        await DB().saveJournalEntry(entry);

        // Update in-memory state
        State().addEntry(entry);

        return { success: true, entry };
    }

    /**
     * Create a transfer transaction.
     * @param {Object} formData
     * @param {number} formData.amount
     * @param {string} formData.fromAccountId
     * @param {string} formData.toAccountId
     * @param {string} formData.date
     * @param {string} formData.notes
     * @returns {Promise<{success: boolean, entry?: Object, errors?: string[]}>}
     */
    async function createTransfer(formData) {
        const amtResult = Validators().validateAmount(formData.amount);
        if (!amtResult.valid) return { success: false, errors: [amtResult.error] };

        if (formData.fromAccountId === formData.toAccountId) {
            return { success: false, errors: ['Source and destination accounts must be different'] };
        }

        const entry = Ledger().buildTransferEntry(
            formData.amount, formData.fromAccountId,
            formData.toAccountId, formData.date, formData.notes
        );

        const validation = Ledger().validateJournalEntry(entry);
        if (!validation.valid) return { success: false, errors: validation.errors };

        await DB().saveJournalEntry(entry);
        State().addEntry(entry);

        return { success: true, entry };
    }

    /**
     * Create a transaction from Advanced Mode (raw journal lines).
     * @param {Object} formData
     * @param {string} formData.type
     * @param {string} formData.date
     * @param {string} formData.description
     * @param {Array} formData.lines - [{accountId, debit, credit, memo}]
     * @returns {Promise<{success: boolean, entry?: Object, errors?: string[]}>}
     */
    async function createAdvancedTransaction(formData) {
        const entry = Ledger().createJournalEntry({
            type: formData.type,
            date: formData.date,
            description: formData.description,
            lines: formData.lines,
        });

        const validation = Ledger().validateJournalEntry(entry);
        if (!validation.valid) return { success: false, errors: validation.errors };

        await DB().saveJournalEntry(entry);
        State().addEntry(entry);

        return { success: true, entry };
    }

    // =====================================================================
    // Edit
    // =====================================================================

    /**
     * Edit an existing transaction. Replaces the entry entirely.
     * @param {string} id
     * @param {Object} formData - Same structure as create methods
     * @param {'simple'|'advanced'} mode
     * @returns {Promise<{success: boolean, entry?: Object, errors?: string[]}>}
     */
    async function editTransaction(id, formData, mode) {
        const existing = State().getEntryById(id);
        if (!existing) return { success: false, errors: ['Transaction not found'] };

        let entry;
        if (mode === 'simple') {
            if (formData.type === Types().EntryType.TRANSFER) {
                entry = Ledger().buildTransferEntry(
                    formData.amount, formData.fromAccountId,
                    formData.toAccountId, formData.date, formData.notes
                );
            } else if (formData.type === Types().EntryType.EXPENSE) {
                entry = Ledger().buildSimpleExpense(
                    formData.amount, formData.categoryAccountId,
                    formData.assetAccountId, formData.date, formData.notes
                );
            } else {
                entry = Ledger().buildSimpleIncome(
                    formData.amount, formData.categoryAccountId,
                    formData.assetAccountId, formData.date, formData.notes
                );
            }
        } else {
            entry = Ledger().createJournalEntry({
                type: formData.type,
                date: formData.date,
                description: formData.description,
                lines: formData.lines,
            });
        }

        // Preserve original ID and createdAt
        entry.id = id;
        entry.createdAt = existing.createdAt;
        entry.updatedAt = new Date().toISOString();

        const validation = Ledger().validateJournalEntry(entry);
        if (!validation.valid) return { success: false, errors: validation.errors };

        await DB().saveJournalEntry(entry);
        State().updateEntry(entry);

        return { success: true, entry };
    }

    // =====================================================================
    // Delete
    // =====================================================================

    /**
     * Delete a transaction by ID.
     * @param {string} id
     * @returns {Promise<{success: boolean, errors?: string[]}>}
     */
    async function deleteTransaction(id) {
        const existing = State().getEntryById(id);
        if (!existing) return { success: false, errors: ['Transaction not found'] };

        await DB().deleteJournalEntry(id);
        State().removeEntry(id);

        return { success: true };
    }

    // =====================================================================
    // Export
    // =====================================================================
    global.FCL = global.FCL || {};
    global.FCL.TransactionService = {
        createSimpleTransaction,
        createTransfer,
        createAdvancedTransaction,
        editTransaction,
        deleteTransaction,
    };

})(window);
