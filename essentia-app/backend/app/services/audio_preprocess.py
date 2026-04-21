"""音声前処理モジュール。

受け取った音声バイト列を一時ファイルに書き出し、
Essentia の MonoLoader で 16kHz mono numpy 配列に変換して返す。
一時ファイルは try/finally で必ず削除する（音声非保存原則）。
"""

import os
import tempfile
from typing import Literal

import numpy as np

AudioFormat = Literal["webm", "ogg", "wav", "mp3"]


def load_audio_16k(audio_bytes: bytes, fmt: AudioFormat = "webm") -> np.ndarray:
    """音声バイト列を 16kHz mono の numpy float32 配列として返す。

    Args:
        audio_bytes: ブラウザから受け取った録音データ（multipart/form-data の bytes）
        fmt: 音声フォーマット（拡張子として一時ファイル名に付与する）

    Returns:
        shape (N,) の float32 numpy 配列（16kHz mono）

    Raises:
        RuntimeError: Essentia が利用不可 / デコード失敗
    """
    try:
        import essentia.standard as es  # noqa: PLC0415
    except ImportError as e:
        raise RuntimeError(f"Essentia が利用できません: {e}") from e

    suffix = f".{fmt}"
    tmp_path: str | None = None
    try:
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as f:
            f.write(audio_bytes)
            tmp_path = f.name

        loader = es.MonoLoader(
            filename=tmp_path,
            sampleRate=16000,
            resampleQuality=4,
        )
        audio: np.ndarray = loader()
        return audio
    except Exception as e:
        raise RuntimeError(f"音声の読み込みに失敗しました: {e}") from e
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)
