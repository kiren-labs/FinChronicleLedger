# Version Guide

## Current Version

**FinChronicleLedger v1.1.0**

---

## Semantic Versioning

This project follows [Semantic Versioning 2.0.0](https://semver.org/):

```
MAJOR.MINOR.PATCH
```

| Segment | When to Increment |
|---------|------------------|
| **MAJOR** | Breaking changes — data model changes, removed features, incompatible backup format |
| **MINOR** | New features — new reports, new account types, UI enhancements |
| **PATCH** | Bug fixes — calculation corrections, styling fixes, typo fixes |

---

## Version Locations

The version string must be updated in these locations when releasing:

| File | Location | Example |
|------|----------|---------|
| `manifest.json` | Top-level — used as display reference | `"version": "1.0.0"` |
| `js/domain/types.js` | `APP_VERSION` constant | `const APP_VERSION = '1.0.0'` |
| `sw.js` | `CACHE_NAME` suffix | `const CACHE_NAME = 'fcl-v1.0.0'` |
| `CHANGELOG.md` | Latest entry header | `## [1.0.0] — 2025-XX-XX` |

---

## Service Worker Cache Busting

The Service Worker uses version-tagged cache names:

```javascript
const CACHE_NAME = 'fcl-v1.0.0';
```

When the version changes:
1. A new cache (`fcl-v1.1.0`) is created on SW install
2. Old caches (`fcl-v1.0.0`) are deleted on SW activate
3. All assets are re-fetched and cached fresh

This ensures users always get the latest version after the SW updates.

---

## Version Detection

On app startup (`app.js`):
1. Read `APP_VERSION` from `types.js`
2. Compare with `fcl_version` in localStorage
3. If different → first-run-after-update logic (e.g., migration, changelog prompt)
4. Store new version in localStorage

---

## Release Checklist

1. Update version in all 4 locations listed above
2. Update `CHANGELOG.md` with all changes
3. Test in Simple Mode and Advanced Mode
4. Test in Light and Dark themes
5. Test offline functionality (disable network, reload)
6. Commit with message: `chore: bump version to X.Y.Z`
7. Tag the commit: `git tag vX.Y.Z`
8. Push: `git push origin feature/double-entry-v4.0 --tags`

---

## Version History

See [CHANGELOG.md](CHANGELOG.md) for a detailed history of all releases.
