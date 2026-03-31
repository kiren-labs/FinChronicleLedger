/**
 * FinChronicleLedger — Application: CSV Import Service
 * Parse, validate, and preview CSV data before importing as transactions.
 */
(function (global) {
    'use strict';

    const Types = () => global.FCL.Types;
    const Validators = () => global.FCL.Validators;
    const AccountService = () => global.FCL.AccountService;
    const TransactionService = () => global.FCL.TransactionService;

    // Required CSV headers (case-insensitive)
    var REQUIRED_HEADERS = ['date', 'amount', 'type', 'category'];
    var OPTIONAL_HEADERS = ['notes', 'description'];

    // =====================================================================
    // Parse & Validate
    // =====================================================================

    /**
     * Parse a CSV string into an array of validated row objects.
     * @param {string} csvText
     * @returns {{ rows: Array, errors: Array, headers: Array }}
     */
    function parseCSV(csvText) {
        if (!csvText || !csvText.trim()) {
            return { rows: [], errors: [{ row: 0, message: 'Empty CSV file' }], headers: [] };
        }

        var lines = csvText.trim().split(/\r?\n/);
        if (lines.length < 2) {
            return { rows: [], errors: [{ row: 0, message: 'CSV must have a header row and at least one data row' }], headers: [] };
        }

        // Parse header
        var rawHeaders = _parseLine(lines[0]).map(function (h) {
            return h.toLowerCase().trim();
        });

        // Check required headers
        var missing = REQUIRED_HEADERS.filter(function (h) {
            return rawHeaders.indexOf(h) === -1;
        });
        if (missing.length > 0) {
            return { rows: [], errors: [{ row: 1, message: 'Missing required headers: ' + missing.join(', ') }], headers: rawHeaders };
        }

        var headerMap = {};
        for (var h = 0; h < rawHeaders.length; h++) {
            headerMap[rawHeaders[h]] = h;
        }

        var rows = [];
        var errors = [];

        for (var i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue; // skip empty lines

            var cells = _parseLine(lines[i]);
            var rowNum = i + 1;
            var rowErrors = [];

            // Date
            var dateStr = (cells[headerMap['date']] || '').trim();
            if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                rowErrors.push('Invalid date format (expected YYYY-MM-DD)');
            }

            // Type
            var type = (cells[headerMap['type']] || '').trim().toLowerCase();
            if (['income', 'expense', 'transfer'].indexOf(type) === -1) {
                rowErrors.push('Invalid type "' + Validators().sanitizeHTML(type) + '" — expected income, expense, or transfer');
            }

            // Amount
            var amountStr = (cells[headerMap['amount']] || '').trim();
            var amount = parseFloat(amountStr);
            if (isNaN(amount) || amount <= 0) {
                rowErrors.push('Invalid amount');
            }

            // Category
            var category = (cells[headerMap['category']] || '').trim();
            if (!category) {
                rowErrors.push('Missing category');
            }

            // Notes (optional)
            var notes = '';
            if (headerMap['notes'] != null) {
                notes = (cells[headerMap['notes']] || '').trim();
            } else if (headerMap['description'] != null) {
                notes = (cells[headerMap['description']] || '').trim();
            }

            if (rowErrors.length > 0) {
                errors.push({ row: rowNum, message: rowErrors.join('; ') });
            } else {
                rows.push({
                    date: dateStr,
                    type: type,
                    amount: amount,
                    category: Validators().sanitizeHTML(category),
                    notes: Validators().sanitizeHTML(notes),
                    _rowNum: rowNum,
                });
            }
        }

        return { rows: rows, errors: errors, headers: rawHeaders };
    }

    /**
     * Validate parsed rows against the chart of accounts.
     * Returns rows split into valid + invalid.
     */
    function validateRows(rows) {
        var valid = [];
        var invalid = [];

        for (var i = 0; i < rows.length; i++) {
            var row = rows[i];

            // Find the category account
            var categoryCode = Types().CategoryAccountMap[row.category];
            var categoryAccount = categoryCode ? AccountService().getAccountByCode(categoryCode) : null;

            // Also try by account name directly
            if (!categoryAccount) {
                var allAccounts = AccountService().getActiveAccounts();
                categoryAccount = allAccounts.find(function (a) {
                    return a.name.toLowerCase() === row.category.toLowerCase();
                });
            }

            if (!categoryAccount && row.type !== 'transfer') {
                invalid.push({ row: row, reason: 'Unknown category "' + row.category + '"' });
            } else {
                row._categoryAccountId = categoryAccount ? categoryAccount.id : null;
                valid.push(row);
            }
        }

        return { valid: valid, invalid: invalid };
    }

    // =====================================================================
    // Import
    // =====================================================================

    /**
     * Import validated rows as transactions.
     * @param {Array} validRows - Rows from validateRows().valid
     * @returns {Promise<{imported: number, errors: Array}>}
     */
    async function importRows(validRows) {
        var imported = 0;
        var errors = [];
        var assetAccount = AccountService().getDefaultAssetAccount();

        if (!assetAccount) {
            return { imported: 0, errors: [{ row: 0, message: 'No default asset account found' }] };
        }

        for (var i = 0; i < validRows.length; i++) {
            var row = validRows[i];
            var result;

            if (row.type === 'transfer') {
                // For transfers, try to find the target account by category name
                var targetAcct = AccountService().getActiveAccounts().find(function (a) {
                    return a.name.toLowerCase() === row.category.toLowerCase() && a.type === 'asset';
                });
                if (!targetAcct) {
                    errors.push({ row: row._rowNum, message: 'Transfer target account not found: ' + row.category });
                    continue;
                }
                result = await TransactionService().createTransfer({
                    amount: row.amount,
                    fromAccountId: assetAccount.id,
                    toAccountId: targetAcct.id,
                    date: row.date,
                    notes: row.notes,
                });
            } else {
                result = await TransactionService().createSimpleTransaction({
                    type: row.type,
                    amount: row.amount,
                    categoryAccountId: row._categoryAccountId,
                    assetAccountId: assetAccount.id,
                    date: row.date,
                    notes: row.notes,
                });
            }

            if (result.success) {
                imported++;
            } else {
                errors.push({ row: row._rowNum, message: result.errors[0] || 'Import failed' });
            }
        }

        return { imported: imported, errors: errors };
    }

    // =====================================================================
    // CSV line parser (handles quoted fields)
    // =====================================================================

    function _parseLine(line) {
        var cells = [];
        var current = '';
        var inQuotes = false;

        for (var i = 0; i < line.length; i++) {
            var ch = line[i];
            if (inQuotes) {
                if (ch === '"') {
                    if (i + 1 < line.length && line[i + 1] === '"') {
                        current += '"';
                        i++; // skip escaped quote
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
                    cells.push(current);
                    current = '';
                } else {
                    current += ch;
                }
            }
        }
        cells.push(current);
        return cells;
    }

    // =====================================================================
    // Export
    // =====================================================================
    global.FCL = global.FCL || {};
    global.FCL.CSVImportService = {
        parseCSV: parseCSV,
        validateRows: validateRows,
        importRows: importRows,
    };

})(window);
