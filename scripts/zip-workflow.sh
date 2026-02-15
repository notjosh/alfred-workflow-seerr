#!/bin/bash
set -euo pipefail
OUT="${1:-seerr.alfredworkflow}"
zip -r "$OUT" info.plist icon.png dist/ run-node.sh icons/
echo "$OUT"
