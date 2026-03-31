/**
 * FinChronicleLedger — Application: Reconciliation Service
 * Account reconciliation flow: statement import, auto-matching,
 * manual matching, and finalization.
 */
(function (global) {
    'use strict';

    var DB = function () { return global.FCL.DB; };
    var State = function () { return global.FCL.State; };
    var Validators = function () { return global.FCL.Validators; };
    var Accounting = function () { return global.FCL.Accounting; };
    var Ledger = function () { return global.FCL.Ledger; };
    var PayeeService = function () { return global.FCL.PayeeService; };

    var ReconStatus = { DRAFT: 'draft', IN_PROGRESS: 'in-progress', COMPLETED: 'completed' };

    // =====================================================================
    // Initialization
    // =====================================================================

    async function loadAll() {
        var recons = await DB().getAllReconciliations();
        State().setReconciliations(recons);
    }

    // =====================================================================
    // Queries
    // =====================================================================

    function getAllReconciliations() {
        return State().getReconciliations();
    }

    function getReconciliationById(id) {
        return State().getReconciliations().find(function (r) { return r.id === id; });
    }

    function getReconciliationsForAccount(accountId) {
        return State().getReconciliations().filter(function (r) {
            return r.accountId === accountId;
        });
    }

    /**
     * Get reconciliation summary showing counts and balance status.
     */
    function getReconciliationSummary(reconId) {
        var recon = getReconciliationById(reconId);
        if (!recon) return null;

        var matched = (recon.matchedTransactionIds || []).length;
        var unmatchedApp = (recon.unmatchedAppTransactionIds || []).length;
        var unmatchedBank = (recon.unmatchedBankTransactions || []).length;
        var totalBank = matched + unmatchedBank;
        var totalApp = matched + unmatchedApp;

        return {
            reconId: reconId,
            status: recon.status,
            matchedCount: matched,
            unmatchedAppCount: unmatchedApp,
            unmatchedBankCount: unmatchedBank,
            totalBankItems: totalBank,
            totalAppItems: totalApp,
            openingBalance: recon.openingBalance,
            closingBalance: recon.closingBalance,
            bankClosingBalance: recon.bankClosingBalance,
            difference: recon.difference,
        };
    }

    // =====================================================================
    // Reconciliation Flow
    // =====================================================================

    /**
     * Start a new reconciliation for an account and month.
     * @param {string} accountId
     * @param {string} month - YYYY-MM
     * @param {number} openingBalance
     * @returns {Promise<Object>}
     */
    async function startReconciliation(accountId, month, openingBalance) {
        if (!accountId) return { success: false, errors: ['Account is required'] };
        if (!month || !/^\d{4}-\d{2}$/.test(month)) {
            return { success: false, errors: ['Month must be YYYY-MM format'] };
        }

        var balance = parseFloat(openingBalance);
        if (!Number.isFinite(balance)) {
            return { success: false, errors: ['Opening balance must be a valid number'] };
        }

        // Check for existing draft for same account/month
        var existing = State().getReconciliations().find(function (r) {
            return r.accountId === accountId && r.month === month && r.status !== ReconStatus.COMPLETED;
        });
        if (existing) {
            return { success: true, reconciliation: existing, resumed: true };
        }

        // Gather app transactions for this account in this month
        var entries = State().getEntries();
        var appTxIds = [];
        for (var i = 0; i < entries.length; i++) {
            var entry = entries[i];
            if (!entry.date.startsWith(month)) continue;
            var hasAccount = entry.lines.some(function (l) {
                return l.accountId === accountId;
            });
            if (hasAccount) {
                appTxIds.push(entry.id);
            }
        }

        var recon = {
            id: Validators().generateId(),
            accountId: accountId,
            month: month,
            openingBalance: Accounting().round2(balance),
            closingBalance: 0,
            bankClosingBalance: 0,
            difference: 0,
            status: ReconStatus.DRAFT,
            matchedTransactionIds: [],
            unmatchedAppTransactionIds: appTxIds,
            unmatchedBankTransactions: [],
            reconciledAt: null,
            notes: '',
            createdAt: new Date().toISOString(),
        };

        await DB().saveReconciliation(recon);
        State().addReconciliation(recon);
        return { success: true, reconciliation: recon };
    }

    /**
     * Import a bank statement CSV into the reconciliation.
     * Expected CSV columns: Date, Description, Amount
     * Positive = deposit, negative = withdrawal (or vice versa, auto-detected).
     */
    async function importBankStatement(reconId, csvText) {
        var recon = getReconciliationById(reconId);
        if (!recon) return { success: false, errors: ['Reconciliation not found'] };

        var lines = csvText.trim().split('\n');
        if (lines.length < 2) {
            return { success: false, errors: ['CSV must have at least a header and one data row'] };
        }

        var header = lines[0].toLowerCase();
        var hasDate = header.indexOf('date') !== -1;
        var hasAmount = header.indexOf('amount') !== -1;
        if (!hasDate || !hasAmount) {
            return { success: false, errors: ['CSV must have Date and Amount columns'] };
        }

        // Parse header to get column indices
        var cols = parseCSVLine(lines[0]);
        var dateIdx = -1, descIdx = -1, amountIdx = -1;
        for (var h = 0; h < cols.length; h++) {
            var colLower = cols[h].toLowerCase().trim();
            if (colLower === 'date') dateIdx = h;
            else if (colLower === 'description' || colLower === 'desc' || colLower === 'details' || colLower === 'narration') descIdx = h;
            else if (colLower === 'amount') amountIdx = h;
        }

        var bankTxns = [];
        for (var i = 1; i < lines.length; i++) {
            var row = parseCSVLine(lines[i]);
            if (row.length < 2) continue;

            var date = (row[dateIdx] || '').trim();
            var desc = descIdx >= 0 ? (row[descIdx] || '').trim() : '';
            var amountStr = (row[amountIdx] || '').replace(/[^0-9.\-]/g, '');
            var amount = parseFloat(amountStr);

            if (!date || isNaN(amount)) continue;

            // Normalize date: try to parse to YYYY-MM-DD
            var normalDate = normalizeDate(date);
            if (!normalDate) continue;

            bankTxns.push({
                index: bankTxns.length,
                date: normalDate,
                description: Validators().sanitizeHTML(desc),
                amount: Accounting().round2(amount),
                matched: false,
                matchedEntryId: null,
            });
        }

        if (bankTxns.length === 0) {
            return { success: false, errors: ['No valid transactions found in CSV'] };
        }

        // Calculate bank closing balance
        var bankTotal = bankTxns.reduce(function (s, t) { return s + t.amount; }, 0);
        var bankClosing = Accounting().round2(recon.openingBalance + bankTotal);

        var updated = Object.assign({}, recon, {
            unmatchedBankTransactions: bankTxns,
            bankClosingBalance: bankClosing,
            status: ReconStatus.IN_PROGRESS,
        });

        await DB().saveReconciliation(updated);
        State().updateReconciliation(updated);
        return { success: true, reconciliation: updated, importedCount: bankTxns.length };
    }

    /**
     * Auto-match bank transactions to app entries by date and amount.
     */
    async function autoMatch(reconId) {
        var recon = getReconciliationById(reconId);
        if (!recon) return { success: false, errors: ['Reconciliation not found'] };

        var updated = Object.assign({}, recon, {
            matchedTransactionIds: (recon.matchedTransactionIds || []).slice(),
            unmatchedAppTransactionIds: (recon.unmatchedAppTransactionIds || []).slice(),
            unmatchedBankTransactions: recon.unmatchedBankTransactions.map(function (t) {
                return Object.assign({}, t);
            }),
        });

        var entries = State().getEntries();
        var entryMap = {};
        for (var e = 0; e < entries.length; e++) {
            entryMap[entries[e].id] = entries[e];
        }

        var matchCount = 0;

        for (var b = 0; b < updated.unmatchedBankTransactions.length; b++) {
            var bankTx = updated.unmatchedBankTransactions[b];
            if (bankTx.matched) continue;

            var bankAmount = Math.abs(bankTx.amount);
            var bankDate = bankTx.date;

            // Try to find a matching unmatched app transaction
            for (var a = 0; a < updated.unmatchedAppTransactionIds.length; a++) {
                var entryId = updated.unmatchedAppTransactionIds[a];
                var entry = entryMap[entryId];
                if (!entry) continue;

                var entryTotal = Ledger().getEntryTotal(entry);

                // Match by date and amount (within tolerance)
                if (entry.date === bankDate &&
                    Math.abs(entryTotal - bankAmount) < 0.02) {

                    // Match found
                    bankTx.matched = true;
                    bankTx.matchedEntryId = entryId;
                    updated.matchedTransactionIds.push(entryId);
                    updated.unmatchedAppTransactionIds.splice(a, 1);
                    matchCount++;
                    break;
                }
            }
        }

        // Recalculate difference
        updated.closingBalance = calculateAppClosingBalance(updated);
        updated.difference = Accounting().round2(updated.bankClosingBalance - updated.closingBalance);

        await DB().saveReconciliation(updated);
        State().updateReconciliation(updated);
        return { success: true, reconciliation: updated, matchCount: matchCount };
    }

    /**
     * Manually match a bank transaction to an app entry.
     */
    async function manualMatch(reconId, bankTxIndex, entryId) {
        var recon = getReconciliationById(reconId);
        if (!recon) return { success: false, errors: ['Reconciliation not found'] };

        var updated = Object.assign({}, recon, {
            matchedTransactionIds: (recon.matchedTransactionIds || []).slice(),
            unmatchedAppTransactionIds: (recon.unmatchedAppTransactionIds || []).slice(),
            unmatchedBankTransactions: recon.unmatchedBankTransactions.map(function (t) {
                return Object.assign({}, t);
            }),
        });

        // Find the bank transaction
        var bankTx = updated.unmatchedBankTransactions.find(function (t) {
            return t.index === bankTxIndex;
        });
        if (!bankTx) return { success: false, errors: ['Bank transaction not found'] };
        if (bankTx.matched) return { success: false, errors: ['Bank transaction already matched'] };

        // Find and remove from unmatched app list
        var appIdx = updated.unmatchedAppTransactionIds.indexOf(entryId);
        if (appIdx === -1) return { success: false, errors: ['App transaction not in unmatched list'] };

        bankTx.matched = true;
        bankTx.matchedEntryId = entryId;
        updated.matchedTransactionIds.push(entryId);
        updated.unmatchedAppTransactionIds.splice(appIdx, 1);

        updated.closingBalance = calculateAppClosingBalance(updated);
        updated.difference = Accounting().round2(updated.bankClosingBalance - updated.closingBalance);

        await DB().saveReconciliation(updated);
        State().updateReconciliation(updated);
        return { success: true, reconciliation: updated };
    }

    /**
     * Unmatch a previously matched transaction.
     */
    async function unmatch(reconId, bankTxIndex) {
        var recon = getReconciliationById(reconId);
        if (!recon) return { success: false, errors: ['Reconciliation not found'] };

        var updated = Object.assign({}, recon, {
            matchedTransactionIds: (recon.matchedTransactionIds || []).slice(),
            unmatchedAppTransactionIds: (recon.unmatchedAppTransactionIds || []).slice(),
            unmatchedBankTransactions: recon.unmatchedBankTransactions.map(function (t) {
                return Object.assign({}, t);
            }),
        });

        var bankTx = updated.unmatchedBankTransactions.find(function (t) {
            return t.index === bankTxIndex;
        });
        if (!bankTx || !bankTx.matched) {
            return { success: false, errors: ['Bank transaction not matched'] };
        }

        var entryId = bankTx.matchedEntryId;
        bankTx.matched = false;
        bankTx.matchedEntryId = null;

        var matchIdx = updated.matchedTransactionIds.indexOf(entryId);
        if (matchIdx !== -1) updated.matchedTransactionIds.splice(matchIdx, 1);
        updated.unmatchedAppTransactionIds.push(entryId);

        updated.closingBalance = calculateAppClosingBalance(updated);
        updated.difference = Accounting().round2(updated.bankClosingBalance - updated.closingBalance);

        await DB().saveReconciliation(updated);
        State().updateReconciliation(updated);
        return { success: true, reconciliation: updated };
    }

    /**
     * Complete the reconciliation.
     */
    async function completeReconciliation(reconId) {
        var recon = getReconciliationById(reconId);
        if (!recon) return { success: false, errors: ['Reconciliation not found'] };

        var updated = Object.assign({}, recon, {
            status: ReconStatus.COMPLETED,
            reconciledAt: new Date().toISOString(),
        });

        // Final balance calculation
        updated.closingBalance = calculateAppClosingBalance(updated);
        updated.difference = Accounting().round2(updated.bankClosingBalance - updated.closingBalance);

        await DB().saveReconciliation(updated);
        State().updateReconciliation(updated);
        return { success: true, reconciliation: updated };
    }

    /**
     * Delete a reconciliation (only drafts/in-progress).
     */
    async function deleteReconciliation(id) {
        var recon = getReconciliationById(id);
        if (!recon) return { success: false, errors: ['Reconciliation not found'] };

        await DB().deleteReconciliation(id);
        State().removeReconciliation(id);
        return { success: true };
    }

    // =====================================================================
    // Helpers
    // =====================================================================

    /**
     * Calculate the app-side closing balance from opening + matched transactions.
     */
    function calculateAppClosingBalance(recon) {
        var entries = State().getEntries();
        var total = recon.openingBalance;

        var allMatchedIds = recon.matchedTransactionIds || [];
        for (var i = 0; i < allMatchedIds.length; i++) {
            var entry = entries.find(function (e) { return e.id === allMatchedIds[i]; });
            if (!entry) continue;
            // Determine net effect on the reconciled account
            for (var j = 0; j < entry.lines.length; j++) {
                var line = entry.lines[j];
                if (line.accountId === recon.accountId) {
                    total += line.debit - line.credit;
                }
            }
        }
        return Accounting().round2(total);
    }

    /**
     * Parse a single CSV line respecting quoted fields.
     */
    function parseCSVLine(line) {
        var result = [];
        var current = '';
        var inQuotes = false;
        for (var i = 0; i < line.length; i++) {
            var ch = line[i];
            if (inQuotes) {
                if (ch === '"') {
                    if (i + 1 < line.length && line[i + 1] === '"') {
                        current += '"';
                        i++;
                    } else {
                        inQuotes = false;
                    }
                } else {
                    current += ch;
                }
            } else {
                if (ch === '"') {
                    inQuotes = true;
                } else if (ch === ',') {
                    result.push(current);
                    current = '';
                } else {
                    current += ch;
                }
            }
        }
        result.push(current);
        return result;
    }

    /**
     * Normalize various date formats to YYYY-MM-DD.
     */
    function normalizeDate(dateStr) {
        // Already YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

        // DD/MM/YYYY or DD-MM-YYYY
        var dmy = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
        if (dmy) {
            var d = dmy[1].padStart(2, '0');
            var m = dmy[2].padStart(2, '0');
            return dmy[3] + '-' + m + '-' + d;
        }

        // MM/DD/YYYY
        var mdy = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
        if (mdy) {
            return mdy[3] + '-' + mdy[1].padStart(2, '0') + '-' + mdy[2].padStart(2, '0');
        }

        // Try native parse
        var parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
            return parsed.toISOString().slice(0, 10);
        }

        return null;
    }

    // =====================================================================
    // Export
    // =====================================================================

    global.FCL = global.FCL || {};
    global.FCL.ReconciliationService = {
        ReconStatus: ReconStatus,
        loadAll: loadAll,
        getAllReconciliations: getAllReconciliations,
        getReconciliationById: getReconciliationById,
        getReconciliationsForAccount: getReconciliationsForAccount,
        getReconciliationSummary: getReconciliationSummary,
        startReconciliation: startReconciliation,
        importBankStatement: importBankStatement,
        autoMatch: autoMatch,
        manualMatch: manualMatch,
        unmatch: unmatch,
        completeReconciliation: completeReconciliation,
        deleteReconciliation: deleteReconciliation,
    };

})(window);
