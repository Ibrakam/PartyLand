#!/usr/bin/env bash
set -euo pipefail

URL="${1:-https://www.orchids.app/projects/b94621b5-8a09-40ce-b475-425301e7b797}"
OUTDIR="components/ui"

echo "→ Загружаю HTML: $URL"

# Если есть cookie для авторизации — используем, иначе обычный запрос.
if [[ -n "${ORCHIDS_COOKIE:-}" ]]; then
  HTML="$(curl -fsSL -H "Cookie: ${ORCHIDS_COOKIE}" "$URL" 2>/dev/null || true)"
else
  HTML="$(curl -fsSL "$URL" 2>/dev/null || true)"
fi

if [[ -z "$HTML" ]]; then
  echo "✗ Не удалось скачать HTML (возможно, требуется авторизация или страница рендерится JS)."
  exit 1
fi

mkdir -p "$OUTDIR"

echo "$HTML" \
| grep -oE '[A-Za-z0-9._-]+\.(tsx|ts|jsx|js)' \
| sort -u \
| while read -r NAME; do
    [[ -z "$NAME" ]] && continue
    BASE="$(basename "$NAME")"
    FINAL="${BASE%.*}.tsx"
    DEST="$OUTDIR/$FINAL"
    if [[ -e "$DEST" ]]; then
      echo "• Уже есть: $FINAL"
    else
      printf '// %s\n// Автоматически создан из списка Orchids\nexport {};\n' "$FINAL" > "$DEST"
      echo "+ Создан: $FINAL"
    fi
  done

echo "✔ Готово. Файлы в: $OUTDIR"