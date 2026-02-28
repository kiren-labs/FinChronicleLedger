/**
 * FinChronicleLedger — Domain: Ledger
 * Journal entry creation, validation, and transformation.
 * Pure functions — no I/O.
 */
(function (global) {
    'use strict';

    const T = () => global.FCL.Types;
    const V = () => global.FCL.Validators;
    const A = () => global.FCL.Accounting;

    // =====================================================================
    // Journal Entry Validation
    // =====================================================================

    /**
     * Validate a journal entry before persistence.
     * @param {Object} entry
     * @returns {{ valid: boolean, errors: string[] }}
     */
    function validateJournalEntry(entry) {
        const errors = [];

        // 1. Minimum 2 line items
        if (!entry.lines || entry.lines.length < 2) {
            errors.push('Journal entry must have at least 2 line items');
        }

        if (entry.lines && entry.lines.length >= 2) {
            // 2. Sum of debits MUST equal sum of credits
            const totalDebits = entry.lines.reduce((s, l) => s + l.debit, 0);
            const totalCredits = entry.lines.reduce((s, l) => s + l.credit, 0);
            if (Math.abs(totalDebits - totalCredits) > T().BALANCE_TOLERANCE) {
                errors.push(`Entry is not balanced: DR ${A().round2(totalDebits)} ≠ CR ${A().round2(totalCredits)}`);
            }

            // 3. No line has BOTH debit > 0 AND credit > 0
            for (const line of entry.lines) {
                if (line.debit > 0 && line.credit > 0) {
                    errors.push('A line item cannot have both debit and credit');
                }
            }

            // 4. No negative amounts
            for (const line of entry.lines) {
                if (line.debit < 0 || line.credit < 0) {
                    errors.push('Amounts cannot be negative');
                }
            }

            // 5. Decimal precision (max 2 places)
            for (const line of entry.lines) {
                if (!V().isValidDecimal(line.debit) || !V().isValidDecimal(line.credit)) {
                    errors.push('Amounts must have at most 2 decimal places');
                    break;
                }
            }

            // 6. Each line must reference an accountId
            for (const line of entry.lines) {
                if (!line.accountId) {
                    errors.push('Each line item must reference an account');
                    break;
                }
            }
        }

        // 7. Valid type
        if (!V().isValidEntryType(entry.type)) {
            errors.push('Invalid entry type');
        }

        // 8. Date validation
        const dateResult = V().validateDate(entry.date);
        if (!dateResult.valid) {
            errors.push(dateResult.error);
        }

        // 9. Description length
        if (entry.description && entry.description.length > T().MAX_NOTES_LENGTH) {
            errors.push(`Description cannot exceed ${T().MAX_NOTES_LENGTH} characters`);
        }

        return { valid: errors.length === 0, errors };
    }

    // =====================================================================
    // Journal Entry Creation
    // =====================================================================

    /**
     * Create a journal entry object (does not persist).
     * @param {Object} params
     * @param {string} params.type    - 'income'|'expense'|'transfer'|'opening'
     * @param {string} params.date    - YYYY-MM-DD
     * @param {string} params.description
     * @param {Array}  params.lines   - [{accountId, debit, credit, memo?}]
     * @param {string} [params.source='user-input']
     * @param {string} [params.reference=null]
     * @returns {Object} JournalEntry
     */
    function createJournalEntry({ type, date, description, lines, source, reference }) {
        const now = new Date().toISOString();
        return {
            id: V().generateId(),
            date,
            type,
            description: V().sanitizeHTML(description || ''),
            reference: reference || null,
            tags: [],
            source: source || T().EntrySource.USER_INPUT,
            lines: lines.map(l => ({
                id: V().generateId(),
                accountId: l.accountId,
                debit: A().round2(l.debit || 0),
                credit: A().round2(l.credit || 0),
                memo: V().sanitizeHTML(l.memo || ''),
            })),
            createdAt: now,
            updatedAt: now,
        };
    }

    // =====================================================================
    // Simple Mode Builders
    // =====================================================================

    /**
     * Build a simple expense entry.
     * DR Expense account
     * CR Asset (default) account
     *
     * @param {number} amount
     * @param {string} expenseAccountId
     * @param {string} assetAccountId
     * @param {string} date
     * @param {string} notes
     * @returns {Object} JournalEntry
     */
    function buildSimpleExpense(amount, expenseAccountId, assetAccountId, date, notes) {
        return createJournalEntry({
            type: T().EntryType.EXPENSE,
            date,
            description: notes,
            lines: [
                { accountId: expenseAccountId, debit: amount, credit: 0 },
                { accountId: assetAccountId, debit: 0, credit: amount },
            ],
        });
    }

    /**
     * Build a simple income entry.
     * DR Asset (default) account
     * CR Income account
     *
     * @param {number} amount
     * @param {string} incomeAccountId
     * @param {string} assetAccountId
     * @param {string} date
     * @param {string} notes
     * @returns {Object} JournalEntry
     */
    function buildSimpleIncome(amount, incomeAccountId, assetAccountId, date, notes) {
        return createJournalEntry({
            type: T().EntryType.INCOME,
            date,
            description: notes,
            lines: [
                { accountId: assetAccountId, debit: amount, credit: 0 },
                { accountId: incomeAccountId, debit: 0, credit: amount },
            ],
        });
    }

    /**
     * Build a transfer entry.
     * DR toAccount (receiving account)
     * CR fromAccount (sending account)
     *
     * @param {number} amount
     * @param {string} fromAccountId
     * @param {string} toAccountId
     * @param {string} date
     * @param {string} notes
     * @returns {Object} JournalEntry
     */
    function buildTransferEntry(amount, fromAccountId, toAccountId, date, notes) {
        return createJournalEntry({
            type: T().EntryType.TRANSFER,
            date,
            description: notes || 'Transfer',
            lines: [
                { accountId: toAccountId, debit: amount, credit: 0 },
                { accountId: fromAccountId, debit: 0, credit: amount },
            ],
        });
    }

    /**
     * Build an opening balance entry.
     * Assets & Expenses → Debit, Liabilities, Equity & Income → Credit.
     * Remainder goes to Opening Balance Equity (3000) to balance.
     *
     * @param {Array<{accountId: string, accountType: string, amount: number}>} balances
     * @param {string} obeAccountId - Opening Balance Equity account id
     * @param {string} date
     * @returns {Object} JournalEntry
     */
    function buildOpeningBalanceEntry(balances, obeAccountId, date) {
        const lines = [];
        let totalDebits = 0;
        let totalCredits = 0;

        for (const b of balances) {
            if (b.amount === 0) continue;

            if (b.accountType === T().AccountType.ASSET || b.accountType === T().AccountType.EXPENSE) {
                // Debit-normal: positive balance → debit
                if (b.amount > 0) {
                    lines.push({ accountId: b.accountId, debit: b.amount, credit: 0 });
                    totalDebits += b.amount;
                } else {
                    lines.push({ accountId: b.accountId, debit: 0, credit: Math.abs(b.amount) });
                    totalCredits += Math.abs(b.amount);
                }
            } else {
                // Credit-normal: positive balance → credit
                if (b.amount > 0) {
                    lines.push({ accountId: b.accountId, debit: 0, credit: b.amount });
                    totalCredits += b.amount;
                } else {
                    lines.push({ accountId: b.accountId, debit: Math.abs(b.amount), credit: 0 });
                    totalDebits += Math.abs(b.amount);
                }
            }
        }

        // Balance with Opening Balance Equity
        const diff = A().round2(totalDebits - totalCredits);
        if (diff > 0) {
            lines.push({ accountId: obeAccountId, debit: 0, credit: diff });
        } else if (diff < 0) {
            lines.push({ accountId: obeAccountId, debit: Math.abs(diff), credit: 0 });
        }

        return createJournalEntry({
            type: T().EntryType.OPENING,
            date: date || new Date().toISOString().slice(0, 10),
            description: 'Opening balances',
            lines,
            source: T().EntrySource.SYSTEM,
        });
    }

    // =====================================================================
    // Helpers
    // =====================================================================

    /**
     * Get total amount of a journal entry (sum of debits OR credits — they're equal).
     * @param {Object} entry
     * @returns {number}
     */
    function getEntryTotal(entry) {
        return A().round2(entry.lines.reduce((s, l) => s + l.debit, 0));
    }

    /**
     * Determine the "simple mode" display info from a journal entry.
     * Returns { type, amount, categoryAccountId, assetAccountId }.
     * @param {Object} entry
     * @returns {Object|null}
     */
    function getSimpleDisplayInfo(entry) {
        if (entry.lines.length !== 2) return null;

        const [line1, line2] = entry.lines;
        const total = getEntryTotal(entry);

        if (entry.type === T().EntryType.EXPENSE) {
            const debitLine = line1.debit > 0 ? line1 : line2;
            const creditLine = line1.credit > 0 ? line1 : line2;
            return {
                type: 'expense',
                amount: total,
                categoryAccountId: debitLine.accountId,
                assetAccountId: creditLine.accountId,
            };
        }

        if (entry.type === T().EntryType.INCOME) {
            const debitLine = line1.debit > 0 ? line1 : line2;
            const creditLine = line1.credit > 0 ? line1 : line2;
            return {
                type: 'income',
                amount: total,
                categoryAccountId: creditLine.accountId,
                assetAccountId: debitLine.accountId,
            };
        }

        if (entry.type === T().EntryType.TRANSFER) {
            const debitLine = line1.debit > 0 ? line1 : line2;
            const creditLine = line1.credit > 0 ? line1 : line2;
            return {
                type: 'transfer',
                amount: total,
                toAccountId: debitLine.accountId,
                fromAccountId: creditLine.accountId,
            };
        }

        return null;
    }

    // =====================================================================
    // Export
    // =====================================================================
    global.FCL = global.FCL || {};
    global.FCL.Ledger = {
        validateJournalEntry,
        createJournalEntry,
        buildSimpleExpense,
        buildSimpleIncome,
        buildTransferEntry,
        buildOpeningBalanceEntry,
        getEntryTotal,
        getSimpleDisplayInfo,
    };

})(window);
