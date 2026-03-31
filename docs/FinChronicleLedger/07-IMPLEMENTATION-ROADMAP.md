# FinChronicleLedger — Implementation Roadmap

> Phased delivery plan targeting 6-week MVP with subsequent feature releases.

---

## 1. Release Strategy

| Release | Timeline | Focus |
|---------|----------|-------|
| **v1.0.0** (MVP) | Weeks 1–6 | Feature parity + double-entry engine |
| **v1.1.0** | Weeks 7–8 | Security hardening, architecture compliance, code quality |
| **v1.2.0** | Weeks 9–10 | Custom accounts, recurring transactions |
| **v1.3.0** | Weeks 11–12 | Charts, tags, search |

---

## 2. Phase 1: Foundation (Weeks 1–2)

### Week 1: Infrastructure + Domain Core

| Task | Module | Est. Hours | Priority |
|------|--------|-----------|----------|
| Set up project structure (all directories, empty files) | — | 2 | P0 |
| Design token system (port from v3 with enhancements) | css/tokens.css | 4 | P0 |
| IndexedDB initialization (accounts + journal_entries stores) | infrastructure/db.js | 6 | P0 |
| Account type constants and definitions | domain/types.js | 3 | P0 |
| Input validators (amount, date, HTML sanitization) | domain/validators.js | 4 | P0 |
| Chart of Accounts default data + seeding logic | domain/chart-of-accounts.js | 4 | P0 |
| Core accounting functions (balance calc, trial balance) | domain/accounting.js | 6 | P0 |
| Journal entry builder + validator | domain/ledger.js | 8 | P0 |

**Week 1 Deliverable:** Domain layer complete and manually testable. IndexedDB boots and seeds accounts.

### Week 2: Application Services + Data Layer

| Task | Module | Est. Hours | Priority |
|------|--------|-----------|----------|
| Transaction service (create/edit/delete for Simple Mode) | application/transaction-service.js | 8 | P0 |
| Account service (CRUD, balance queries) | application/account-service.js | 6 | P0 |
| Settings service (currency, theme, mode) | application/settings-service.js | 4 | P0 |
| localStorage wrapper | infrastructure/storage.js | 2 | P0 |
| File I/O (CSV generation/parsing) | infrastructure/file-io.js | 4 | P0 |
| Report calculations (monthly totals, trends, budget health) | domain/reports.js | 6 | P0 |
| Report service orchestration | application/report-service.js | 4 | P0 |

**Week 2 Deliverable:** All Application services functional. Can create/read/update/delete transactions programmatically.

---

## 3. Phase 2: UI — Simple Mode (Weeks 3–4)

### Week 3: Core UI Components

| Task | Module | Est. Hours | Priority |
|------|--------|-----------|----------|
| HTML shell (tabs, nav, form, list area, modals) | index.html | 8 | P0 |
| Main styles (layout, cards, forms, buttons) | css/styles.css | 10 | P0 |
| Dark mode styles | css/dark-mode.css | 4 | P0 |
| Tab navigation + bottom nav | ui/navigation.js | 4 | P0 |
| Simple Mode add form (type toggle, amount, category, date, notes) | ui/forms.js | 8 | P0 |
| Form submission handler (create + edit) | ui/forms.js | 4 | P0 |
| Success animation + haptic feedback | ui/forms.js | 2 | P0 |
| Master renderer + updateUI() | ui/renderer.js | 3 | P0 |

**Week 3 Deliverable:** Can add transactions via Simple Mode form. Data persists in IndexedDB.

### Week 4: List, Summary, Groups

| Task | Module | Est. Hours | Priority |
|------|--------|-----------|----------|
| Transaction list with pagination | ui/list.js | 6 | P0 |
| Month filter buttons | ui/list.js | 3 | P0 |
| Category filter dropdown | ui/list.js | 2 | P0 |
| Type filter (all/income/expense) | ui/list.js | 2 | P0 |
| Summary dashboard (4 cards + compact) | ui/summary.js | 6 | P0 |
| MoM trend indicators | ui/summary.js | 3 | P0 |
| Collapsible summary | ui/summary.js | 2 | P0 |
| Actionable tiles | ui/summary.js | 3 | P0 |
| Group by Month | ui/groups.js | 4 | P0 |
| Group by Category | ui/groups.js | 3 | P0 |
| Monthly Insights panel | ui/groups.js | 4 | P0 |
| Top 5 Spending Categories | ui/groups.js | 3 | P0 |
| Budget Health Card | ui/groups.js | 4 | P0 |

