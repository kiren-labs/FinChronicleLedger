# FinChronicleLedger — Project Overview

> **A clean-room, from-scratch personal finance application with double-entry accounting from day one.**

---

## 1. Vision Statement

**FinChronicleLedger** is a new personal finance application built from the ground up. It preserves every capability of FinChronicle v3.10.3 while introducing a robust double-entry accounting engine as the foundational data model — not a bolt-on.

The app serves two audiences with a single codebase:
- **Casual users** (Simple Mode) — experience identical to FinChronicle: pick type, amount, category, done. Double-entry happens silently.
- **Power users** (Advanced Mode) — full chart of accounts, multi-line journal entries, trial balance, balance sheet, income statements.

---

## 2. Core Principles

| Principle | Commitment |
|-----------|-----------|
| **Privacy-first** | Zero backend, zero analytics, zero tracking. All data stays on-device in IndexedDB. |
| **Offline-first** | Full functionality without internet. Service Worker caches all assets. |
| **Mobile-first** | Touch-optimized, bottom navigation, haptic feedback, safe-area support. |
| **Zero dependencies** | Vanilla JS (ES2020+), plain CSS with design tokens, no build step, no framework. |
| **Double-entry native** | Every transaction is a balanced journal entry from day one. The accounting equation is always satisfied. |
| **Progressive disclosure** | Simple Mode hides accounting complexity; Advanced Mode reveals it. Users switch freely. |

---

## 3. What This Project Is (and Isn't)

| ✅ This project IS | ❌ This project is NOT |
|---------------------|------------------------|
| A clean-room reimplementation | A fork or refactor of FinChronicle v3 |
| Feature parity with v3.10.3 as MVP baseline | A stripped-down MVP missing v3 features |
| Double-entry as the core model | Double-entry bolted onto single-entry |
| A PWA installable on any device | A native mobile app |
| Privacy-preserving local storage | A cloud-synced SaaS product |

---

## 4. Feature Parity Checklist (v3.10.3 Baseline)

Every feature below must work identically in Simple Mode before v1.0 ships:

### Transaction Management
- [x] Add transaction (type toggle, amount, category, date, notes)
- [x] Edit transaction (pre-fill form, preserve createdAt)
- [x] Delete transaction (confirmation modal)
- [x] Validation layer (type, amount 0–999M, decimal ≤2, category-type match, date range, XSS sanitization)
- [x] Dynamic category dropdown based on income/expense
- [x] Date defaults to today, resets after save
- [x] Haptic feedback on mobile (50ms vibration)
- [x] Form feedback states (loading spinner → success checkmark → auto-reset)

### List & Filtering
- [x] Paginated transaction list (20/page, newest first)
- [x] Month filter buttons (dynamic from data)
- [x] Category filter dropdown
- [x] Type filter (all/income/expense)
- [x] Empty state with icon + message

### Summary Dashboard
- [x] This Month Net (income − expenses)
- [x] Total Entries count
- [x] Monthly Income / Monthly Expenses
- [x] MoM trend indicators (arrow + percentage)
- [x] Expense-to-income ratio
- [x] Collapsible summary with localStorage persistence
- [x] Compact summary view
- [x] Actionable tiles → filtered list navigation

### Groups & Analytics
- [x] Group by Month (income/expense/net per month)
- [x] Group by Category (totals per category, sorted)
- [x] Monthly Insights (income, expenses, savings, count, MoM trends)
- [x] Month selector dropdown
- [x] Top 5 Spending Categories
- [x] Budget Health Card (daily pace, projected month-end, status badge)

### Data Portability
- [x] CSV Export (currency-aware header)
- [x] CSV Import (date normalization, smart category mapping)
- [x] Create Backup (metadata-rich CSV with ID/createdAt)
- [x] Restore Backup (merge mode, duplicate detection, preview + report modals)
- [x] Backup timestamp tracking + reminders (30-day threshold)

### Settings
- [x] Export / Import / Backup / Restore buttons
- [x] Currency selector (20 currencies)
- [x] Dark mode toggle
- [x] Check for Updates
- [x] Send Feedback (GitHub Issues + email fallback)
- [x] Backup Status Card (good/warning/danger)
- [x] FAQ Section (3 categories, 11 Q&As, accordion)

### PWA & Offline
- [x] Service Worker (cache-first strategy)
- [x] Offline functionality
- [x] iOS install prompt
- [x] Auto-update detection + update prompt
- [x] Version display + version check on load
- [x] PWA manifest (standalone, portrait, icon sizes, shortcuts)

