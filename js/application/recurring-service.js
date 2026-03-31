/**
 * FinChronicleLedger — Application: Recurring Service
 * Template CRUD, on-startup processing (backfill missed entries),
 * and upcoming transaction queries.
 */
(function (global) {
    'use strict';

    const DB = () => global.FCL.DB;
    const State = () => global.FCL.State;
    const Recurring = () => global.FCL.Recurring;
    const Ledger = () => global.FCL.Ledger;
    const Validators = () => global.FCL.Validators;
    const TransactionService = () => global.FCL.TransactionService;
    const AccountService = () => global.FCL.AccountService;

    /** In-memory template + history cache */
    let _templates = [];
    let _history = [];

    // =====================================================================
    // Load
    // =====================================================================

    /**
     * Load all recurring data into memory from IndexedDB.
     * Called once during app init.
     */
    async function loadAll() {
        _templates = await DB().getAllRecurringTemplates();
        _history = await DB().getAllRecurringHistory();
    }

    function getTemplates() { return _templates; }
    function getActiveTemplates() { return _templates.filter(function (t) { return t.isActive; }); }
    function getHistory() { return _history; }

    function getTemplateById(id) {
        return _templates.find(function (t) { return t.id === id; });
    }

    // =====================================================================
    // CRUD
    // =====================================================================

    /**
     * Create a new recurring template.
     * @param {Object} params
     * @returns {Promise<{success: boolean, template?: Object, errors?: string[]}>}
     */
    async function createTemplate(params) {
        var template = Recurring().createTemplate(params);
        var validation = Recurring().validateTemplate(template);
        if (!validation.valid) return { success: false, errors: validation.errors };

        await DB().saveRecurringTemplate(template);
        _templates.push(template);

        return { success: true, template: template };
    }

    /**
     * Update an existing template.
     * @param {string} id
     * @param {Object} updates
     * @returns {Promise<{success: boolean, errors?: string[]}>}
     */
    async function updateTemplate(id, updates) {
        var idx = _templates.findIndex(function (t) { return t.id === id; });
        if (idx === -1) return { success: false, errors: ['Template not found'] };

        var template = Object.assign({}, _templates[idx], updates);
        template.updatedAt = new Date().toISOString();

        var validation = Recurring().validateTemplate(template);
        if (!validation.valid) return { success: false, errors: validation.errors };

        await DB().saveRecurringTemplate(template);
        _templates[idx] = template;

        return { success: true };
    }

    /**
     * Pause or resume a template.
     * @param {string} id
     * @param {boolean} isActive
     */
    async function toggleTemplate(id, isActive) {
        var idx = _templates.findIndex(function (t) { return t.id === id; });
        if (idx === -1) return;

        var template = Object.assign({}, _templates[idx]);
        template.isActive = isActive;
        template.updatedAt = new Date().toISOString();

        await DB().saveRecurringTemplate(template);
        _templates[idx] = template;
    }

    /**
     * Delete a template and its history.
     * @param {string} id
     */
    async function deleteTemplate(id) {
        await DB().deleteRecurringTemplate(id);
        _templates = _templates.filter(function (t) { return t.id !== id; });
        _history = _history.filter(function (h) { return h.templateId !== id; });
    }

    // =====================================================================
    // Process Upcoming (called on every app open)
    // =====================================================================

    /**
     * Process all active templates: backfill missed auto-create entries,
     * queue pending reminders, and advance nextDueDate.
     * @returns {Promise<{created: number, reminded: number}>}
     */
    async function processUpcoming() {
        var today = new Date();
        var created = 0;
        var reminded = 0;

        var active = getActiveTemplates();

        for (var i = 0; i < active.length; i++) {
            var template = active[i];
            var dueDates = Recurring().getMissedDueDates(template, today);

            for (var j = 0; j < dueDates.length; j++) {
                var dueDate = dueDates[j];

                // Check if already processed
                var alreadyProcessed = _history.some(function (h) {
                    return h.templateId === template.id && h.dueDate === dueDate;
                });
                if (alreadyProcessed) continue;

                if (template.autoCreate) {
                    // Auto-create the transaction
                    var result;
                    try {
                        result = await _createTransactionFromTemplate(template, dueDate);
                    } catch (err) {
                        console.error('[FCL] Recurring auto-create failed for template', template.id, err);
                        result = { success: false };
                    }
                    var historyRecord = Recurring().createHistoryRecord({
                        templateId: template.id,
                        dueDate: dueDate,
                        transactionId: result.success ? result.entry.id : null,
                        status: result.success ? 'created' : 'skipped',
                    });
                    await DB().saveRecurringHistory(historyRecord);
                    _history.push(historyRecord);
                    if (result.success) created++;
                } else {
                    // Queue as pending reminder
                    var reminderRecord = Recurring().createHistoryRecord({
                        templateId: template.id,
                        dueDate: dueDate,
                        transactionId: null,
                        status: 'pending',
                    });
                    await DB().saveRecurringHistory(reminderRecord);
                    _history.push(reminderRecord);
                    reminded++;
                }
            }

            // Advance nextDueDate
            var nextDate = Recurring().getNextFutureDueDate(template, today);
            if (nextDate !== template.nextDueDate) {
                var tplIdx = _templates.findIndex(function (t) { return t.id === template.id; });
                if (tplIdx !== -1) {
                    var updated = Object.assign({}, _templates[tplIdx]);
                    updated.nextDueDate = nextDate;
                    updated.updatedAt = new Date().toISOString();
                    await DB().saveRecurringTemplate(updated);
                    _templates[tplIdx] = updated;
                }
            }
        }

        return { created: created, reminded: reminded };
    }

    /**
     * Skip a pending reminder for a template on a specific due date.
     * @param {string} templateId
     * @param {string} dueDate
     */
    async function skipPending(templateId, dueDate) {
        var record = _history.find(function (h) {
            return h.templateId === templateId && h.dueDate === dueDate && h.status === 'pending';
        });
        if (!record) return;

        var updated = Object.assign({}, record, { status: 'skipped' });
        await DB().saveRecurringHistory(updated);
        var idx = _history.indexOf(record);
        if (idx !== -1) _history[idx] = updated;
    }

    /**
     * Confirm a pending reminder — create the transaction.
     * @param {string} templateId
     * @param {string} dueDate
     */
    async function confirmPending(templateId, dueDate) {
        var template = getTemplateById(templateId);
        if (!template) return;

        var record = _history.find(function (h) {
            return h.templateId === templateId && h.dueDate === dueDate && h.status === 'pending';
        });
        if (!record) return;

        var result = await _createTransactionFromTemplate(template, dueDate);
        var updated = Object.assign({}, record, {
            status: result.success ? 'created' : 'skipped',
            transactionId: result.success ? result.entry.id : null,
        });
        await DB().saveRecurringHistory(updated);
        var idx = _history.indexOf(record);
        if (idx !== -1) _history[idx] = updated;
    }

    // =====================================================================
    // Queries
    // =====================================================================

    /**
     * Get upcoming recurring transactions for the next N days.
     * @param {number} [days=7]
     * @returns {Array<{template: Object, dueDate: string}>}
     */
    function getUpcoming(days) {
        days = days || 7;
        var today = new Date();
        var results = [];

        var active = getActiveTemplates();
        for (var i = 0; i < active.length; i++) {
            var dates = Recurring().getUpcomingDueDates(active[i], days, today);
            for (var j = 0; j < dates.length; j++) {
                results.push({ template: active[i], dueDate: dates[j] });
            }
        }

        results.sort(function (a, b) { return a.dueDate.localeCompare(b.dueDate); });
        return results;
    }

    /**
     * Get pending reminders (not yet confirmed or skipped).
     * @returns {Array<{template: Object, record: Object}>}
     */
    function getPendingReminders() {
        var pending = _history.filter(function (h) { return h.status === 'pending'; });
        return pending.map(function (record) {
            return {
                template: getTemplateById(record.templateId),
                record: record,
            };
        }).filter(function (item) { return item.template; });
    }

    // =====================================================================
    // Internal Helpers
    // =====================================================================

    /**
     * Build and persist a transaction from a recurring template.
     */
    async function _createTransactionFromTemplate(template, dueDate) {
        if (template.type === 'transfer') {
            return TransactionService().createTransfer({
                amount: template.amount,
                fromAccountId: template.fromAccountId,
                toAccountId: template.toAccountId,
                date: dueDate,
                notes: template.notes || template.name,
            });
        }

        return TransactionService().createSimpleTransaction({
            type: template.type,
            amount: template.amount,
            categoryAccountId: template.categoryAccountId,
            assetAccountId: template.assetAccountId || AccountService().getDefaultAssetAccount().id,
            date: dueDate,
            notes: template.notes || template.name,
        });
    }

    // =====================================================================
    // Export
    // =====================================================================
    global.FCL = global.FCL || {};
    global.FCL.RecurringService = {
        loadAll: loadAll,
        getTemplates: getTemplates,
        getActiveTemplates: getActiveTemplates,
        getHistory: getHistory,
        getTemplateById: getTemplateById,
        createTemplate: createTemplate,
        updateTemplate: updateTemplate,
        toggleTemplate: toggleTemplate,
        deleteTemplate: deleteTemplate,
        processUpcoming: processUpcoming,
        skipPending: skipPending,
        confirmPending: confirmPending,
        getUpcoming: getUpcoming,
        getPendingReminders: getPendingReminders,
    };

})(window);
