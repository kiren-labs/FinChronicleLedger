/**
 * FinChronicleLedger — UI: Navigation
 * Tab switching, bottom nav, mode toggle.
 */
(function (global) {
    'use strict';

    const Settings = () => global.FCL.SettingsService;
    const R = () => global.FCL.UI.Renderer;

    let _activeTab = 'add';

    // =====================================================================
    // Initialization
    // =====================================================================

    function init() {
        _bindNavEvents();
        switchTab('add');
    }

    // =====================================================================
    // Tab Switching
    // =====================================================================

    /**
     * Switch to a tab.
     * @param {string} tabName
     */
    function switchTab(tabName) {
        _activeTab = tabName;

        // Update tab content visibility
        document.querySelectorAll('.tab-content').forEach(el => {
            el.classList.toggle('active', el.dataset.tab === tabName);
        });

        // Update nav button active state
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Trigger re-render for the active tab
        R().updateUI();
    }

    function getActiveTab() {
        return _activeTab;
    }

    // =====================================================================
    // Event Binding
    // =====================================================================

    function _bindNavEvents() {
        // Bottom nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                switchTab(btn.dataset.tab);
            });
        });
    }

    // =====================================================================
    // Mode-aware nav rendering
    // =====================================================================

    /**
     * Update bottom nav visibility based on mode.
     * Advanced Mode shows a "Reports" tab.
     */
    function updateNav() {
        const mode = Settings().getUIMode();
        const reportsNav = document.querySelector('.nav-btn[data-tab="reports"]');
        if (reportsNav) {
            reportsNav.style.display = mode === 'advanced' ? '' : 'none';
        }
    }

    // =====================================================================
    // Export
    // =====================================================================
    global.FCL = global.FCL || {};
    global.FCL.UI = global.FCL.UI || {};
    global.FCL.UI.Navigation = {
        init,
        switchTab,
        getActiveTab,
        updateNav,
    };

})(window);