### Accessibility
- [x] Skip-to-content link
- [x] ARIA roles & labels (tablist, tab, tabpanel, etc.)
- [x] Keyboard navigation (Enter/Space, tabindex, focus-visible)
- [x] Screen reader support (semantic HTML, sr-only)
- [x] WCAG AA contrast in both themes
- [x] Touch targets ≥ 48px
- [x] Safe area support (notch/home indicator)

### Theme & Styling
- [x] Design token system (CSS custom properties)
- [x] Three-layer CSS (tokens → styles → dark-mode)
- [x] Responsive breakpoints (desktop >480px, mobile ≤480px, small ≤360px)
- [x] Bottom navigation (mobile)
- [x] Monospace numerics for financial values

---

## 5. New Capabilities (Double-Entry Native)

Beyond v3.10.3 parity, FinChronicleLedger introduces:

### MVP (v1.0)
| Feature | Description |
|---------|-------------|
| **Chart of Accounts** | ~35+ pre-seeded accounts across 5 types (Asset, Liability, Equity, Income, Expense) |
| **Journal Entries** | Every transaction stored as balanced debit/credit entries |
| **Account Balances** | Real-time balance for every account |
| **Transfer Transactions** | First-class support (not simulated with paired income/expense) |
| **Simple Mode** | Guided form identical to v3 UX — double-entry happens silently |
| **Advanced Mode** | Full journal entry editor with multi-line debits/credits |
| **Trial Balance** | Sum(debits) = Sum(credits) enforced on every write |
| **v3 Migration Wizard** | Import FinChronicle v3 backup → convert to journal entries |
| **Opening Balance Wizard** | Set starting balances for all accounts |

### Post-MVP (v1.1+)
| Feature | Target |
|---------|--------|
| Balance Sheet report | v1.1 |
| Income Statement report | v1.1 |
| Net Worth tracking | v1.1 |
| Custom account creation | v1.2 |
| Recurring transactions | v1.2 |
| Charts & visualizations | v1.3 |
| Tags & search | v1.3 |
| Receipt photos | v1.4 |

---

## 6. Document Index

| Document | Purpose |
|----------|---------|
| [00-PROJECT-OVERVIEW.md](00-PROJECT-OVERVIEW.md) | This file — vision, principles, feature parity |
| [01-ARCHITECTURE.md](01-ARCHITECTURE.md) | System architecture, layers, module map |
| [02-DATA-MODEL.md](02-DATA-MODEL.md) | IndexedDB schema, data structures, accounting rules |
| [03-CHART-OF-ACCOUNTS.md](03-CHART-OF-ACCOUNTS.md) | Default account list, numbering, types |
| [04-UX-MODES.md](04-UX-MODES.md) | Simple Mode vs Advanced Mode UX specification |
| [05-MIGRATION-SPEC.md](05-MIGRATION-SPEC.md) | v3 → FinChronicleLedger migration strategy |
| [06-FILE-STRUCTURE.md](06-FILE-STRUCTURE.md) | Project directory layout, module responsibilities |
| [07-IMPLEMENTATION-ROADMAP.md](07-IMPLEMENTATION-ROADMAP.md) | Phased delivery plan, sprint breakdown |
| [08-ACCOUNTING-RULES.md](08-ACCOUNTING-RULES.md) | Double-entry rules, transaction patterns, validation |

---

## 7. Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Language | Vanilla JavaScript (ES2020+) | Zero-dependency philosophy, no build step |
| CSS | Plain CSS with design tokens | No preprocessor, aligns with zero-dep |
| Storage | IndexedDB (primary), localStorage (settings only) | Structured data, transaction support, no size limits |
| Module pattern | ES module-style IIFE closures per file | No bundler required, avoids global pollution |
| PWA | Service Worker + manifest.json | Offline-first, installable |
| IDs | UUID v4 (crypto.randomUUID()) | Collision-safe, merge-friendly |
| Testing | Manual + scripted validation | No test framework dependency (future: consider lightweight) |
| Hosting | GitHub Pages / static hosting | Free, privacy-preserving, no server |

---

## 8. Success Criteria

### v1.0 Launch Criteria
1. **100% feature parity** with FinChronicle v3.10.3 in Simple Mode
2. **Trial balance always balanced** — zero tolerance for unbalanced entries
3. **v3 migration** works for 0, 100, 1000, and 10000 transactions
4. **Performance:** App startup <2s, transaction save <100ms, reports <300ms
5. **Offline-first:** All features work without network
6. **WCAG AA:** All contrast ratios, keyboard nav, screen reader support
7. **Both themes:** Light and dark mode fully styled

### Quality Gates
- No unbalanced journal entries can ever be persisted
- CSV export/import round-trips without data loss
- v3 backup restore produces identical financial totals
- All 20 currencies display correctly
- PWA installs and works offline on iOS Safari, Chrome Android, Desktop Chrome/Edge
