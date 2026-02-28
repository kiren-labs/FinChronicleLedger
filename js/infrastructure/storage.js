/**
 * FinChronicleLedger — Infrastructure: Storage
 * Thin localStorage wrapper. Used only for v3 migration detection and legacy reads.
 * New settings live in IndexedDB app_settings store.
 */
(function (global) {
    'use strict';

    /**
     * Get a value from localStorage.
     * @param {string} key
     * @returns {string|null}
     */
    function get(key) {
        try {
            return localStorage.getItem(key);
        } catch {
            return null;
        }
    }

    /**
     * Set a value in localStorage.
     * @param {string} key
     * @param {string} value
     */
    function set(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch {
            // Quota exceeded or unavailable — silently ignore
        }
    }

    /**
     * Remove a key from localStorage.
     * @param {string} key
     */
    function remove(key) {
        try {
            localStorage.removeItem(key);
        } catch {
            // Ignore
        }
    }

    /**
     * Get a JSON value from localStorage.
     * @param {string} key
     * @returns {*}
     */
    function getJSON(key) {
        const raw = get(key);
        if (raw === null) return null;
        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }

    /**
     * Set a JSON value in localStorage.
     * @param {string} key
     * @param {*} value
     */
    function setJSON(key, value) {
        set(key, JSON.stringify(value));
    }

    /**
     * Check if v3 data exists in localStorage (for migration detection).
     * @returns {boolean}
     */
    function hasV3Data() {
        return get('transactions') !== null || get('currency') !== null;
    }

    // =====================================================================
    // Export
    // =====================================================================
    global.FCL = global.FCL || {};
    global.FCL.Storage = {
        get,
        set,
        remove,
        getJSON,
        setJSON,
        hasV3Data,
    };

})(window);
