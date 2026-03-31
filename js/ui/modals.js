/**
 * FinChronicleLedger — UI: Modals
 * Delete confirmation, restore confirmation, currency picker, migration wizard.
 */
(function (global) {
    'use strict';

    const TransactionService = () => global.FCL.TransactionService;
    const ImportExport = () => global.FCL.ImportExportService;
    const R = () => global.FCL.UI.Renderer;

    // =====================================================================
    // Generic Modal
    // =====================================================================

    function showModal(contentHTML) {
        // Remove existing
        closeModal();

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.id = 'modal-overlay';

        overlay.innerHTML = `
            <div class="modal">
                <button class="modal-close" id="modal-close-btn" aria-label="Close">
                    <i class="ri-close-line"></i>
                </button>
                <div class="modal-content">${contentHTML}</div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });
        document.getElementById('modal-close-btn').addEventListener('click', closeModal);

        // Close on Escape
        const escHandler = (e) => {
            if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', escHandler); }
        };
        document.addEventListener('keydown', escHandler);
    }

    function closeModal() {
        const overlay = document.getElementById('modal-overlay');
        if (overlay) overlay.remove();
    }

    // =====================================================================
    // Delete Confirmation
    // =====================================================================

    function showDeleteConfirm(entryId) {
        showModal(`
            <h3>Delete Transaction</h3>
            <p>Are you sure you want to delete this transaction?</p>
            <p class="text-muted">You'll have 8 seconds to undo after deletion.</p>
            <div class="modal-actions">
                <button class="btn btn--secondary" id="modal-cancel">Cancel</button>
                <button class="btn btn--danger" id="modal-confirm-delete">Delete</button>
            </div>
        `);

        document.getElementById('modal-cancel').addEventListener('click', closeModal);
        document.getElementById('modal-confirm-delete').addEventListener('click', async () => {
            closeModal();
            await TransactionService().deleteTransaction(entryId);
        });
    }

    // =====================================================================
    // Restore Confirmation
    // =====================================================================

    function showRestoreConfirm(onConfirm) {
        showModal(`
            <h3>Restore Backup</h3>
            <p>Choose a restore strategy:</p>
            <div class="restore-strategies">
                <button class="btn btn--secondary btn--full restore-strategy-btn" id="restore-replace">
                    <strong>Replace All</strong>
                    <span class="text-muted">Delete all current data and replace with backup</span>
                </button>
                <button class="btn btn--secondary btn--full restore-strategy-btn" id="restore-merge">
                    <strong>Merge</strong>
                    <span class="text-muted">Keep existing data and add only new entries from backup</span>
                </button>
            </div>
            <div class="modal-actions">
                <button class="btn btn--secondary" id="modal-cancel">Cancel</button>
            </div>
        `);

        document.getElementById('modal-cancel').addEventListener('click', closeModal);
        document.getElementById('restore-replace').addEventListener('click', () => {
            closeModal();
            if (onConfirm) onConfirm('replace');
        });
        document.getElementById('restore-merge').addEventListener('click', () => {
            closeModal();
            if (onConfirm) onConfirm('merge');
        });
    }

    /**
     * Show merge preview with stats before applying.
     */
    function showMergePreview(preview, onConfirm) {
        showModal(`
            <h3>Merge Preview</h3>
            <div class="merge-preview-stats">
                <p><strong>${preview.newEntries}</strong> new transaction${preview.newEntries !== 1 ? 's' : ''} will be added</p>
                <p><strong>${preview.duplicateEntries}</strong> duplicate${preview.duplicateEntries !== 1 ? 's' : ''} will be skipped</p>
                ${preview.newAccounts > 0 ? `<p><strong>${preview.newAccounts}</strong> new account${preview.newAccounts !== 1 ? 's' : ''} will be added</p>` : ''}
                ${preview.newTags > 0 ? `<p><strong>${preview.newTags}</strong> new tag${preview.newTags !== 1 ? 's' : ''} will be added</p>` : ''}
            </div>
            <p class="text-muted">Your existing data will not be modified.</p>
            <div class="modal-actions">
                <button class="btn btn--secondary" id="modal-cancel">Cancel</button>
                <button class="btn btn--primary" id="modal-confirm-merge" ${preview.newEntries === 0 && preview.newAccounts === 0 ? 'disabled' : ''}>
                    ${preview.newEntries === 0 && preview.newAccounts === 0 ? 'Nothing to Merge' : 'Merge Now'}
                </button>
            </div>
        `);

        document.getElementById('modal-cancel').addEventListener('click', closeModal);
        var confirmBtn = document.getElementById('modal-confirm-merge');
        if (confirmBtn && (preview.newEntries > 0 || preview.newAccounts > 0)) {
            confirmBtn.addEventListener('click', () => {
                closeModal();
                if (onConfirm) onConfirm();
            });
        }
    }

    // =====================================================================
    // Currency Picker
    // =====================================================================

    function showCurrencyPicker(currencies, currentCode, onSelect) {
        const options = Object.entries(currencies).map(([code, info]) => {
            const selected = code === currentCode ? 'currency-option--selected' : '';
            return `<button class="currency-option ${selected}" data-code="${code}">${info.symbol} ${code} — ${info.name}</button>`;
        }).join('');

        showModal(`
            <h3>Select Currency</h3>
            <div class="currency-list">${options}</div>
        `);

        document.querySelectorAll('.currency-option').forEach(btn => {
            btn.addEventListener('click', () => {
                closeModal();
                if (onSelect) onSelect(btn.dataset.code);
            });
        });
    }

    // =====================================================================
    // Export
    // =====================================================================
    global.FCL = global.FCL || {};
    global.FCL.UI = global.FCL.UI || {};
    global.FCL.UI.Modals = {
        showModal,
        closeModal,
        showDeleteConfirm,
        showRestoreConfirm,
        showMergePreview,
        showCurrencyPicker,
    };

})(window);
