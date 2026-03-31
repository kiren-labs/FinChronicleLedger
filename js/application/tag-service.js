/**
 * FinChronicleLedger — Application: Tag Service
 * Tag CRUD, usage counts, tag-based reports.
 */
(function (global) {
    'use strict';

    const DB = () => global.FCL.DB;
    const State = () => global.FCL.State;
    const Validators = () => global.FCL.Validators;
    const Ledger = () => global.FCL.Ledger;

    // Predefined color palette (safe CSS colors)
    var TAG_COLORS = [
        '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
        '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#14B8A6',
    ];

    var _colorIndex = 0;

    // =====================================================================
    // Initialization
    // =====================================================================

    async function loadAll() {
        var tags = await DB().getAllTags();
        State().setTags(tags);
    }

    // =====================================================================
    // Queries
    // =====================================================================

    function getAllTags() {
        return State().getTags();
    }

    function getTagById(id) {
        return State().getTags().find(function (t) { return t.id === id; });
    }

    function getTagByName(name) {
        var lower = name.toLowerCase().replace(/^#/, '');
        return State().getTags().find(function (t) {
            return t.name.toLowerCase() === lower;
        });
    }

    function getTagUsage(tagId) {
        return State().getEntries().filter(function (e) {
            return e.tags && e.tags.indexOf(tagId) !== -1;
        }).length;
    }

    function getTagReport(month) {
        var entries = State().getEntries().filter(function (e) {
            return e.date.startsWith(month);
        });
        return State().getTags().map(function (tag) {
            var tagEntries = entries.filter(function (e) {
                return e.tags && e.tags.indexOf(tag.id) !== -1;
            });
            var total = tagEntries.reduce(function (sum, e) {
                return sum + Ledger().getEntryTotal(e);
            }, 0);
            return { tag: tag, total: total, count: tagEntries.length };
        }).filter(function (r) {
            return r.count > 0;
        }).sort(function (a, b) {
            return b.total - a.total;
        });
    }

    // =====================================================================
    // Mutations
    // =====================================================================

    async function createTag(name, color) {
        var cleanName = (name || '').trim().replace(/^#/, '');
        if (cleanName.length < 2 || cleanName.length > 30) {
            return { success: false, errors: ['Tag name must be 2–30 characters'] };
        }
        if (!/^[a-zA-Z0-9\s\-]+$/.test(cleanName)) {
            return { success: false, errors: ['Tag name may only contain letters, numbers, spaces, and hyphens'] };
        }
        if (getTagByName(cleanName)) {
            return { success: false, errors: ['A tag with this name already exists'] };
        }

        var tagColor = color || TAG_COLORS[_colorIndex % TAG_COLORS.length];
        _colorIndex++;

        var tag = {
            id: Validators().generateId(),
            name: cleanName,
            displayName: '#' + cleanName,
            color: tagColor,
            createdAt: new Date().toISOString(),
        };

        await DB().saveTag(tag);
        State().addTag(tag);
        return { success: true, tag: tag };
    }

    async function updateTag(id, updates) {
        var tag = getTagById(id);
        if (!tag) return { success: false, errors: ['Tag not found'] };

        var updated = Object.assign({}, tag);
        if (updates.name != null) {
            var cleanName = updates.name.trim().replace(/^#/, '');
            if (cleanName.length < 2 || cleanName.length > 30) {
                return { success: false, errors: ['Tag name must be 2–30 characters'] };
            }
            var existing = getTagByName(cleanName);
            if (existing && existing.id !== id) {
                return { success: false, errors: ['A tag with this name already exists'] };
            }
            updated.name = cleanName;
            updated.displayName = '#' + cleanName;
        }
        if (updates.color) {
            updated.color = updates.color;
        }

        await DB().saveTag(updated);
        State().updateTag(updated);
        return { success: true, tag: updated };
    }

    async function deleteTag(id) {
        var tag = getTagById(id);
        if (!tag) return { success: false, errors: ['Tag not found'] };

        // Remove tag from all entries that reference it
        var entries = State().getEntries();
        for (var i = 0; i < entries.length; i++) {
            var e = entries[i];
            if (e.tags && e.tags.indexOf(id) !== -1) {
                e.tags = e.tags.filter(function (t) { return t !== id; });
                await DB().saveJournalEntry(e);
                State().updateEntry(e);
            }
        }

        await DB().deleteTag(id);
        State().removeTag(id);
        return { success: true };
    }

    async function addTagToEntry(entryId, tagId) {
        var entry = State().getEntryById(entryId);
        if (!entry) return { success: false, errors: ['Entry not found'] };
        if (!getTagById(tagId)) return { success: false, errors: ['Tag not found'] };

        if (!entry.tags) entry.tags = [];
        if (entry.tags.indexOf(tagId) !== -1) return { success: true }; // already tagged

        entry.tags.push(tagId);
        entry.updatedAt = new Date().toISOString();
        await DB().saveJournalEntry(entry);
        State().updateEntry(entry);
        return { success: true };
    }

    async function removeTagFromEntry(entryId, tagId) {
        var entry = State().getEntryById(entryId);
        if (!entry || !entry.tags) return { success: false, errors: ['Entry not found'] };

        entry.tags = entry.tags.filter(function (t) { return t !== tagId; });
        entry.updatedAt = new Date().toISOString();
        await DB().saveJournalEntry(entry);
        State().updateEntry(entry);
        return { success: true };
    }

    async function setEntryTags(entryId, tagIds) {
        var entry = State().getEntryById(entryId);
        if (!entry) return { success: false, errors: ['Entry not found'] };

        entry.tags = tagIds || [];
        entry.updatedAt = new Date().toISOString();
        await DB().saveJournalEntry(entry);
        State().updateEntry(entry);
        return { success: true };
    }

    // =====================================================================
    // Export
    // =====================================================================
    global.FCL = global.FCL || {};
    global.FCL.TagService = {
        loadAll: loadAll,
        getAllTags: getAllTags,
        getTagById: getTagById,
        getTagByName: getTagByName,
        getTagUsage: getTagUsage,
        getTagReport: getTagReport,
        createTag: createTag,
        updateTag: updateTag,
        deleteTag: deleteTag,
        addTagToEntry: addTagToEntry,
        removeTagFromEntry: removeTagFromEntry,
        setEntryTags: setEntryTags,
        TAG_COLORS: TAG_COLORS,
    };

})(window);
