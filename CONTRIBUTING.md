# Contributing to FinChronicleLedger

Thank you for your interest in contributing! This guide covers the conventions and workflow for the project.

---

## Table of Contents

- [Ways to Contribute](#ways-to-contribute)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Code Conventions](#code-conventions)
- [Branch Naming](#branch-naming)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Requesting Features](#requesting-features)

---

## Ways to Contribute

- **Bug reports** — Found something broken? Open an issue with steps to reproduce.
- **Feature requests** — Ideas for improvements? Open an issue for discussion.
- **Code contributions** — Fix a bug or implement a feature via pull request.
- **Documentation** — Improve docs, fix typos, add examples.
- **Testing** — Try the app in different browsers and report issues.

---

## Development Setup

FinChronicleLedger has **zero build dependencies**. Just serve the files.

### Quick start

```bash
# Clone the repository
git clone https://github.com/kiren-labs/finchronicle.git
cd finchronicle
git checkout feature/double-entry-v4.0

# Serve locally (pick one)
python3 -m http.server 8080
# or
npx serve .
# or
php -S localhost:8080

# Open in browser
open http://localhost:8080
```

### Requirements

- A modern browser (Chrome 90+, Firefox 90+, Safari 15+, Edge 90+)
- Any local HTTP server (Service Worker requires HTTPS or localhost)
- Git

No Node.js, npm, or build step required.

---

## Project Structure

```
├── index.html              Entry point
├── app.js                  App initialization
├── sw.js                   Service Worker
├── manifest.json           PWA manifest
├── css/
│   ├── tokens.css          Design tokens
│   ├── styles.css          Component styles
│   └── dark-mode.css       Dark mode overrides
├── js/
│   ├── domain/             Pure business logic (no I/O)
│   ├── infrastructure/     Storage and file I/O
│   ├── application/        Service orchestration
│   └── ui/                 DOM manipulation & events
├── vendor/remixicon/       Self-hosted icon font
└── docs/                   Blueprint & design documents
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full architecture reference.

---

## Code Conventions

### General

- **Vanilla JavaScript only** — no frameworks, no libraries, no npm packages.
- **ES2020+ syntax** — `const`/`let`, template literals, arrow functions, optional chaining, nullish coalescing.
- **Strict mode** — every IIFE starts with `'use strict'`.
- **No `var`** — use `const` by default, `let` only when reassignment is needed.

### Module Pattern

All files use the IIFE + `window.FCL` namespace pattern:

```javascript
(function (global) {
    'use strict';

    // Lazy references to other modules
    const State = () => global.FCL.State;
    const DB = () => global.FCL.DB;

    function myFunction() {
        const state = State();
        // ...
    }

    // Export public API
    global.FCL = global.FCL || {};
    global.FCL.MyModule = { myFunction };
})(window);
```

### Layer Rules

1. **UI → Application → Domain → Infrastructure** (top-down only)
2. Domain functions must be **pure** — no I/O, no side effects
3. Infrastructure has **no business logic**
4. UI layer only calls Application services, never Domain or Infrastructure directly

### CSS

- Use CSS custom properties from `tokens.css` for all values
- No CSS preprocessors
- Dark mode via `[data-theme="dark"]` selectors in `dark-mode.css`
- BEM-style naming: `.component`, `.component__element`, `.component--modifier`

### Naming

| Entity | Convention | Example |
|--------|-----------|---------|
| Functions | camelCase | `calculateBalance()` |
| Constants | UPPER_SNAKE | `MAX_AMOUNT`, `ACCOUNT_TYPES` |
| CSS classes | kebab-case with BEM | `.btn--primary`, `.form-group` |
| Files | kebab-case | `transaction-service.js` |
| Module exports | PascalCase object | `FCL.TransactionService` |

### HTML IDs

Use kebab-case with `fcl-` prefix for IDs referenced in JavaScript:

```html
<div id="fcl-summary-container"></div>
```

---

## Branch Naming

| Prefix | Use |
|--------|-----|
| `feature/` | New features |
| `fix/` | Bug fixes |
| `docs/` | Documentation changes |
| `refactor/` | Code restructuring |
| `chore/` | Maintenance, tooling |

Examples: `feature/recurring-transactions`, `fix/trial-balance-rounding`, `docs/api-reference`

---

## Commit Messages

Use conventional commit format:

```
type(scope): short description

Optional longer description explaining the change.
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Scope:** Optional — module or area affected (`domain`, `ui`, `db`, `css`, `sw`)

**Examples:**

```
feat(domain): add multi-currency balance calculation
fix(ui): correct month filter off-by-one error
docs: update ARCHITECTURE.md with data flow diagram
style(css): add dark mode support for budget health card
refactor(application): extract backup logic from settings-service
```

---

## Pull Request Process

1. **Fork & branch** — Create a feature branch from `feature/double-entry-v4.0`
2. **Make changes** — Follow the code conventions above
3. **Test manually** — Open the app in a browser, verify your changes work
4. **Check all modes** — Test in both Simple Mode and Advanced Mode
5. **Check dark mode** — Verify your UI changes look correct in both themes
6. **Write a clear PR description** — Explain what changed and why
7. **Link related issues** — Reference issue numbers with `Fixes #123`

### PR Checklist

- [ ] Follows the IIFE + `window.FCL` namespace pattern
- [ ] Domain functions are pure (no I/O, no side effects)
- [ ] Layer dependency rules respected (no bottom-up imports)
- [ ] CSS uses design tokens from `tokens.css`
- [ ] Dark mode styles added in `dark-mode.css` (if UI changes)
- [ ] Tested in Simple Mode and Advanced Mode
- [ ] No console errors or warnings
- [ ] No external dependencies added

---

## Reporting Bugs

When filing a bug report, include:

1. **Browser & version** (e.g., Chrome 120, Safari 17)
2. **Steps to reproduce** — Exact clicks/inputs
3. **Expected behavior** — What should happen
4. **Actual behavior** — What happened instead
5. **Console errors** — Open DevTools → Console, paste any errors
6. **UI Mode** — Simple or Advanced
7. **Dark mode** — Light or Dark theme

---

## Requesting Features

Feature requests should include:

1. **Problem statement** — What need does this address?
2. **Proposed solution** — How should it work?
3. **Mode impact** — Does this affect Simple Mode, Advanced Mode, or both?
4. **Alternatives considered** — Other approaches you thought of

---

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold this code.

---

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
