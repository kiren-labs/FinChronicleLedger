/**
 * FinChronicleLedger — Entry Point
 * 
 * Responsibilities:
 * 1. Initialize IndexedDB
 * 2. Seed accounts (first run)
 * 3. Load all data into memory (State)
 * 4. Load preferences (theme, currency, mode)
 * 5. Check app version
 * 6. Register Service Worker
 * 7. Subscribe State → UI re-render
 * 8. Initialize navigation
 * 9. Trigger first render
 *
 * Does NOT contain business logic or rendering logic.
 */
(function (global) {
    'use strict';

    const DB = () => global.FCL.DB;
    const State = () => global.FCL.State;
    const AccountService = () => global.FCL.AccountService;
    const SettingsService = () => global.FCL.SettingsService;
    const BackupService = () => global.FCL.BackupService;
    const Renderer = () => global.FCL.UI.Renderer;
    const Navigation = () => global.FCL.UI.Navigation;
    const Types = () => global.FCL.Types;

    /**
     * Main initialization sequence
     */
    async function init() {
        try {
            console.log('[FCL] Initializing FinChronicleLedger...');

            // 1. Initialize IndexedDB
            await DB().initDB();
            console.log('[FCL] Database initialized');

            // 2. Seed default accounts on first run
            await AccountService().seedDefaultAccounts();
            console.log('[FCL] Accounts ready');

            // 3. Load all data into State
            const accounts = await DB().getAllAccounts();
            const entries = await DB().getAllJournalEntries();
            State().setAccounts(accounts);
            State().setEntries(entries);
            console.log(`[FCL] Loaded ${accounts.length} accounts, ${entries.length} entries`);

            // 4. Load settings (currency, theme, mode, etc.)
            await SettingsService().loadSettings();
            console.log('[FCL] Settings loaded');

            // 5. Apply theme
            SettingsService().applyTheme();

            // 6. Apply UI mode
            const mode = SettingsService().getUIMode();
            document.documentElement.setAttribute('data-mode', mode);

            // 7. Check version
            await SettingsService().checkVersion();

            // 8. Subscribe State changes → UI re-render
            State().subscribe(() => {
                Renderer().updateUI();
            });

            // 9. Initialize navigation (tab switching, bottom nav)
            Navigation().init();

            // 10. Update UI mode visibility
            Renderer().updateForMode(mode);

            // 11. Trigger first render
            Renderer().updateUI();
            console.log('[FCL] First render complete');

            // 12. Register Service Worker
            registerServiceWorker();

            // 13. Check backup reminder
            const backupStatus = BackupService().getBackupStatus();
            if (backupStatus.reminderDue) {
                setTimeout(() => {
                    Renderer().showToast('Backup reminder: It\'s been ' + backupStatus.daysSince + ' days since your last backup.', 'info');
                }, 2000);
            }

            // 14. Check iOS install prompt
            checkInstallPrompt();

            console.log('[FCL] FinChronicleLedger v' + Types().APP_VERSION + ' ready');

        } catch (err) {
            console.error('[FCL] Initialization failed:', err);
            const toast = document.getElementById('toast');
            if (toast) {
                toast.textContent = 'Failed to initialize app. Please refresh.';
                toast.className = 'toast error show';
            }
        }
    }

    /**
     * Register Service Worker for offline support
     */
    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js')
                .then(function (reg) {
                    console.log('[FCL] Service Worker registered:', reg.scope);

                    // Listen for updates
                    reg.addEventListener('updatefound', function () {
                        const newWorker = reg.installing;
                        if (newWorker) {
                            newWorker.addEventListener('statechange', function () {
                                if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
                                    console.log('[FCL] New Service Worker activated — update available');
                                    Renderer().showToast('Update available! Reload for the latest version.', 'info');
                                }
                            });
                        }
                    });
                })
                .catch(function (err) {
                    console.warn('[FCL] Service Worker registration failed:', err);
                });
        }
    }

    /**
     * Check if iOS install prompt should be shown
     */
    function checkInstallPrompt() {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches
            || window.navigator.standalone === true;

        if (isIOS && !isStandalone && !SettingsService().isInstallPromptHidden()) {
            const prompt = document.getElementById('installPrompt');
            if (prompt) {
                prompt.classList.add('show');
            }
        }
    }

    // Start the app when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})(window);
