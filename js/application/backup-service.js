/**
 * FinChronicleLedger — Application: Backup Service
 * Backup timestamp tracking and reminder logic.
 */
(function (global) {
    'use strict';

    const State = () => global.FCL.State;
    const DB = () => global.FCL.DB;

    const BACKUP_REMINDER_DAYS = 7;

    // =====================================================================
    // Backup Status
    // =====================================================================

    /**
     * Check if a backup reminder should be shown.
     * @returns {boolean}
     */
    function shouldShowBackupReminder() {
        const lastBackup = State().getSetting('last_backup_timestamp');
        if (!lastBackup) return true; // Never backed up

        const daysSince = (Date.now() - lastBackup) / (1000 * 60 * 60 * 24);
        return daysSince >= BACKUP_REMINDER_DAYS;
    }

    /**
     * Get backup status info.
     * @returns {{ lastBackup: number|null, daysSince: number|null, reminderDue: boolean }}
     */
    function getBackupStatus() {
        const lastBackup = State().getSetting('last_backup_timestamp');
        if (!lastBackup) {
            return { lastBackup: null, daysSince: null, reminderDue: true };
        }

        const daysSince = Math.floor((Date.now() - lastBackup) / (1000 * 60 * 60 * 24));
        return {
            lastBackup,
            daysSince,
            reminderDue: daysSince >= BACKUP_REMINDER_DAYS,
        };
    }

    /**
     * Record that a backup was just created.
     * @returns {Promise<void>}
     */
    async function recordBackup() {
        const ts = Date.now();
        await DB().setSetting('last_backup_timestamp', ts);
        State().setSetting('last_backup_timestamp', ts);
    }

    // =====================================================================
    // Export
    // =====================================================================
    global.FCL = global.FCL || {};
    global.FCL.BackupService = {
        shouldShowBackupReminder,
        getBackupStatus,
        recordBackup,
        BACKUP_REMINDER_DAYS,
    };

})(window);
