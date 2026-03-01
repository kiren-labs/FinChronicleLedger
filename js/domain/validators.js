/**
 * FinChronicleLedger — Domain: Validators
 * Pure input validation — no I/O, no DOM.
 */
(function (global) {
    'use strict';

    const T = () => global.FCL.Types;

    // =====================================================================
    // Amount Validation
    // =====================================================================

    /**
     * Check if a number has at most 2 decimal places.
     * @param {number} amount
     * @returns {boolean}
     */
    function isValidDecimal(amount) {
        return Number.isFinite(amount) &&
            Math.round(amount * 100) === amount * 100;
    }

    /**
     * Validate a monetary amount.
     * @param {*} amount - Raw input
     * @returns {{ valid: boolean, error: string|null, value: number }}
     */
    function validateAmount(amount) {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        if (!Number.isFinite(num) || isNaN(num)) {
            return { valid: false, error: 'Amount must be a valid number', value: NaN };
        }
        if (num <= 0) {
            return { valid: false, error: 'Amount must be greater than zero', value: num };
        }
        if (num > T().MAX_AMOUNT) {
            return { valid: false, error: `Amount cannot exceed ${T().MAX_AMOUNT.toLocaleString()}`, value: num };
        }
        if (!isValidDecimal(num)) {
            return { valid: false, error: 'Amount can have at most 2 decimal places', value: num };
        }
        return { valid: true, error: null, value: num };
    }

    // =====================================================================
    // Date Validation
    // =====================================================================

    /**
     * Validate a date string (YYYY-MM-DD).
     * @param {string} dateStr
     * @returns {{ valid: boolean, error: string|null }}
     */
    function validateDate(dateStr) {
        if (!dateStr || typeof dateStr !== 'string') {
            return { valid: false, error: 'Date is required' };
        }
        const date = new Date(dateStr + 'T00:00:00');
        if (isNaN(date.getTime())) {
            return { valid: false, error: 'Invalid date format' };
        }
        if (date.getFullYear() < T().MIN_DATE_YEAR) {
            return { valid: false, error: `Date cannot be before ${T().MIN_DATE_YEAR}` };
        }
        const now = new Date();
        now.setHours(23, 59, 59, 999);
        if (date > now) {
            return { valid: false, error: 'Future dates are not allowed' };
        }
        return { valid: true, error: null };
    }

    // =====================================================================
    // Text Validation & Sanitization
    // =====================================================================

    /**
     * Sanitize HTML to prevent XSS.
     * Pure implementation — no DOM dependency.
     * Escapes &, <, >, ", ' to their HTML entity equivalents.
     * @param {string} str
     * @returns {string}
     */
    function sanitizeHTML(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * Validate and sanitize notes/description.
     * @param {string} text
     * @param {number} [maxLength]
     * @returns {{ valid: boolean, error: string|null, sanitized: string }}
     */
    function validateText(text, maxLength) {
        maxLength = maxLength || T().MAX_NOTES_LENGTH;
        if (!text) return { valid: true, error: null, sanitized: '' };
        if (text.length > maxLength) {
            return { valid: false, error: `Text cannot exceed ${maxLength} characters`, sanitized: '' };
        }
        return { valid: true, error: null, sanitized: sanitizeHTML(text) };
    }

    // =====================================================================
    // Account Validation
    // =====================================================================

    /**
     * Validate account type.
     * @param {string} type
     * @returns {boolean}
     */
    function isValidAccountType(type) {
        return Object.values(T().AccountType).includes(type);
    }

    // =====================================================================
    // Entry Type Validation
    // =====================================================================

    /**
     * Validate entry type.
     * @param {string} type
     * @returns {boolean}
     */
    function isValidEntryType(type) {
        return Object.values(T().EntryType).includes(type);
    }

    // =====================================================================
    // UUID Generation
    // =====================================================================

    /**
     * Generate UUID v4.
     * Uses crypto.randomUUID when available, falls back to crypto.getRandomValues.
     * @returns {string}
     */
    function generateId() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        // Fallback using CSPRNG (crypto.getRandomValues)
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
            const bytes = new Uint8Array(16);
            crypto.getRandomValues(bytes);
            bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
            bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10
            const hex = Array.from(bytes, function (b) { return b.toString(16).padStart(2, '0'); }).join('');
            return hex.slice(0, 8) + '-' + hex.slice(8, 12) + '-' + hex.slice(12, 16) + '-' + hex.slice(16, 20) + '-' + hex.slice(20);
        }
        // Last resort fallback (insecure — only for very old browsers)
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0;
            var v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // =====================================================================
    // Export
    // =====================================================================
    global.FCL = global.FCL || {};
    global.FCL.Validators = {
        isValidDecimal,
        validateAmount,
        validateDate,
        sanitizeHTML,
        validateText,
        isValidAccountType,
        isValidEntryType,
        generateId,
    };

})(window);