**Week 4 Deliverable:** Full Simple Mode UI with list, summary, and analytics. Feature parity with v3 in Simple Mode.

---

## 4. Phase 3: Data Portability + Settings (Week 5)

| Task | Module | Est. Hours | Priority |
|------|--------|-----------|----------|
| CSV export with currency-aware headers | application/import-export-service.js | 4 | P0 |
| CSV import with date normalization + smart category mapping | application/import-export-service.js | 8 | P0 |
| Backup creation with metadata | application/import-export-service.js | 4 | P0 |
| Backup restoration with merge mode + duplicate detection | application/import-export-service.js | 6 | P0 |
| Backup service (timestamp tracking, reminders) | application/backup-service.js | 3 | P0 |
| Delete confirmation modal | ui/modals.js | 2 | P0 |
| Restore preview + report modals | ui/modals.js | 4 | P0 |
| Currency selector modal | ui/modals.js | 3 | P0 |
| Settings tab (export/import/backup/restore buttons) | ui/settings-ui.js | 3 | P0 |
| Dark mode toggle | ui/settings-ui.js | 2 | P0 |
| Mode toggle (Simple ↔ Advanced) | ui/settings-ui.js | 2 | P0 |
| Backup Status Card | ui/settings-ui.js | 3 | P0 |
| FAQ section (accordion) | ui/settings-ui.js | 3 | P0 |
| Feedback modal (GitHub Issues + email) | ui/modals.js | 2 | P0 |

**Week 5 Deliverable:** All data portability features working. Settings tab complete. Full feature parity with v3.10.3.

---

## 5. Phase 4: Advanced Mode + Migration + PWA (Week 6)

| Task | Module | Est. Hours | Priority |
|------|--------|-----------|----------|
| Advanced Mode journal entry editor | ui/forms.js | 8 | P0 |
| Multi-line debit/credit entry with live balance indicator | ui/forms.js | 6 | P0 |
| Advanced Mode transaction list (shows debit/credit detail) | ui/list.js | 4 | P0 |
| Account balances panel | ui/reports-ui.js | 4 | P0 |
| Trial balance view | ui/reports-ui.js | 4 | P0 |
| Transfer transaction support (Simple Mode) | ui/forms.js | 4 | P1 |
| v3 migration service | application/migration-service.js | 8 | P0 |
| Migration wizard modals (4 steps) | ui/modals.js | 6 | P0 |
| Opening balance wizard | ui/modals.js | 4 | P1 |
| Service Worker (cache-first, update detection) | sw.js | 4 | P0 |
| PWA manifest | manifest.json | 1 | P0 |
| Version management + update prompts | ui/navigation.js | 3 | P0 |
| iOS install prompt | ui/navigation.js | 2 | P0 |
| Accessibility audit (ARIA, keyboard, contrast) | — | 4 | P0 |
| Responsive testing (mobile, tablet, desktop) | — | 3 | P0 |

**Week 6 Deliverable:** v1.0.0 ready for release. All features working in both modes. PWA installable.

---

## 6. Phase 5: Security Hardening & Architecture Compliance (Weeks 7–8) — v1.1.0

