# Changelog

All notable changes to FinChronicleLedger will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] — 2025-07-17

### Added

#### Double-Entry Accounting Engine
- Full double-entry bookkeeping with balanced journal entries (every debit has an equal credit)
- 45 default accounts across 5 types: Assets, Liabilities, Income, Expenses, Equity
- Numbered chart of accounts (1xxx Assets, 2xxx Liabilities, 3xxx Equity, 4xxx Income, 5xxx Expenses)
- Trial balance verification — ensures total debits equal total credits
- Accounting equation enforcement: Assets = Liabilities + Equity

#### Two UX Modes
- **Simple Mode** — familiar type/amount/category/date form (auto-generates journal entries behind the scenes)
- **Advanced Mode** — multi-line journal entry editor with explicit debit/credit lines and account selection
- Seamless switch between modes; all data is shared

#### Dashboard & Summary
- Income, Expenses, Net, and Transaction Count tiles
- Month-over-month comparison with delta indicators
- Expense ratio (expenses as % of income)
- Net worth calculation (total assets minus total liabilities) in Advanced Mode

#### Transaction Management
- Create, edit, and delete transactions
- Paginated transaction list with month-based filtering
- Transaction types: Income, Expense, Transfer
- Notes/description support on every transaction

#### Grouped Views
- Group transactions by month or by category
- Top spending categories breakdown
- Budget health card with over/under indicators

#### Reports (Advanced Mode)
- Account balances by type (Assets, Liabilities, Income, Expenses, Equity)
- Full trial balance report with debit/credit columns and balance verification status

#### Multi-Currency
- 20 currencies supported: INR, USD, EUR, GBP, JPY, AUD, CAD, CHF, CNY, SEK, NZD, MXN, SGD, HKD, NOK, KRW, TRY, ZAR, BRL, THB
- Currency picker in Settings
- Formatted display with locale-aware symbols

#### Data Portability
- JSON backup export/import (full database snapshot)
- CSV export for spreadsheet compatibility
- FinChronicle v3 migration — import v3 backup and auto-map to double-entry format
- 30-day backup reminder with dismissible prompt

#### Settings & Preferences
- Dark mode toggle with system preference detection
- Currency selection
- UI mode toggle (Simple / Advanced)
- Collapsible summary dashboard

#### PWA & Offline
- Full Progressive Web App with install prompt
- Service Worker with cache-first strategy
- Works completely offline after first load
- Self-hosted Remix Icon font (no CDN dependency)

#### Infrastructure
- IndexedDB for structured data storage (journal entries, accounts, settings)
- localStorage for lightweight preferences
- 4-layer architecture: UI → Application → Domain → Infrastructure
- Zero external runtime dependencies
- Pure domain functions — testable, side-effect-free accounting logic

### Technical Notes
- Clean-room implementation based on FinChronicle v3.10.3 feature set
- All new code — not a fork or refactor of v3
- ES2020+ JavaScript with IIFE module pattern and `window.FCL` namespace
- Three-layer CSS: design tokens → component styles → dark mode overrides
