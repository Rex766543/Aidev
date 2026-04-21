"""Essentia 2-stage 推論モジュール。

Stage 1: TensorflowPredictEffnetDiscogs → 1280-dim embedding (per frame)
Stage 2: TensorflowPredict2D           → 400-dim predictions (sigmoid, per frame)
  → フレーム平均 → Top-N スタイル抽出

モデルは起動時に一度だけロードしてプロセス内キャッシュする。
"""

from __future__ import annotations

import logging
from functools import lru_cache
from pathlib import Path

import numpy as np

from app.config import settings
from app.schemas.analysis import StyleItem
from app.services.genre_taxonomy import get_labels
from app.services.label_mapper import parse_label

logger = logging.getLogger(__name__)

_EMBEDDING_OUTPUT = "PartitionedCall:1"
_CLASSIFIER_INPUT = "serving_default_model_Placeholder"
_CLASSIFIER_OUTPUT = "PartitionedCall:0"


@lru_cache(maxsize=1)
def _load_models() -> tuple:
    """Essentia モデルを遅延ロードしてキャッシュする。

    Returns:
        (embedder, classifier) のタプル

    Raises:
        RuntimeError: モデルファイル未配置 / Essentia import 失敗
    """
    try:
        import essentia.standard as es  # noqa: PLC0415
    except ImportError as e:
        raise RuntimeError(f"Essentia が利用できません: {e}") from e

    models_dir = Path(settings.models_dir)
    embedding_pb = models_dir / settings.essentia_model_pb
    classifier_pb = models_dir / "genre_discogs400-discogs-effnet-1.pb"

    if not embedding_pb.exists():
        raise RuntimeError(f"embedding モデルが見つかりません: {embedding_pb}")
    if not classifier_pb.exists():
        raise RuntimeError(f"classifier モデルが見つかりません: {classifier_pb}")

    logger.info("Essentia モデルをロード中...")
    embedder = es.TensorflowPredictEffnetDiscogs(
        graphFilename=str(embedding_pb),
        output=_EMBEDDING_OUTPUT,
    )
    classifier = es.TensorflowPredict2D(
        graphFilename=str(classifier_pb),
        input=_CLASSIFIER_INPUT,
        output=_CLASSIFIER_OUTPUT,
    )
    logger.info("Essentia モデルのロード完了")
    return embedder, classifier


def predict_top_styles(audio: np.ndarray, top_n: int = 3) -> list[StyleItem]:
    """16kHz mono 音声配列に対して推論を実行し、上位 N スタイルを返す。

    Args:
        audio: shape (N,) の float32 numpy 配列（16kHz mono）
        top_n: 返すスタイル数

    Returns:
        StyleItem のリスト（rank 昇順）

    Raises:
        RuntimeError: モデル未配置 / 推論失敗
    """
    embedder, classifier = _load_models()

    # Stage 1: embedding (shape: [frames, 1280])
    embeddings: np.ndarray = embedder(audio)

    # Stage 2: predictions (shape: [frames, 400])
    predictions: np.ndarray = classifier(embeddings)

    # フレーム平均 → shape: (400,)
    avg_preds = np.mean(predictions, axis=0)

    # Top-N インデックス
    top_indices = np.argsort(avg_preds)[::-1][:top_n]

    labels = get_labels()
    results: list[StyleItem] = []
    for rank, idx in enumerate(top_indices, start=1):
        label = labels[idx] if idx < len(labels) else f"Unknown_{idx}"
        parsed = parse_label(label)
        results.append(
            StyleItem(
                rank=rank,
                style=parsed["style"],
                style_class=parsed["class"],
                score=float(avg_preds[idx]),
            )
        )

    return results


def is_model_ready() -> bool:
    """モデルが利用可能かを確認する（/essentia/status 用）。"""
    models_dir = Path(settings.models_dir)
    embedding_pb = models_dir / settings.essentia_model_pb
    classifier_pb = models_dir / "genre_discogs400-discogs-effnet-1.pb"
    return embedding_pb.exists() and classifier_pb.exists()
