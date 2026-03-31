/**
 * FinChronicleLedger — UI: Renderer
 * Master updateUI() and mode-aware sub-rendering coordination.
 */
(function (global) {
    'use strict';

    const State = () => global.FCL.State;
    const Settings = () => global.FCL.SettingsService;
    const T = () => global.FCL.Types;
    const V = () => global.FCL.Validators;

    /**
     * Master UI refresh — called on every state change.
     * Delegates to sub-renderers.
     * Wrapped with error boundary to prevent one broken panel from crashing the whole UI.
     */
    function updateUI() {
        const mode = Settings().getUIMode();

        // Update mode-specific visibility
        updateForMode(mode);

        // Re-render active tab content
        const activeTab = getActiveTab();

        try {
            if (activeTab === 'add') {
                if (global.FCL.UI.Forms) global.FCL.UI.Forms.render(mode);
            } else if (activeTab === 'list') {
                if (global.FCL.UI.List) global.FCL.UI.List.render(mode);
            } else if (activeTab === 'groups') {
                if (global.FCL.UI.Groups) global.FCL.UI.Groups.render(mode);
            } else if (activeTab === 'reports') {
                if (global.FCL.UI.ReportsUI) global.FCL.UI.ReportsUI.render();
            } else if (activeTab === 'goals') {
                if (global.FCL.UI.GoalsUI) global.FCL.UI.GoalsUI.render();
            } else if (activeTab === 'settings') {
                if (global.FCL.UI.SettingsUI) global.FCL.UI.SettingsUI.render();
            }
        } catch (err) {
            console.error('[FCL] Render error in tab "' + activeTab + '":', err);
        }

        // Always update summary if it's visible on the current tab
        try {
            if (activeTab === 'add' || activeTab === 'list') {
                if (global.FCL.UI.Summary) global.FCL.UI.Summary.render(mode);
            }
        } catch (err) {
            console.error('[FCL] Summary render error:', err);
        }
    }

    /**
     * Show/hide mode-specific elements.
     * Updates data-mode on <html> so CSS selectors handle .advanced-only / .simple-only visibility.
     * @param {'simple'|'advanced'} mode
     */
    function updateForMode(mode) {
        // Set data-mode attribute on <html> — CSS uses this to show/hide .advanced-only / .simple-only
        document.documentElement.setAttribute('data-mode', mode);
    }

    /**
     * Get the currently active tab name.
     * @returns {string}
     */
    function getActiveTab() {
        const active = document.querySelector('.tab-content.active');
        return active ? active.dataset.tab : 'add';
    }

    /**
     * Show a toast notification.
     * @param {string} message
     * @param {'success'|'error'|'info'} [type='success']
     * @param {Object} [action] - Optional action button {label: string, action: Function}
     */
    function showToast(message, type, action) {
        type = type || 'success';
        const toast = document.getElementById('toast');
        if (!toast) return;

        if (action && action.label && typeof action.action === 'function') {
            toast.innerHTML = '';
            var textSpan = document.createElement('span');
            textSpan.textContent = message;
            toast.appendChild(textSpan);

            var btn = document.createElement('button');
            btn.className = 'toast-action-btn';
            btn.textContent = action.label;
            btn.addEventListener('click', function () {
                action.action();
                toast.classList.remove('toast--visible');
                clearTimeout(toast._timer);
            });
            toast.appendChild(btn);
        } else {
            toast.textContent = message;
        }

        toast.className = 'toast toast--' + type + ' toast--visible';

        clearTimeout(toast._timer);
        const duration = action ? T().TOAST_DURATION_LONG : T().TOAST_DURATION_SHORT;
        toast._timer = setTimeout(() => {
            toast.classList.remove('toast--visible');
        }, duration);
    }

    /**
     * Format currency for display.
     * @param {number} amount
     * @returns {string}
     */
    function formatCurrency(amount) {
        const symbol = Settings().getCurrencySymbol();
        const locale = Settings().getCurrency() === 'INR' ? 'en-IN' : 'en-US';
        const formatted = Math.abs(amount).toLocaleString(locale, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        return (amount < 0 ? '-' : '') + symbol + formatted;
    }

    /**
     * Format a date string (YYYY-MM-DD) for display.
     * @param {string} dateStr
     * @returns {string}
     */
    function formatDate(dateStr) {
        const [y, m, d] = dateStr.split('-');
        return `${parseInt(d)} ${T().MONTHS_SHORT[parseInt(m) - 1]} ${y}`;
    }

    /**
     * Format month string (YYYY-MM) for display.
     * @param {string} monthStr
     * @returns {string}
     */
    function formatMonth(monthStr) {
        const [y, m] = monthStr.split('-');
        return `${T().MONTHS_LONG[parseInt(m) - 1]} ${y}`;
    }

    /**
     * Escape a string for safe insertion into HTML via innerHTML.
     * Delegates to Validators.sanitizeHTML — single implementation, no duplication.
     * Use this for ALL user-supplied content rendered in templates.
     * @param {string} str
     * @returns {string}
     */
    function escapeHTML(str) {
        return V().sanitizeHTML(str);
    }

    /**
     * Apply theme to the document.
     * Moved here from SettingsService — DOM access belongs in the UI layer.
     * @param {string} mode - 'enabled' | 'disabled'
     */
    function applyTheme(mode) {
        document.documentElement.setAttribute('data-theme', mode === 'enabled' ? 'dark' : 'light');
    }

    // =====================================================================
    // Export
    // =====================================================================
    global.FCL = global.FCL || {};
    global.FCL.UI = global.FCL.UI || {};
    global.FCL.UI.Renderer = {
        updateUI,
        updateForMode,
        getActiveTab,
        showToast,
        formatCurrency,
        formatDate,
        formatMonth,
        escapeHTML,
        applyTheme,
    };

})(window);
