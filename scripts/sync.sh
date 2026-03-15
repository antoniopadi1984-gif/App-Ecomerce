#!/bin/bash
cd "$(git rev-parse --show-toplevel)"
MSG=${1:-"sync: $(date '+%Y-%m-%d %H:%M')"}
git add -A
git diff --cached --quiet && echo "Nada que sincronizar." && exit 0
git commit -m "$MSG"
git push origin main
echo "✅ Subido a GitHub: $MSG"
