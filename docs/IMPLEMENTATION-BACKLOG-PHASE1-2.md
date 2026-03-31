# FinChronicleLedger — Implementation Backlog (Phase 1 & 2)

**Generated from Feature Gap Analysis:** 2026-03-31  
**Alignment with Roadmap Version:** 1.1.0 → v1.2.0 and v1.2.0 → v1.3.0  
**Scope:** Evidence-based gap closure (FinChronicleLedger vs. finance-tracker)

---

## Overview

This document provides **sprint-ready implementation tasks** for Phase 1 (Quick Wins, 1-2 sprints) and Phase 2 (Productivity Core, 2-3 sprints) based on the feature-gap audit between FinChronicleLedger and finance-tracker.

**Alignment with Current Roadmap:**
- Phase 1 tickets complement v1.2.0 features (Recurring, Budget)
- Phase 2 tickets establish foundations for v1.2.0 - v1.3.0 transitions
- All tasks maintain offline-first and privacy-first principles

---

## Phase 1: Quick Wins (1-2 Sprints) — Target v1.2.0

### Rationale
Finance-tracker users benefit from lower friction in data ingestion and restore workflows. These tasks close gaps while maintaining FinChronicleLedger's restore integrity advantage.

---

### Phase 1, Task 1: CSV Import Service and UI

**Ticket ID:** FCL-001  
**Title:** Add CSV import service and settings UI for simple transactions  
**Status:** Not Started  
**Complexity:** S (Small)  
**Impact:** Medium (data ingestion friction reduction)  
**Dependencies:** None  
**Acceptance Criteria:**

1. ✅ New service `js/application/import-csv-service.js` created with:
   - Function `importCSVString(csvContent)` → returns `{ success, transactions[], errors[] }`
   - Support for header row detection and normalization (case-insensitive)
   - Reuse existing `sanitizeTransactionInput()` from `import-export-service.js`
   - Validation of required fields: `date`, `type` (income/expense/transfer), `amount`, `category`, optional `notes`
   - Error collection (invalid rows, missing fields, type mismatches) with row number context
   - Return preview of parsed transactions before insertion (no auto-commit)

2. ✅ Settings UI enhancement in `js/ui/settings-ui.js`:
   - Add new `<section class="import-csv">` in settings
   - File input `<input type="file" accept=".csv">` with label "Import CSV"
   - CSV format example/template display (downloadable or inline)
   - Preview table showing parsed transactions (date, type, amount, category)
   - Error summary if parsing fails (e.g., "Row 5: Invalid type 'transfer' — expected 'income', 'expense', or 'transfer'")
   - [Cancel] and [Import] buttons (Import disabled until valid preview)
   - Post-import feedback: "✓ Imported 10 transactions" or failure details

3. ✅ CSV format specification documented in CONTRIBUTING.md or README:
   - Header row required: `date,type,amount,category,notes`
   - Date format: `YYYY-MM-DD`
   - Type: `income` | `expense` | `transfer`
   - Amount: positive integer (cents)
   - Category: category name or account ID (validated against CoA)
   - Notes: optional text (sanitized)
   - Example CSV provided

4. ✅ Integration test:
   - Sample valid CSV (5 transactions) imported successfully
   - Sample invalid CSV (bad date, unknown type, missing amount) rejected with clear errors
   - Mixed valid/invalid rows: valid rows preview-ready, invalid rows flagged

**Test Plan:**
```
Test Case 1: Happy path — valid CSV import
  Input: 5-row CSV with valid transactions
  Expected: Preview shows 5 rows, [Import] enabled, all transactions insert cleanly

Test Case 2: Invalid date format
  Input: "2026/31/03" instead of "2026-03-31"
  Expected: Error flagged in preview, [Import] disabled, message: "Row X: Invalid date format"

Test Case 3: Unknown transfer — missing counterparty
  Input: type="transfer", amount=100, but no "to_account" field
  Expected: Error or request for manual mapping, preview blocked

Test Case 4: Large file (500+ rows)
  Input: 500-row CSV
  Expected: Import completes, performance acceptable (<2s), no hangs

Test Case 5: Duplicate detection (optional, Phase 1 only flags, doesn't dedup)
  Input: Identical rows in CSV
  Expected: Both import without error (dedup is Phase 2 restore feature)
```