| Task | Status | Priority |
|------|--------|----------|
| XSS prevention — all innerHTML escaped via `escapeHTML()` | ✅ Done | P0 |
| Content-Security-Policy meta tag (`script-src 'self'`) | ✅ Done | P0 |
| Inline event handler removal — all listeners programmatic | ✅ Done | P0 |
| Backup restore validation and sanitization | ✅ Done | P0 |
| Pure Domain layer — `sanitizeHTML()` no longer uses DOM | ✅ Done | P1 |
| CSPRNG UUID fallback (`crypto.getRandomValues`) | ✅ Done | P1 |
| Architecture layer violations fixed — UI calls Application only | ✅ Done | P1 |
| Application-layer delegates for display helpers | ✅ Done | P1 |
| Infrastructure purity — `db.js` no longer sets business timestamps | ✅ Done | P1 |
| State mutation safety — account objects cloned before modification | ✅ Done | P1 |
| Service Worker CDN caching hardened (separate cache, network-first) | ✅ Done | P1 |
| Error boundaries in `updateUI()` | ✅ Done | P2 |
| Backup reminder aligned with docs (30 days) | ✅ Done | P2 |

---

## 7. Phase 6: Extended Features (Weeks 9–12) — v1.2.0, v1.3.0

### v1.2.0 (Weeks 9–10)
| Task | Priority |
|------|----------|
| Custom account creation (user-defined codes + names) | P1 |
| Account management UI (create, rename, deactivate) | P1 |
| Recurring transactions (daily/weekly/monthly/yearly) | P1 |
| Sub-account hierarchies | P2 |

### v1.3.0 (Weeks 11–12)
| Task | Priority |
|------|----------|
| Charts & visualizations (expense breakdown pie, trend line) | P2 |
| Tags for transactions | P2 |
| Full-text search across descriptions and memos | P2 |
| Account reconciliation UI | P2 |

---

## 8. Testing Strategy

### Manual Testing Per Phase

| Phase | Test Focus |
|-------|-----------|
| Phase 1 | Domain functions return correct values. IndexedDB boots and persists. |
| Phase 2 | Form submission creates valid journal entries. List renders correctly. |
| Phase 3 | CSV export round-trips. v3 backup imports correctly. |
| Phase 4 | Advanced Mode editor creates balanced entries. Migration converts correctly. |
| Phase 5 | Reports match manual calculations. |

### Validation Script (`scripts/validate-local.sh`)
- Check all HTML/CSS/JS files for syntax errors
- Verify file structure matches spec
- Count total lines of code
- Check for console.error/console.warn usage
- Verify Service Worker cache list matches actual files

### Critical Test Cases (Always Run Before Release)
1. Create expense in Simple Mode → verify journal entry is balanced
2. Create income in Simple Mode → verify journal entry is balanced
3. Create transfer → verify no P&L impact
4. Edit transaction → verify old entry updated, still balanced
5. Delete transaction → verify removed from all views
6. Export CSV → Import CSV → verify zero data loss
7. Create v3-format backup → import via migration → verify trial balance
8. Switch Simple ↔ Advanced mode → verify same data, different view
9. 10,000 entry stress test → verify <300ms report generation
10. Offline mode → verify all features work without network

---

## 9. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Scope creep (adding features beyond parity) | High | Medium | Fixed MVP scope. All additions go to v1.1+. |
| Floating-point precision errors in accounting | Medium | Critical | All arithmetic rounds to 2 decimal places. Trial balance with 0.001 tolerance. |
| IndexedDB quota exceeded | Low | High | Monitor storage usage. Warn at 80% of estimated quota. |
| v3 backup format variations | Medium | Medium | Test with v3.0–v3.10.3 backup formats. Fallback to generic CSV parsing. |
| Performance with 10k+ entries | Low | Medium | Start with in-memory. Add aggregation cache only if needed. |
| Accessibility regressions | Medium | High | Run aXe/Lighthouse audit each phase. WCAG AA checklist. |
| Service Worker cache staleness | Low | Medium | Versioned cache names. Force update on version change. |

---

## 10. Definition of Done (Per Task)

- [ ] Feature works in Simple Mode
- [ ] Feature works in Advanced Mode (if applicable)
- [ ] Feature works in both Light and Dark themes
- [ ] Feature works offline (if applicable)
- [ ] Feature is keyboard accessible
- [ ] Feature has proper ARIA attributes
- [ ] Journal entries remain balanced after feature use
- [ ] No console errors in Chrome and Safari
- [ ] Responsive on mobile (375px) and desktop (1280px)
