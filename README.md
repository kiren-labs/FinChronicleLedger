# 📖 FinChronicleLedger

> A privacy-first, offline-first Progressive Web App for personal finance management with double-entry accounting built in from day one. No sign-up, no ads, no tracking — just powerful financial management. Built by Kiren Labs.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](VERSION.md)
[![Code of Conduct](https://img.shields.io/badge/code%20of%20conduct-contributor%20covenant-purple.svg)](CODE_OF_CONDUCT.md)
[![Security](https://img.shields.io/badge/security-policy-blue.svg)](SECURITY.md)

**[Live Demo](#)** | **[Documentation](docs/)** | **[Contributing](CONTRIBUTING.md)** | **[Security](SECURITY.md)**

---

## What is FinChronicleLedger?

FinChronicleLedger is a clean-room reimplementation of [FinChronicle](https://github.com/kiren-labs/finchronicle) with **double-entry accounting** as the foundational data model — not a bolt-on. Every transaction is stored as a balanced journal entry, ensuring your books always balance.

The app serves two audiences with a single codebase:

- **Simple Mode** — Looks and feels exactly like a regular expense tracker. Pick type, amount, category, done. Double-entry happens silently behind the scenes.
- **Advanced Mode** — Full chart of accounts, multi-line journal entries, trial balance, and balance reports for users who want financial precision.

---

## Features

### Core
- **100% Offline** — Works without internet. All data stored locally in IndexedDB.
- **Privacy First** — Zero backend, zero analytics, zero tracking. Data never leaves your device.
- **No Sign-Up** — Open the app and start tracking immediately.
- **Installable PWA** — Add to home screen like a native app on any device.
- **Zero Dependencies** — Vanilla JS, plain CSS, no build step, no framework.
- **Dark Mode** — Full light and dark theme support with design tokens.

### Double-Entry Accounting
- **Chart of Accounts** — 45+ pre-seeded accounts across 5 types (Asset, Liability, Equity, Income, Expense).
- **Balanced Journal Entries** — Every transaction records both where money comes from and where it goes.
- **Trial Balance** — Sum of debits always equals sum of credits, enforced on every write.
- **Account Balances** — Real-time balance for every account in the chart.
- **Transfer Transactions** — First-class support for moving money between accounts.

### Financial Tracking
- **Income & Expenses** — Track both transaction types with category breakdowns.
- **Multi-Currency** — Support for 20 major currencies (INR default).
- **Monthly Summary Dashboard** — Income, expenses, net, entry count, MoM trends.
- **Budget Health Card** — Daily spending pace, projected month-end, on/over/under track.
- **Top Spending Categories** — See where your money goes at a glance.
- **Group by Month / Category** — Flexible grouped views of your data.

### Data Portability
- **CSV Export** — Download transactions as a spreadsheet.
- **Full Backup (JSON)** — Create a metadata-rich backup of all data.
- **Restore from Backup** — Restore all data from a previous backup.
- **Backup Status & Reminders** — Track when you last backed up, get reminders.

### User Experience
- **Smart Type Toggle** — Mobile-friendly income/expense/transfer selection.
- **Collapsible Summary** — Collapse the dashboard when you just want to add transactions.
- **Paginated Transaction List** — Browse 20 items per page with month/category filters.
- **Edit & Delete** — Modify or remove any transaction with confirmation.
- **Responsive Design** — Works on all screen sizes from 320px to desktop.
- **WCAG AA Accessible** — Keyboard navigation, screen reader support, contrast compliance.

---

## Quick Start

### Option 1: Use the Hosted Version

1. Visit the live demo (link TBD)
2. On mobile, tap **Share** → **Add to Home Screen**
3. Start tracking your finances!

### Option 2: Self-Host

#### GitHub Pages

1. Fork this repository
2. Go to **Settings → Pages**
3. Source: Deploy from branch `main`
4. Your app will be live at: `https://<your-username>.github.io/finchronicle/`

#### Local Development

```bash
# Clone the repository
git clone https://github.com/kiren-labs/finchronicle.git
cd finchronicle

# Start a local server (Python)
python3 -m http.server 8000

# Or use Node.js
npx serve .

# Open in browser
open http://localhost:8000
```

> **Note:** A local server is required because Service Workers only work over `localhost` or HTTPS.

---

## Architecture

FinChronicleLedger uses a strict 4-layer architecture:

```
┌───────────────────────────────────────────────┐
│                  UI LAYER                     │
│  DOM rendering • Events • Forms • Modals      │
├───────────────────────────────────────────────┤
│              APPLICATION LAYER                │
│  Services • State • Orchestration             │
├───────────────────────────────────────────────┤
│                DOMAIN LAYER                   │
│  Accounting • Ledger • Reports • Validation   │
│  *** Pure functions — no side effects ***     │
├───────────────────────────────────────────────┤
│            INFRASTRUCTURE LAYER               │
│  IndexedDB • localStorage • File I/O • SW     │
└───────────────────────────────────────────────┘
```

- **UI → Application → Domain → Infrastructure** (top-down only)
- Domain layer is pure functions — given inputs, return outputs, no side effects
- Application layer orchestrates business workflows
- Infrastructure handles all I/O

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full technical breakdown.

---

## Project Structure

```
FinChronicleLedger/
├── index.html              # Single-page entry point
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker (cache-first)
├── robots.txt              # Search engine directives
├── css/
│   ├── tokens.css          # Design tokens (colors, spacing, typography)
│   ├── styles.css          # Component styles
│   └── dark-mode.css       # Dark theme overrides
├── js/
│   ├── app.js              # Entry point — init & orchestration
│   ├── domain/             # Pure business logic (no I/O)
│   │   ├── types.js        # Constants, enums, category maps
│   │   ├── validators.js   # Input validation, XSS sanitization
│   │   ├── accounting.js   # Balance calculations, equation checks
│   │   ├── ledger.js       # Journal entry creation & rules
│   │   ├── chart-of-accounts.js  # Default accounts & numbering
│   │   └── reports.js      # Report calculations, trends, budgets
│   ├── infrastructure/     # I/O operations
│   │   ├── db.js           # IndexedDB CRUD
│   │   ├── storage.js      # localStorage wrapper
│   │   └── file-io.js      # CSV/JSON file operations
│   ├── application/        # Service orchestration
│   │   ├── state.js        # In-memory state management
│   │   ├── transaction-service.js
│   │   ├── account-service.js
│   │   ├── report-service.js
│   │   ├── migration-service.js
│   │   ├── import-export-service.js
│   │   ├── backup-service.js
│   │   └── settings-service.js
│   └── ui/                 # DOM rendering & event handlers
│       ├── renderer.js     # Master UI refresh coordinator
│       ├── forms.js        # Transaction forms (simple & advanced)
│       ├── list.js         # Transaction list with filters
│       ├── summary.js      # Dashboard summary tiles
│       ├── groups.js       # Grouped views & budget health
│       ├── reports-ui.js   # Account balances & trial balance
│       ├── modals.js       # Delete confirm, currency picker
│       ├── navigation.js   # Tab switching & bottom nav
│       └── settings-ui.js  # Settings panel
├── vendor/
│   └── remixicon/          # Self-hosted Remix Icon fonts
├── icons/                  # PWA icons (192, 512, maskable)
└── docs/
    └── FinChronicleLedger/ # Blueprint documentation (9 docs)
```

---

## Technology Stack

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Language | Vanilla JavaScript (ES2020+) | Zero-dependency, no build step |
| CSS | Plain CSS with design tokens | No preprocessor needed |
| Storage | IndexedDB + localStorage | Structured data, offline-capable |
| Module Pattern | IIFE closures (`window.FCL`) | No bundler required |
| PWA | Service Worker + Manifest | Offline-first, installable |
| Icons | Remix Icon (self-hosted) | No CDN dependency |
| IDs | `crypto.randomUUID()` | Collision-safe, merge-friendly |

---

## UX Modes

| Feature | Simple Mode | Advanced Mode |
|---------|-------------|---------------|
| Transaction entry | Type toggle → Amount → Category → Date | Multi-line journal: Account → Debit/Credit |
| Categories | Groceries, Rent, Salary, etc. | Full chart of accounts (45+ accounts) |
| Transfers | From/To dropdowns | Any asset/liability pair |
| Reports tab | Hidden | Account balances + Trial balance |
| Data model | Same (journal entries) | Same (journal entries) |

Users can switch modes freely from Settings. Both modes use the same underlying double-entry data.

---

## Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome / Edge | 90+ | Full support |
| Safari (iOS) | 15+ | Full support |
| Firefox | 90+ | Full support |
| Samsung Internet | 15+ | Full support |

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for:
- How to report bugs and suggest features
- Development setup instructions
- Code style guidelines
- Pull request process

---

## Security

This app stores all data locally on your device. No data is ever transmitted to any server.

For security concerns, see [SECURITY.md](SECURITY.md).

---

## License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.

---

## Acknowledgments

- [Remix Icon](https://remixicon.com/) — Beautiful open-source icon set (Apache 2.0)
- [FinChronicle](https://github.com/kiren-labs/finchronicle) — The original app that inspired this project

---

<div align="center">
  <p>Built with care by <strong>Kiren Labs</strong></p>
  <p>
    <sub>Privacy-first. Offline-first. Accounting-first.</sub>
  </p>
</div>