**Implementation Notes:**
- Reuse `validateCategory()` and `validateType()` from `transaction-service.js`
- Do NOT make modifications to existing `import-export-service.js`; create separate service
- CSV parsing: Use built-in `String.split()` and simple state machine; avoid external CSV library for offline-first
- Sanitize all text fields using existing `sanitizeText()` from `import-export-service.js`

---

### Phase 1, Task 2: Merge Restore Mode with Duplicate Detection

**Ticket ID:** FCL-002  
**Title:** Implement merge restore strategy with duplicate detection  
**Status:** Not Started  
**Complexity:** M (Medium)  
**Impact:** Medium (restore UX and data safety)  
**Dependencies:** None  
**Acceptance Criteria:**

1. ✅ New service `js/application/restore-service.js` created to replace restore logic in `import-export-service.js`:
   - Function `restoreBackup(backupData, strategy)` where `strategy ∈ ['replace-all', 'merge']`
   - Strategy `replace-all`: existing behavior (clear DB, load backup)
   - Strategy `merge`: preserve current data, insert non-duplicates from backup only

2. ✅ Duplicate detection algorithm in `restore-service.js`:
   - Signature: `(date, type, category, amount, notes)` — case-insensitive, whitespace-normalized
   - Compare against all existing journal entries
   - Return duplicate count before merge
   - Transactions with matching signature NOT inserted (logged as "skipped: duplicate")
   - Non-matching transactions inserted cleanly

3. ✅ Restore UI workflow in `js/ui/modals.js`:
   - Add new restore strategy selection modal before backup file processed:
     - Radio option: "🔄 Replace all data (⚠ destructive)"
     - Radio option: "➕ Merge with existing data (preview duplicates first)"
   - If "merge" selected:
     - Parse backup → detect duplicates
     - Show preview: "X transactions to import, Y duplicates skipped"
     - List top 5 duplicate examples (date, type, amount, category)
     - Allow user to confirm or cancel
   - Post-merge feedback: "✓ Merged 25 transactions, skipped 3 duplicates"

4. ✅ Backward compatibility:
   - Existing backup formats (v3, v4) supported
   - Trial balance validation still runs post-restore for both strategies
   - Settings/accounts/category preserved correctly in merge mode

5. ✅ Unit tests for merge logic:
   - Merge with 0 duplicates: all transactions inserted
   - Merge with all duplicates: no transactions inserted
   - Merge with partial duplicates: valid ones inserted, duplicates skipped
   - Whitespace normalization: "Rent" vs " Rent " detected as duplicate
   - Case insensitivity: "income" vs "Income" duplicate match

**Test Plan:**
```
Test Case 1: Replace-all (existing behavior unchanged)
  Input: Backup JSON with 10 transactions, DB has 20 current transactions
  Strategy: replace-all
  Expected: DB cleared, 10 new transactions loaded, current 20 deleted

Test Case 2: Merge with no duplicates
  Input: Backup with 10 unique transactions, DB has 10 other transactions
  Strategy: merge
  Expected: DB now has 20 total transactions, none skipped

Test Case 3: Merge with all duplicates
  Input: Backup is identical to current DB
  Strategy: merge
  Expected: UI shows "10 duplicates skipped", DB unchanged (20 total)

Test Case 4: Merge with partial duplicates
  Input: Backup has 5 new, 5 duplicate (from current DB)
  Strategy: merge
  Expected: UI shows "5 duplicates skipped, 5 imported", DB has 25 total (was 10)

Test Case 5: Whitespace and case normalization
  Input: Backup " INCOME " 1000, DB has "income" 1000
  Strategy: merge
  Expected: Detected as duplicate, 1 skipped
```

**Implementation Notes:**
- Extract current duplicate-detection logic from merge/restore workflows
- Store restore strategy choice in temporary state (volatile, not persisted)
- Audit log: create `restore_history` entries for merge operations (timestamp, strategy, count)

---

### Phase 1, Task 3: Backup Status UX and Reminder Enhancements

**Ticket ID:** FCL-003  
**Title:** Enhance backup status card with age buckets and reminders  
**Status:** Not Started  
**Complexity:** S (Small)  
**Impact:** Medium (user friction in data durability awareness)  
**Dependencies:** None  
**Acceptance Criteria:**

1. ✅ Backup status card in `js/ui/settings-ui.js` updated:
   - Current: "Last backup: [date/time]"
   - Enhanced:
     - Green badge (✓) if last backup < 7 days ago
     - Yellow badge (⚠) if last backup 7–30 days ago
     - Red badge (🔴) if no backup or > 30 days ago
     - Display human-readable age: "2 days ago", "3 weeks ago", "Never"
     - Show next recommended backup date (current date + 30 days from last)

