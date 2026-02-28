# Security Policy

## Overview

FinChronicleLedger is a **local-first, offline-first** personal finance tracker. All data stays on your device — nothing is ever sent to a server.

---

## Security Model

### Data Privacy

| Aspect | Implementation |
|--------|---------------|
| **Storage** | All data in IndexedDB and localStorage — never transmitted |
| **Network** | Zero network requests after initial page load |
| **Server** | No backend, no API, no analytics, no telemetry |
| **Authentication** | None required — single-user local app |
| **Third-party code** | Zero runtime dependencies |
| **CDN** | None — all assets self-hosted including icon fonts |

### Input Validation

- All user input is validated in the Domain layer (`validators.js`)
- HTML tags are stripped from text inputs to prevent XSS
- Amount inputs are bounded (min/max limits)
- Note/description fields have length limits
- Date inputs are range-checked

### Content Security

- No `eval()` or `Function()` constructors
- No `innerHTML` with unsanitized user data
- DOM content created via `textContent` or sanitized before insertion
- No inline event handlers in HTML

### Service Worker

- Cache-first strategy serves known assets efficiently
- Only same-origin requests are cached
- Cache is versioned and old caches are purged on updates

---

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x | :white_check_mark: |

---

## Reporting a Vulnerability

If you discover a security vulnerability in FinChronicleLedger:

1. **Do NOT open a public issue**
2. Email the maintainer at: **[security contact to be configured]**
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Response Timeline

| Stage | Timeframe |
|-------|-----------|
| Acknowledgment | Within 48 hours |
| Initial assessment | Within 1 week |
| Fix or mitigation | Within 2 weeks for critical issues |
| Public disclosure | After fix is released |

---

## Security Best Practices for Users

1. **Use HTTPS** — If self-hosting, serve over HTTPS for Service Worker support
2. **Regular backups** — Export data periodically via Settings → Export Backup
3. **Browser updates** — Keep your browser updated for the latest security patches
4. **Shared devices** — Be aware that data is stored in the browser; clear site data if using a shared device
5. **Trusted sources** — Only install from the official repository or GitHub Pages deployment

---

## Known Limitations

- **No encryption at rest** — IndexedDB data is not encrypted. It is protected by the browser's same-origin policy.
- **No authentication** — Anyone with access to the browser profile can access the data.
- **No audit log** — Financial data modifications are not cryptographically signed or tracked beyond the entry's timestamp.

These are accepted trade-offs for a zero-dependency local-first app. For sensitive financial data, users should rely on device-level security (OS login, disk encryption).
