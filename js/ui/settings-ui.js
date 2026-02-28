/**
 * FinChronicleLedger — UI: Settings
 * Settings tab rendering, FAQ, backup status, export/import controls.
 */
(function (global) {
    'use strict';

    const State = () => global.FCL.State;
    const Types = () => global.FCL.Types;
    const Settings = () => global.FCL.SettingsService;
    const BackupService = () => global.FCL.BackupService;
    const ImportExport = () => global.FCL.ImportExportService;
    const FileIO = () => global.FCL.FileIO;
    const R = () => global.FCL.UI.Renderer;
    const Modals = () => global.FCL.UI.Modals;

    // =====================================================================
    // Render
    // =====================================================================

    function render() {
        const container = document.getElementById('settings-container');
        if (!container) return;

        const mode = Settings().getUIMode();
        const darkMode = State().getSetting('darkMode') || 'disabled';
        const currency = Settings().getCurrency();
        const backupStatus = BackupService().getBackupStatus();

        container.innerHTML = `
            <!-- Interface Mode -->
            <div class="settings-section">
                <h3>Interface Mode</h3>
                <div class="mode-toggle">
                    <button class="mode-btn ${mode === 'simple' ? 'mode-btn--active' : ''}" id="mode-simple">Simple</button>
                    <button class="mode-btn ${mode === 'advanced' ? 'mode-btn--active' : ''}" id="mode-advanced">Advanced</button>
                </div>
                <p class="text-muted">Simple Mode shows familiar categories. Advanced Mode shows accounts, debits & credits.</p>
            </div>

            <!-- Theme -->
            <div class="settings-section">
                <h3>Appearance</h3>
                <div class="setting-row">
                    <span>Dark Mode</span>
                    <button class="btn btn--small" id="dark-mode-toggle">
                        ${darkMode === 'enabled' ? '☀ Light' : '🌙 Dark'}
                    </button>
                </div>
            </div>

            <!-- Currency -->
            <div class="settings-section">
                <h3>Currency</h3>
                <div class="setting-row">
                    <span>Current: <strong>${Settings().getCurrencySymbol()} ${currency}</strong></span>
                    <button class="btn btn--small" id="change-currency">Change</button>
                </div>
            </div>

            <!-- Data -->
            <div class="settings-section">
                <h3>Data</h3>
                <div class="settings-buttons">
                    <button class="btn btn--secondary btn--full" id="export-csv">
                        <i class="ri-download-line"></i> Export CSV
                    </button>
                    <button class="btn btn--secondary btn--full" id="create-backup">
                        <i class="ri-save-line"></i> Create Full Backup (JSON)
                    </button>
                    <button class="btn btn--secondary btn--full" id="restore-backup">
                        <i class="ri-upload-line"></i> Restore from Backup
                    </button>
                </div>
                <input type="file" id="restore-file-input" accept=".json" style="display:none">
            </div>

            <!-- Backup Status -->
            <div class="settings-section">
                <h3>Backup Status</h3>
                ${backupStatus.lastBackup
                    ? `<p>Last backup: <strong>${new Date(backupStatus.lastBackup).toLocaleDateString()}</strong> (${backupStatus.daysSince} days ago)</p>`
                    : '<p class="text-warning">No backup created yet. Please backup your data regularly.</p>'
                }
                ${backupStatus.reminderDue ? '<p class="text-warning">⚠ Backup recommended — it\'s been a while!</p>' : ''}
            </div>

            <!-- About -->
            <div class="settings-section">
                <h3>About</h3>
                <p>${Types().APP_NAME} v${Types().APP_VERSION}</p>
                <p class="text-muted">A privacy-first, offline personal finance tracker with double-entry accounting.</p>
            </div>

            <!-- FAQ -->
            <div class="settings-section">
                <h3>FAQ</h3>
                <details class="faq-item">
                    <summary>Where is my data stored?</summary>
                    <p>All data is stored locally on your device using IndexedDB. Nothing is sent to any server.</p>
                </details>
                <details class="faq-item">
                    <summary>What is double-entry accounting?</summary>
                    <p>Every transaction records both where money comes from and where it goes. This ensures your books always balance.</p>
                </details>
                <details class="faq-item">
                    <summary>What's the difference between Simple and Advanced Mode?</summary>
                    <p>Simple Mode hides accounting details — you just pick a category and amount. Advanced Mode shows the full journal entry with debits and credits. Both use the same data.</p>
                </details>
                <details class="faq-item">
                    <summary>How do I backup my data?</summary>
                    <p>Go to Settings → Create Full Backup. This downloads a JSON file you can restore later.</p>
                </details>
            </div>
        `;

        _bindSettingsEvents();
    }

    // =====================================================================
    // Event Binding
    // =====================================================================

    function _bindSettingsEvents() {
        // Mode toggle
        const simpleBtn = document.getElementById('mode-simple');
        const advancedBtn = document.getElementById('mode-advanced');
        if (simpleBtn) simpleBtn.addEventListener('click', async () => {
            await Settings().setUIMode('simple');
            if (global.FCL.UI.Navigation) global.FCL.UI.Navigation.updateNav();
            R().updateUI();
        });
        if (advancedBtn) advancedBtn.addEventListener('click', async () => {
            await Settings().setUIMode('advanced');
            if (global.FCL.UI.Navigation) global.FCL.UI.Navigation.updateNav();
            R().updateUI();
        });

        // Dark mode
        const darkBtn = document.getElementById('dark-mode-toggle');
        if (darkBtn) darkBtn.addEventListener('click', async () => {
            await Settings().toggleDarkMode();
            render();
        });

        // Currency
        const currencyBtn = document.getElementById('change-currency');
        if (currencyBtn) currencyBtn.addEventListener('click', () => {
            Modals().showCurrencyPicker(Types().Currencies, Settings().getCurrency(), async (code) => {
                await Settings().setCurrency(code);
                R().updateUI();
            });
        });

        // Export CSV
        const exportBtn = document.getElementById('export-csv');
        if (exportBtn) exportBtn.addEventListener('click', () => {
            ImportExport().exportCSV();
            R().showToast('CSV exported!', 'success');
        });

        // Create backup
        const backupBtn = document.getElementById('create-backup');
        if (backupBtn) backupBtn.addEventListener('click', async () => {
            await ImportExport().createFullBackup();
            R().showToast('Backup created!', 'success');
            render(); // refresh backup status
        });

        // Restore
        const restoreBtn = document.getElementById('restore-backup');
        const fileInput = document.getElementById('restore-file-input');
        if (restoreBtn && fileInput) {
            restoreBtn.addEventListener('click', () => {
                Modals().showRestoreConfirm(() => fileInput.click());
            });

            fileInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                try {
                    // Create pre-restore backup first
                    await ImportExport().createFullBackup();

                    const text = await FileIO().readFile(file);
                    const result = await ImportExport().restoreFromBackup(text);

                    if (result.success) {
                        R().showToast(`Restored: ${result.stats.entries} entries, ${result.stats.accounts} accounts`, 'success');
                        R().updateUI();
                    } else {
                        R().showToast(result.errors[0] || 'Restore failed', 'error');
                    }
                } catch (err) {
                    R().showToast('Restore failed: ' + err.message, 'error');
                }

                fileInput.value = ''; // Reset
            });
        }
    }

    // =====================================================================
    // Export
    // =====================================================================
    global.FCL = global.FCL || {};
    global.FCL.UI = global.FCL.UI || {};
    global.FCL.UI.SettingsUI = { render };

})(window);
