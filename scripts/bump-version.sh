#!/bin/bash
# bump-version.sh — Update version in all 3 authoritative locations.
# Usage: ./scripts/bump-version.sh <new-version>
# Example: ./scripts/bump-version.sh 1.3.0
#
# Files updated:
#   1. js/domain/types.js  — APP_VERSION constant (source of truth)
#   2. sw.js               — CACHE_NAME and CDN_CACHE_NAME suffixes
#   3. README.md           — version badge
#
# index.html is NOT updated — app.js reads Types.APP_VERSION at runtime.

set -e

NEW_VERSION="${1}"

if [ -z "$NEW_VERSION" ]; then
    echo "Usage: ./scripts/bump-version.sh <version>"
    echo "Example: ./scripts/bump-version.sh 1.3.0"
    exit 1
fi

# Validate semver format
if ! echo "$NEW_VERSION" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+$'; then
    echo "Error: version must be in X.Y.Z format (e.g. 1.3.0)"
    exit 1
fi

# Confirm current version
CURRENT=$(grep "APP_VERSION" js/domain/types.js | grep -oE "'[0-9]+\.[0-9]+\.[0-9]+'" | tr -d "'")
echo "Current version: $CURRENT"
echo "New version:     $NEW_VERSION"
echo ""

# 1. js/domain/types.js
sed -i.bak "s/const APP_VERSION = '[0-9]*\.[0-9]*\.[0-9]*'/const APP_VERSION = '$NEW_VERSION'/" js/domain/types.js
rm -f js/domain/types.js.bak
echo "  ✓ js/domain/types.js"

# 2. sw.js — both CACHE_NAME and CDN_CACHE_NAME
sed -i.bak \
    -e "s/finchronicle-ledger-v[0-9]*\.[0-9]*\.[0-9]*/finchronicle-ledger-v$NEW_VERSION/g" \
    -e "s/finchronicle-cdn-v[0-9]*\.[0-9]*\.[0-9]*/finchronicle-cdn-v$NEW_VERSION/g" \
    sw.js
rm -f sw.js.bak
echo "  ✓ sw.js"

# 3. README.md badge
sed -i.bak "s/version-[0-9]*\.[0-9]*\.[0-9]*-blue/version-$NEW_VERSION-blue/" README.md
rm -f README.md.bak
echo "  ✓ README.md"

echo ""
echo "Version bumped to $NEW_VERSION."
echo ""
echo "Next steps:"
echo "  1. Add release notes to CHANGELOG.md"
echo "  2. git add -A && git commit -m 'chore: bump version to $NEW_VERSION'"
echo "  3. git tag v$NEW_VERSION"
echo "  4. git push && git push --tags"
