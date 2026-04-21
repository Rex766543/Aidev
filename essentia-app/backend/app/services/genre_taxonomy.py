"""Discogs-EffNet の全クラスラベル一覧を提供するモジュール。

モデルの JSON メタデータファイルから読み込む。
モデル未配置時は空リストを返す（degraded 動作）。
"""

import json
from functools import lru_cache
from pathlib import Path

from app.config import settings


@lru_cache(maxsize=1)
def get_labels() -> list[str]:
    """classifier モデルの JSON から "classes" リストを取得する。"""
    models_dir = Path(settings.models_dir)
    classifier_json = models_dir / "genre_discogs400-discogs-effnet-1.json"

    if not classifier_json.exists():
        return []

    try:
        with open(classifier_json) as f:
            meta = json.load(f)
        # Essentia モデルメタデータの標準パス
        return meta["classes"]
    except (KeyError, json.JSONDecodeError, OSError):
        return []


def get_all_styles() -> list[dict[str, str]]:
    """全ラベルを {class, style} のリストとして返す（補正 UI 用）。"""
    from app.services.label_mapper import parse_label

    return [parse_label(label) for label in get_labels()]
