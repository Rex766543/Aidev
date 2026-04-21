#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# download_models.sh
# model_manifest.json を参照して Essentia 学習済みモデルを models/ に DL する
# 使い方: bash scripts/download_models.sh
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
MODELS_DIR="$ROOT_DIR/models"
MANIFEST="$MODELS_DIR/model_manifest.json"

if [ ! -f "$MANIFEST" ]; then
  echo "ERROR: $MANIFEST が見つかりません"
  exit 1
fi

echo "=== Essentia model download ==="
echo "Manifest: $MANIFEST"
echo "Destination: $MODELS_DIR"
echo ""

python3 "$SCRIPT_DIR/_download_models_helper.py" "$MANIFEST" "$MODELS_DIR"
