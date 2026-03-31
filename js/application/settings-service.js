/**
 * FinChronicleLedger — Application: Settings Service
 * Currency, theme, version, UI mode management.
 */
(function (global) {
    'use strict';

    const DB = () => global.FCL.DB;
    const Types = () => global.FCL.Types;
    const State = () => global.FCL.State;
    const R = () => global.FCL.UI.Renderer;

    // =====================================================================
    // Theme
    // =====================================================================

    /**
     * Toggle dark mode.
     * @returns {Promise<string>} 'enabled' or 'disabled'
     */
    async function toggleDarkMode() {
        const current = State().getSetting('darkMode') || 'disabled';
        const next = current === 'enabled' ? 'disabled' : 'enabled';
        await DB().setSetting('darkMode', next);
        State().setSetting('darkMode', next);
        applyTheme(next);
        return next;
    }

    /**
     * Apply theme to the document.
     * Delegates to UI Renderer — DOM access belongs in the UI layer.
     * @param {string} mode - 'enabled' or 'disabled'
     */
    function applyTheme(mode) {
        R().applyTheme(mode);
    }

    // =====================================================================
    // Currency
    // =====================================================================

    /**
     * Get current currency code.
     * @returns {string}
     */
    function getCurrency() {
        return State().getSetting('currency') || 'INR';
    }

    /**
     * Get current currency symbol.
     * @returns {string}
     */
    function getCurrencySymbol() {
        const code = getCurrency();
        const c = Types().Currencies[code];
        return c ? c.symbol : code;
    }

    /**
     * Set currency.
     * @param {string} code
     * @returns {Promise<void>}
     */
    async function setCurrency(code) {
        if (!Types().Currencies[code]) return;
        await DB().setSetting('currency', code);
        State().setSetting('currency', code);
    }

    // =====================================================================
    // UI Mode (Simple / Advanced)
    // =====================================================================

    /**
     * Get current UI mode.
     * @returns {'simple'|'advanced'}
     */
    function getUIMode() {
        return State().getSetting('uiMode') || 'simple';
    }

    /**
     * Toggle UI mode.
     * @returns {Promise<string>}
     */
    async function toggleUIMode() {
        const current = getUIMode();
        const next = current === 'simple' ? 'advanced' : 'simple';
        await DB().setSetting('uiMode', next);
        State().setSetting('uiMode', next);
        return next;
    }

    /**
     * Set UI mode explicitly.
     * @param {'simple'|'advanced'} mode
     * @returns {Promise<void>}
     */
    async function setUIMode(mode) {
        await DB().setSetting('uiMode', mode);
        State().setSetting('uiMode', mode);
    }

    // =====================================================================
    // Version
    // =====================================================================

    /**
     * Check and update stored app version.
     * @returns {Promise<{updated: boolean, from: string, to: string}>}
     */
    async function checkVersion() {
        const stored = State().getSetting('app_version') || '0.0.0';
        const current = Types().APP_VERSION;

        if (stored !== current) {
            await DB().setSetting('app_version', current);
            State().setSetting('app_version', current);
            return { updated: true, from: stored, to: current };
        }
        return { updated: false, from: stored, to: current };
    }

    // =====================================================================
    // Summary collapsed state
    // =====================================================================

    function isSummaryCollapsed() {
        return State().getSetting('summaryCollapsed') === true;
    }

    async function toggleSummaryCollapsed() {
        const current = isSummaryCollapsed();
        await DB().setSetting('summaryCollapsed', !current);
        State().setSetting('summaryCollapsed', !current);
        return !current;
    }

    // =====================================================================
    // Install Prompt
    // =====================================================================

    function isInstallPromptHidden() {
        return State().getSetting('installPromptHidden') === true;
    }

    async function hideInstallPrompt() {
        await DB().setSetting('installPromptHidden', true);
        State().setSetting('installPromptHidden', true);
    }

    // =====================================================================
    // Load all settings from DB into State
    // =====================================================================

    /**
     * Load all settings from IndexedDB into in-memory state.
     * Called once at startup.
     * @returns {Promise<void>}
     */
    async function loadSettings() {
        const all = await DB().getAllSettings();
        for (const [key, value] of Object.entries(all)) {
            State().setSetting(key, value);
        }
    }

    // =====================================================================
    // Export
    // =====================================================================
    global.FCL = global.FCL || {};
    global.FCL.SettingsService = {
        toggleDarkMode,
        applyTheme,
        getCurrency,
        getCurrencySymbol,
        setCurrency,
        getUIMode,
        toggleUIMode,
        setUIMode,
        checkVersion,
        isSummaryCollapsed,
        toggleSummaryCollapsed,
        isInstallPromptHidden,
        hideInstallPrompt,
        loadSettings,
    };

})(window);