2. ✅ Backup reminder scaffold in app.js:
   - On app startup, check last backup timestamp
   - If no backup or > 30 days old, queue reminder (non-blocking toast/banner)
   - Reminder message: "💾 Backup your data — last backup was [age]. [Create Backup now]"
   - Clicking reminder links to backup UI
   - Do NOT show reminder if user has dismissed it in current session

3. ✅ Backup creation timestamp logic:
   - Capture `backupCreatedAt` in backup JSON metadata
   - On restore, preserve `lastBackupRestoreDate` as reference
   - Settings UI displays most recent of: `lastBackupExportDate` or `lastBackupRestoreDate`

4. ✅ UI rendering in settings:
   - Backup status card visible in simple and advanced modes
   - Colors/badges not dependent on external icons (use CSS or text symbols)
   - Responsive layout (mobile-friendly)

**Test Plan:**
```
Test Case 1: Fresh backup (< 7 days)
  Setup: Create backup, check status < 7 days later
  Expected: Green badge, "X days ago" label, no reminder shown

Test Case 2: Stale backup (7-30 days)
  Setup: Simulate last backup 15 days ago
  Expected: Yellow badge, "2 weeks ago", reminder shown on next app load

Test Case 3: Very old backup (> 30 days)
  Setup: Simulate never backed up
  Expected: Red badge, "Never", persistent reminder

Test Case 4: Reminder dismissal
  Setup: Show reminder, user dismisses it
  Expected: Reminder hidden for session, reappears on next app load

Test Case 5: Mobile layout
  Setup: View backup status on mobile viewport
  Expected: Responsive, readable, [Create Backup] button clicking works
```

**Implementation Notes:**
- Use `Date.now()` for timestamps; store as milliseconds since epoch
- Backup status computed on settings UI render (not cached, always fresh)
- Reminder uses existing `Renderer.showToast()` or new banner if available

---

## Phase 2: Productivity Core (2-3 Sprints) — Target v1.2.0 → v1.3.0

### Rationale
Finance-tracker's search + tags strategy significantly improves transaction discovery and daily workflow. These tasks add tagging infrastructure and finalize the Phase 1 search pipeline.

---

### Phase 2, Task 1: Tags Schema and Storage Layer

**Ticket ID:** FCL-004  
**Title:** Add tags to journal entries and extend IndexedDB schema  
**Status:** Not Started  
**Complexity:** M (Medium)  
**Impact:** High (enables phase 2 search and phase 3 reporting)  
**Dependencies:** FCL-001, FCL-002, FCL-003 (Phase 1 should be stable)  
**Acceptance Criteria:**

1. ✅ Database schema extension in `js/infrastructure/db.js`:
   - New store: `tags` (key-value: tag string → { id, name, color, createdAt })
   - Extend `journal_entries` store schema to include `tags: []` (array of tag IDs)
   - Create index on `tags` for fast tag lookup by name
   - IndexedDB version bump: v4 → v5 with migration function
   - Migration function: all existing entries get `tags: []` (empty array)

2. ✅ Tag model in `js/domain/types.js`:
   - Type definition: `Tag = { id, name, color?, createdAt, isActive }`
   - Color options: predefined palette (e.g., 'red', 'blue', 'green', 'yellow', 'purple', 'gray')
   - Validation: tag name 2–30 characters, alphanumeric + spaces/hyphens

3. ✅ Journal entry model extension in `js/domain/types.js`:
   - Add `tags: string[]` (array of tag IDs) to journal entry schema
   - Backward compatibility: existing entries without tags load cleanly

4. ✅ Unit tests for schema migration:
   - v4 → v5 migration executes without errors
   - Existing entries gain `tags: []` field
   - New entries can store tags
   - Tag uniqueness enforced (no duplicate tag IDs per entry)
   - Tag CRUD operations (create, read, update, delete) work correctly

**Test Plan:**
```
Test Case 1: Migration v4 → v5
  Setup: Load FinChronicleLedger with v4 DB
  Expected: Migration runs, all entries get tags: [], v5 live

Test Case 2: Create tag
  Input: createTag({ name: "Tax", color: "red" })
  Expected: Tag stored, has unique ID, createdAt timestamp

Test Case 3: Add tag to entry
  Input: Update journal entry, tags=[tag_id_1]
  Expected: Entry saves, tag lookup fast (<10ms)

Test Case 4: Remove tag from entry
  Input: Update journal entry, tags=[]
  Expected: Entry saves, tag index updated

Test Case 5: Delete tag (with entries using it)
  Input: deleteTag(tag_id)
  Expected: Tag deleted, entries' tag arrays updated (tag ID removed from all)
```

