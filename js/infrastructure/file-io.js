/**
 * FinChronicleLedger — Infrastructure: File I/O
 * CSV generation/parsing, file download triggers, file reading.
 * No business logic.
 */
(function (global) {
    'use strict';

    // =====================================================================
    // CSV Generation
    // =====================================================================

    /**
     * Generate CSV text from headers and rows.
     * Handles quoting for fields containing commas, quotes, or newlines.
     * @param {string[]} headers
     * @param {Array<Array<string|number>>} rows
     * @returns {string}
     */
    function generateCSV(headers, rows) {
        const escape = (val) => {
            const str = val == null ? '' : String(val);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return '"' + str.replace(/"/g, '""') + '"';
            }
            return str;
        };

        const lines = [headers.map(escape).join(',')];
        for (const row of rows) {
            lines.push(row.map(escape).join(','));
        }
        return lines.join('\n');
    }

    // =====================================================================
    // CSV Parsing
    // =====================================================================

    /**
     * Parse CSV text into a 2D array of strings.
     * Handles quoted fields with commas and newlines.
     * @param {string} text
     * @returns {string[][]}
     */
    function parseCSV(text) {
        const rows = [];
        let current = [];
        let field = '';
        let inQuotes = false;
        let i = 0;

        while (i < text.length) {
            const ch = text[i];

            if (inQuotes) {
                if (ch === '"') {
                    if (i + 1 < text.length && text[i + 1] === '"') {
                        field += '"';
                        i += 2;
                    } else {
                        inQuotes = false;
                        i++;
                    }
                } else {
                    field += ch;
                    i++;
                }
            } else {
                if (ch === '"') {
                    inQuotes = true;
                    i++;
                } else if (ch === ',') {
                    current.push(field);
                    field = '';
                    i++;
                } else if (ch === '\n' || (ch === '\r' && text[i + 1] === '\n')) {
                    current.push(field);
                    field = '';
                    rows.push(current);
                    current = [];
                    i += ch === '\r' ? 2 : 1;
                } else {
                    field += ch;
                    i++;
                }
            }
        }

        // Last field
        if (field || current.length > 0) {
            current.push(field);
            rows.push(current);
        }

        return rows;
    }

    // =====================================================================
    // Download Trigger
    // =====================================================================

    /**
     * Trigger a file download in the browser.
     * @param {string} content
     * @param {string} filename
     * @param {string} [mimeType='text/csv']
     */
    function triggerDownload(content, filename, mimeType) {
        mimeType = mimeType || 'text/csv';
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // =====================================================================
    // File Reading
    // =====================================================================

    /**
     * Read a file as text (e.g., CSV file from <input type="file">).
     * @param {File} file
     * @returns {Promise<string>}
     */
    function readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    // =====================================================================
    // Backup Metadata
    // =====================================================================

    /**
     * Generate backup metadata line for CSV exports.
     * @param {string} appVersion
     * @param {string} currency
     * @param {number} entryCount
     * @returns {string}
     */
    function generateBackupMetadata(appVersion, currency, entryCount) {
        const now = new Date().toISOString();
        return `# FinChronicleLedger Backup | v${appVersion} | ${currency} | ${entryCount} entries | ${now}`;
    }

    // =====================================================================
    // Export
    // =====================================================================
    global.FCL = global.FCL || {};
    global.FCL.FileIO = {
        generateCSV,
        parseCSV,
        triggerDownload,
        readFile,
        generateBackupMetadata,
    };

})(window);
