#!/bin/bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
URL="https://cdn.jsdelivr.net/gh/selfhst/icons@main/png/seerr.png"

curl -fsSL "$URL" -o "$PROJECT_DIR/icon.png"
echo "Downloaded icon.png from selfh.st/icons"
