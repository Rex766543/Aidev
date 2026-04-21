"""
Essentia サービス
- Essentia のインポート確認
- models/ ディレクトリのモデルファイルロード確認
- モデル未配置時の分かりやすいエラー出力
"""
import os
from pathlib import Path
from typing import Any

MODELS_DIR = Path(os.environ.get("MODELS_DIR", "/app/models"))


def _check_essentia_import() -> dict[str, Any]:
    """Essentia の import を試みる"""
    try:
        import essentia  # noqa: F401
        import essentia.standard  # noqa: F401
        return {"available": True, "version": essentia.__version__}
    except Exception as e:
        return {
            "available": False,
            "error": str(e),
            "hint": (
                "Essentia のネイティブ依存関係または NumPy の互換性を確認してください。"
                " 開発環境では numpy<2 を使うと解消する場合があります。"
            ),
        }


def _check_models() -> dict[str, Any]:
    """models/ ディレクトリのモデルファイルを確認する"""
    if not MODELS_DIR.exists():
        return {
            "found": False,
            "error": f"models ディレクトリが存在しません: {MODELS_DIR}",
            "hint": (
                "プロジェクトルートの models/ に .pb または .json ファイルを配置してください。"
                " 詳細は README の『Essentia モデルの置き場所』を参照。"
            ),
        }

    model_files = list(MODELS_DIR.glob("*.pb")) + list(MODELS_DIR.glob("*.json"))
    model_files = [f for f in model_files if f.name != ".gitkeep"]

    if not model_files:
        return {
            "found": False,
            "error": f"models/ ディレクトリにモデルファイルが見つかりません: {MODELS_DIR}",
            "hint": (
                ".pb または .json 形式のモデルファイルを models/ に配置してください。"
                " モデルの URL は README の TODO セクションを確認してください。"
            ),
        }

    return {
        "found": True,
        "models_dir": str(MODELS_DIR),
        "files": [f.name for f in model_files],
    }


def get_essentia_status() -> dict[str, Any]:
    """Essentia の状態とモデルロード状況をまとめて返す"""
    essentia_info = _check_essentia_import()
    models_info = _check_models()

    overall_ok = essentia_info["available"] and models_info["found"]

    return {
        "status": "ok" if overall_ok else "degraded",
        "essentia": essentia_info,
        "models": models_info,
    }
