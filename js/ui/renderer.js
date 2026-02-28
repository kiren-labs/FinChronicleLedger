/**
 * FinChronicleLedger — UI: Renderer
 * Master updateUI() and mode-aware sub-rendering coordination.
 */
(function (global) {
    'use strict';

    const State = () => global.FCL.State;
    const Settings = () => global.FCL.SettingsService;

    /**
     * Master UI refresh — called on every state change.
     * Delegates to sub-renderers.
     */
    function updateUI() {
        const mode = Settings().getUIMode();

        // Update mode-specific visibility
        updateForMode(mode);

        // Re-render active tab content
        const activeTab = getActiveTab();

        if (activeTab === 'add') {
            if (global.FCL.UI.Forms) global.FCL.UI.Forms.render(mode);
        } else if (activeTab === 'list') {
            if (global.FCL.UI.List) global.FCL.UI.List.render(mode);
        } else if (activeTab === 'groups') {
            if (global.FCL.UI.Groups) global.FCL.UI.Groups.render(mode);
        } else if (activeTab === 'reports') {
            if (global.FCL.UI.ReportsUI) global.FCL.UI.ReportsUI.render();
        } else if (activeTab === 'settings') {
            if (global.FCL.UI.SettingsUI) global.FCL.UI.SettingsUI.render();
        }

        // Always update summary if it's visible on the current tab
        if (activeTab === 'add' || activeTab === 'list') {
            if (global.FCL.UI.Summary) global.FCL.UI.Summary.render(mode);
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
     */
    function showToast(message, type) {
        type = type || 'success';
        const toast = document.getElementById('toast');
        if (!toast) return;

        toast.textContent = message;
        toast.className = 'toast toast--' + type + ' toast--visible';

        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => {
            toast.classList.remove('toast--visible');
        }, 2500);
    }

    /**
     * Format currency for display.
     * @param {number} amount
     * @returns {string}
     */
    function formatCurrency(amount) {
        const symbol = Settings().getCurrencySymbol();
        const formatted = Math.abs(amount).toLocaleString('en-IN', {
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
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
    }

    /**
     * Format month string (YYYY-MM) for display.
     * @param {string} monthStr
     * @returns {string}
     */
    function formatMonth(monthStr) {
        const [y, m] = monthStr.split('-');
        const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        return `${months[parseInt(m) - 1]} ${y}`;
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
    };

})(window);