**Implementation Notes:**
- Use UUID for tag IDs (consistent with existing code)
- Color field optional; default to 'gray' if not provided
- Tag names case-insensitive for uniqueness check

---

### Phase 2, Task 2: Search + Filter Pipeline for Journal

**Ticket ID:** FCL-005  
**Title:** Implement search and tag filter pipeline in transaction list  
**Status:** Not Started  
**Complexity:** M (Medium)  
**Impact:** High (primary user workflow improvement)  
**Dependencies:** FCL-004 (tags storage must be ready)  
**Acceptance Criteria:**

1. ✅ Search service in `js/application/search-service.js` created:
   - Function `searchTransactions(query, filters)` → returns fuzzy-matched entries[]
   - Query syntax:
     - Full-text: searches `date`, `type`, `category`, `amount`, `notes`
     - Partial match accepted (e.g., "Rent" matches "Rent Payment")
     - Case-insensitive
   - Filters object: `{ tags: [], dateRange: [start, end], type: 'income|expense|transfer', minAmount, maxAmount }`
   - Boolean AND logic: (query match) AND (all filters match)
   - Return sorted by date descending (most recent first)

2. ✅ State extension in `js/application/state.js`:
   - Add state fields: `searchQuery`, `searchFilters`, `searchResults`
   - Add action: `setSearch(query, filters)` → triggers search, updates results
   - Add action: `clearSearch()` → reset to full transaction list

3. ✅ List UI integration in `js/ui/list.js`:
   - Add search input bar at top of transaction list (visible in both simple/advanced modes)
   - Add filter panel toggle: "🔽 Filters" (collapsible)
   - Filter panel shows:
     - Tag checkboxes (multi-select)
     - Date range picker (from/to dates)
     - Type checkboxes (income, expense, transfer)
     - Amount range sliders (min/max)
     - [Apply Filters] and [Clear All] buttons
   - Display search results dynamically as user types (debounced 300ms)
   - Show match count: "15 results"
   - Preserve filter state across navigation (store in app state)

4. ✅ Performance optimizations:
   - Debounce input handler (300ms delay)
   - Limit initial results to 100 entries; pagination for larger sets
   - Cache search results per unique query+filters combination (volatile cache, cleared on transaction insert/update)

5. ✅ Keyboard shortcuts (optional Phase 2b):
   - Ctrl+F (or Cmd+F on Mac) focuses search input
   - ESC clears search and filters

**Test Plan:**
```
Test Case 1: Search by transaction type
  Query: "rent"
  Expected: Returns all entries with "rent" in notes, category, or description

Test Case 2: Filter by tag
  Filters: { tags: ['tax', 'deduction'] }
  Expected: Returns only entries tagged with 'tax' OR 'deduction'

Test Case 3: Combined search + filter
  Query: "utilities", Filters: { dateRange: [2026-01-01, 2026-03-31], type: 'expense' }
  Expected: Returns 'expense' entries in Q1 matching "utilities"

Test Case 4: Empty results
  Query: "xyz-999"
  Expected: "No results found" message, list empty

Test Case 5: Performance (100+ entries)
  Query: "" (all entries), Filter applied
  Expected: Renders quickly, list interactive, no lag (< 1s)

Test Case 6: Persistence
  User sets filters, navigates away, returns
  Expected: Filters still applied (state preserved)
```

**Implementation Notes:**
- Use simple substring + regex for fuzzy match (no external lib)
- DateRange nullable (null = no filter)
- Tag filter: empty array = no tag filter; array of IDs = match any

---

### Phase 2, Task 3: Tag Management UI (Create, Edit, Delete, Assign)

**Ticket ID:** FCL-006  
**Title:** Tag lifecycle management and assignment UI in transactions  
**Status:** Not Started  
**Complexity:** M (Medium)  
**Impact:** Medium (enabler for tagging workflow)  
**Dependencies:** FCL-004, FCL-005  
**Acceptance Criteria:**

1. ✅ Tag management modal in `js/ui/modals.js`:
   - Modal: "Manage Tags"
   - List all tags with name, color swatch, usage count (how many entries use it)
   - Actions per tag: [Edit] [Delete] [Hide/Show]
   - [+ New Tag] button at top
   - Confirmation before delete (warn if entries tagged: "5 transactions use this tag — proceed?")

