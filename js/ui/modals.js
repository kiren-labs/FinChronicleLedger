/**
 * FinChronicleLedger — UI: Modals
 * Delete confirmation, restore confirmation, currency picker, migration wizard.
 */
(function (global) {
    'use strict';

    const TransactionService = () => global.FCL.TransactionService;
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
            <p>Are you sure you want to delete this transaction? This cannot be undone.</p>
            <div class="modal-actions">
                <button class="btn btn--secondary" id="modal-cancel">Cancel</button>
                <button class="btn btn--danger" id="modal-confirm-delete">Delete</button>
            </div>
        `);

        document.getElementById('modal-cancel').addEventListener('click', closeModal);
        document.getElementById('modal-confirm-delete').addEventListener('click', async () => {
            const result = await TransactionService().deleteTransaction(entryId);
            closeModal();
            if (result.success) {
                R().showToast('Transaction deleted', 'success');
            } else {
                R().showToast(result.errors[0] || 'Delete failed', 'error');
            }
        });
    }

    // =====================================================================
    // Restore Confirmation
    // =====================================================================

    function showRestoreConfirm(onConfirm) {
        showModal(`
            <h3>Restore Backup</h3>
            <p>This will <strong>replace all current data</strong> with the backup. A backup of current data will be created first.</p>
            <p>Are you sure?</p>
            <div class="modal-actions">
                <button class="btn btn--secondary" id="modal-cancel">Cancel</button>
                <button class="btn btn--primary" id="modal-confirm-restore">Restore</button>
            </div>
        `);

        document.getElementById('modal-cancel').addEventListener('click', closeModal);
        document.getElementById('modal-confirm-restore').addEventListener('click', () => {
            closeModal();
            if (onConfirm) onConfirm();
        });
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
        showCurrencyPicker,
    };

})(window);
