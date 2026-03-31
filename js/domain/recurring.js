/**
 * FinChronicleLedger — Domain: Recurring
 * Pure functions for recurring transaction scheduling.
 * No I/O, no DOM access.
 */
(function (global) {
    'use strict';

    const V = () => global.FCL.Validators;

    // =====================================================================
    // Frequency Constants
    // =====================================================================

    const Frequency = Object.freeze({
        DAILY: 'daily',
        WEEKLY: 'weekly',
        MONTHLY: 'monthly',
        QUARTERLY: 'quarterly',
        YEARLY: 'yearly',
    });

    const FREQUENCY_LABELS = Object.freeze({
        daily: 'Daily',
        weekly: 'Weekly',
        monthly: 'Monthly',
        quarterly: 'Quarterly',
        yearly: 'Yearly',
    });

    // =====================================================================
    // Date Calculation
    // =====================================================================

    /**
     * Advance a date by one frequency interval.
     * @param {string} dateStr - YYYY-MM-DD
     * @param {string} frequency - daily|weekly|monthly|quarterly|yearly
     * @param {number} interval - every N periods (default 1)
     * @returns {string} YYYY-MM-DD
     */
    function advanceDate(dateStr, frequency, interval) {
        interval = interval || 1;
        var parts = dateStr.split('-');
        var d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));

        switch (frequency) {
            case Frequency.DAILY:
                d.setDate(d.getDate() + interval);
                break;
            case Frequency.WEEKLY:
                d.setDate(d.getDate() + (7 * interval));
                break;
            case Frequency.MONTHLY:
                d.setMonth(d.getMonth() + interval);
                break;
            case Frequency.QUARTERLY:
                d.setMonth(d.getMonth() + (3 * interval));
                break;
            case Frequency.YEARLY:
                d.setFullYear(d.getFullYear() + interval);
                break;
        }

        return _formatDate(d);
    }

    /**
     * Get all missed due dates between template.nextDueDate and today (inclusive).
     * Respects endDate if set.
     * @param {Object} template
     * @param {Date} today
     * @returns {string[]} Array of YYYY-MM-DD strings
     */
    function getMissedDueDates(template, today) {
        var dueDates = [];
        var current = template.nextDueDate;
        var todayStr = _formatDate(today);

        if (!current) return dueDates;

        // Safety limit to prevent infinite loops
        var maxIterations = 366;
        var count = 0;

        while (current <= todayStr && count < maxIterations) {
            // Respect endDate
            if (template.endDate && current > template.endDate) break;

            dueDates.push(current);
            current = advanceDate(current, template.frequency, template.interval || 1);
            count++;
        }

        return dueDates;
    }

    /**
     * Get the next future due date for a template (after today).
     * @param {Object} template
     * @param {Date} today
     * @returns {string|null} YYYY-MM-DD or null if past endDate
     */
    function getNextFutureDueDate(template, today) {
        var current = template.nextDueDate;
        var todayStr = _formatDate(today);
        var maxIterations = 366;
        var count = 0;

        while (current <= todayStr && count < maxIterations) {
            current = advanceDate(current, template.frequency, template.interval || 1);
            count++;
        }

        if (template.endDate && current > template.endDate) return null;
        return current;
    }

    /**
     * Get upcoming due dates within the next N days for a template.
     * @param {Object} template
     * @param {number} daysAhead
     * @param {Date} today
     * @returns {string[]} Array of YYYY-MM-DD strings
     */
    function getUpcomingDueDates(template, daysAhead, today) {
        var upcoming = [];
        var futureLimit = new Date(today);
        futureLimit.setDate(futureLimit.getDate() + daysAhead);
        var limitStr = _formatDate(futureLimit);
        var todayStr = _formatDate(today);

        var current = template.nextDueDate;
        if (!current) return upcoming;

        // Fast-forward past today first
        var maxIterations = 366;
        var count = 0;
        while (current < todayStr && count < maxIterations) {
            current = advanceDate(current, template.frequency, template.interval || 1);
            count++;
        }

        // Collect dates within range
        count = 0;
        while (current <= limitStr && count < maxIterations) {
            if (template.endDate && current > template.endDate) break;
            upcoming.push(current);
            current = advanceDate(current, template.frequency, template.interval || 1);
            count++;
        }

        return upcoming;
    }

    /**
     * Create a recurring template object.
     * @param {Object} params
     * @returns {Object}
     */
    function createTemplate(params) {
        var now = new Date().toISOString();
        return {
            id: V().generateId(),
            name: V().sanitizeHTML(params.name || ''),
            type: params.type,
            amount: params.amount,
            categoryAccountId: params.categoryAccountId || null,
            assetAccountId: params.assetAccountId || null,
            fromAccountId: params.fromAccountId || null,
            toAccountId: params.toAccountId || null,
            frequency: params.frequency,
            interval: params.interval || 1,
            startDate: params.startDate,
            endDate: params.endDate || null,
            nextDueDate: params.startDate,
            autoCreate: params.autoCreate !== false,
            daysAhead: params.daysAhead || 0,
            notes: V().sanitizeHTML(params.notes || ''),
            isActive: true,
            createdAt: now,
            updatedAt: now,
        };
    }

    /**
     * Create a recurring history record.
     * @param {Object} params
     * @returns {Object}
     */
    function createHistoryRecord(params) {
        return {
            id: V().generateId(),
            templateId: params.templateId,
            dueDate: params.dueDate,
            createdDate: _formatDate(new Date()),
            transactionId: params.transactionId || null,
            status: params.status,
            createdAt: new Date().toISOString(),
        };
    }

    /**
     * Validate a recurring template.
     * @param {Object} template
     * @returns {{ valid: boolean, errors: string[] }}
     */
    function validateTemplate(template) {
        var errors = [];

        if (!template.name || !template.name.trim()) {
            errors.push('Template name is required');
        }
        if (!template.type || !['income', 'expense', 'transfer'].includes(template.type)) {
            errors.push('Invalid transaction type');
        }
        if (!template.amount || template.amount <= 0) {
            errors.push('Amount must be greater than 0');
        }
        if (!template.frequency || !Object.values(Frequency).includes(template.frequency)) {
            errors.push('Invalid frequency');
        }
        if (!template.startDate) {
            errors.push('Start date is required');
        }
        if (template.endDate && template.endDate < template.startDate) {
            errors.push('End date must be after start date');
        }
        if (template.type !== 'transfer' && !template.categoryAccountId) {
            errors.push('Category account is required');
        }
        if (template.type === 'transfer' && (!template.fromAccountId || !template.toAccountId)) {
            errors.push('Both from and to accounts are required for transfers');
        }

        return { valid: errors.length === 0, errors: errors };
    }

    // =====================================================================
    // Helpers
    // =====================================================================

    function _formatDate(d) {
        var y = d.getFullYear();
        var m = String(d.getMonth() + 1).padStart(2, '0');
        var day = String(d.getDate()).padStart(2, '0');
        return y + '-' + m + '-' + day;
    }

    // =====================================================================
    // Export
    // =====================================================================
    global.FCL = global.FCL || {};
    global.FCL.Recurring = {
        Frequency: Frequency,
        FREQUENCY_LABELS: FREQUENCY_LABELS,
        advanceDate: advanceDate,
        getMissedDueDates: getMissedDueDates,
        getNextFutureDueDate: getNextFutureDueDate,
        getUpcomingDueDates: getUpcomingDueDates,
        createTemplate: createTemplate,
        createHistoryRecord: createHistoryRecord,
        validateTemplate: validateTemplate,
    };

})(window);
