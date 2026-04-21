from pathlib import Path

from fastapi import APIRouter

from app.config import settings
from app.services.essentia_service import get_essentia_status

router = APIRouter()


@router.get("/status")
async def essentia_status():
    """Essentia のインポート確認とモデルロード状態を返す。"""
    status = get_essentia_status()

    # 推論に必要な実モデルファイルの存否を追加チェック
    models_dir = Path(settings.models_dir)
    embedding_pb = models_dir / settings.essentia_model_pb
    classifier_pb = models_dir / "genre_discogs400-discogs-effnet-1.pb"
    inference_ready = embedding_pb.exists() and classifier_pb.exists()

    status["inference_ready"] = inference_ready
    if not inference_ready:
        status["status"] = "degraded"
        status["inference_hint"] = "bash scripts/download_models.sh を実行してモデルを配置してください"

    return status
