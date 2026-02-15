#!/bin/bash
set -euo pipefail

WORKFLOWS_DIR="$HOME/Library/Application Support/Alfred/Alfred.alfredpreferences/workflows"
LINK_NAME="user.workflow.seerr-dev"
LINK_PATH="$WORKFLOWS_DIR/$LINK_NAME"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Ensure dist/ exists before symlinking
if [[ ! -d "$PROJECT_DIR/dist" ]]; then
  echo "Building dist/..."
  pnpm --dir "$PROJECT_DIR" run build
fi

if [[ -d "$LINK_PATH" && ! -L "$LINK_PATH" ]]; then
  echo "Updating dev workflow at: $LINK_PATH"
elif [[ -L "$LINK_PATH" ]]; then
  echo "Removing old symlink: $LINK_PATH"
  rm "$LINK_PATH"
elif [[ -e "$LINK_PATH" ]]; then
  echo "Error: $LINK_PATH already exists and is unexpected"
  exit 1
fi

mkdir -p "$LINK_PATH"

# Symlink runtime files from the project
for f in dist icons icon.png run-node.sh; do
  ln -sf "$PROJECT_DIR/$f" "$LINK_PATH/$f"
done

# Generate a dev info.plist with a different keyword, name, and bundle ID
sed \
  -e 's|<string>seerr</string>|<string>seerrdev</string>|' \
  -e 's|<string>Seerr</string>|<string>Seerr (Dev)</string>|' \
  -e 's|<string>com.notjosh.alfred-seerr</string>|<string>com.notjosh.alfred-seerr.dev</string>|' \
  "$PROJECT_DIR/info.plist" > "$LINK_PATH/info.plist"

echo "Dev workflow installed at: $LINK_PATH"
echo "  Keyword: seerrdev"
echo "  Symlinks: dist/ icons/ icon.png run-node.sh"
echo "  Patched: info.plist (keyword=seerrdev, name=Seerr (Dev))"
echo ""
echo "Reload Alfred (or toggle the workflow) to pick it up."