2. ✅ Tag creation/edit modal:
   - Form: Tag name (required), Color (dropdown), isActive checkbox
   - Validation: 2–30 characters, unique name
   - [Cancel] and [Save] buttons
   - Edit modal also shows usage count (read-only)

3. ✅ Tag assignment in transaction forms:
   - Add "Tags" field to `js/ui/forms.js` transaction create/edit form
   - UI: Horizontal scrollable tag chips, multi-select checkboxes, or combobox
   - Existing tags shown with color swatches
   - Typing creates new tag inline (optional, Phase 2b)
   - Selected tags displayed as small colored badges on each transaction row

4. ✅ Tag visualization in list:
   - Each transaction row displays assigned tags as small colored badges (after amount/category)
   - Badge text: tag name (truncated if long)
   - On click: filter list by that tag

5. ✅ Sanitization:
   - Tag names sanitized (no XSS; reuse existing `sanitizeText()`)
   - Stored colors are from predefined palette only (no user input CSS)

**Test Plan:**
```
Test Case 1: Create new tag
  Input: Tag name "Tax Deduction", color "red"
  Expected: Tag created, appears in tag list, no duplicates

Test Case 2: Edit tag
  Input: Rename "Tax Deduction" → "Tax", keep color
  Expected: Tag updated, all entries using it unaffected (ID-based)

Test Case 3: Delete tag with dependent entries
  Input: Delete tag used by 3 entries
  Expected: Confirmation shown, on confirm: tag deleted, entries' tag arrays updated

Test Case 4: Assign tag to transaction
  Input: Create expense entry, assign "Travel" tag
  Expected: Entry saved with tag, badge shown in list

Test Case 5: Filter by tag badge click
  Input: In list, click tag badge
  Expected: List filters to entries with that tag, filter state updated

Test Case 6: Rename tag (Case 3 but rename instead)
  Input: Rename "Travel" → "Business Trip"
  Expected: Updated, entries using it re-indexed, search updated
```

**Implementation Notes:**
- Tag deletion: cascade update all journal entries (remove tag ID from their tag arrays)
- Duplicate tag name check is case-insensitive
- Color palette enforced at DB layer (use enum or whitelist)
- Tag edit/delete must trigger re-render of list (invalidate cache)

---

## Phased Rollout Summary

| Phase | Tasks | Estimate | Features Enabled | Risk |
|-------|-------|----------|------------------|------|
| **Phase 1** | FCL-001, FCL-002, FCL-003 | 1-2 weeks | CSV import, Merge restore, Backup UX | Low (additive, no breaking changes) |
| **Phase 2** | FCL-004, FCL-005, FCL-006 | 2-3 weeks | Tags, Search, Filter, Tag management | Medium (schema migration, state complexity) |

---

## Dependencies and Ordering

```
Phase 1 (Parallel):
  ├─ FCL-001 (CSV import) — independent
  ├─ FCL-002 (Merge restore) — independent
  └─ FCL-003 (Backup UX) — independent

Phase 2 (Sequential):
  ├─ FCL-004 (Tags schema) — foundational
  ├─ FCL-005 (Search pipeline) — depends on FCL-004
  └─ FCL-006 (Tag management UI) — depends on FCL-004 and FCL-005
```

**Recommendation:** Phase 1 tasks can be picked up in parallel if team size allows. Complete Phase 1 before Phase 2 to avoid schema/state complexity.

---

## Integration with v1.2.0 Release

**Concurrent v1.2.0 work (from FEATURE-ROADMAP.md):**
- Recurring Transactions
- Budget Planning & Tracking

**Phasing strategy:**
- Phase 1 (FCL-001–003) runs in parallel with Recurring/Budget foundation work
- Phase 2 (FCL-004–006) runs in parallel with Recurring/Budget refinement
- All features tested and integrated for v1.2.0 release together

---

## Sign-Off Checklist

- [ ] Phase 1 tasks estimated and assigned
- [ ] Phase 1 unit tests written before implementation
- [ ] Phase 1 branch code review completed
- [ ] Phase 1 features user-tested (offline, data durability confirmed)
- [ ] Phase 2 tasks refined after Phase 1 stability
- [ ] Phase 2 schema migration tested on real v1.1.0 data
- [ ] Phase 2 features user-tested (search UX, tag workflow)
- [ ] All tasks integrated into v1.2.0 release notes
