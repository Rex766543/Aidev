"""解析ルーター。

POST /api/analyses                        — 録音音声を推論
GET  /api/analyses/{analysis_id}          — 解析結果取得
PUT  /api/analyses/{analysis_id}/correction — ユーザ補正
"""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_or_create_anon_user
from app.limiter import limiter
from app.models.analysis import Analysis, AnalysisStyle, TrackStyleCount
from app.models.correction import UserCorrection
from app.models.track import Track
from app.schemas.analysis import AnalysisResponse, StyleItem
from app.schemas.correction import CorrectionRequest, CorrectionResponse
from app.services.audio_preprocess import load_audio_16k
from app.services.essentia_inference import predict_top_styles

router = APIRouter()


def _increment_style_counts(
    db: Session,
    track_id: uuid.UUID,
    style_items: list[StyleItem],
    source: str,
) -> None:
    """track_style_counts を upsert する（model or user ソース）。"""
    for item in style_items:
        existing = (
            db.query(TrackStyleCount)
            .filter(
                TrackStyleCount.track_id == track_id,
                TrackStyleCount.style == item.style,
                TrackStyleCount.source == source,
            )
            .first()
        )
        if existing:
            existing.count += 1
        else:
            db.add(
                TrackStyleCount(
                    track_id=track_id,
                    style=item.style,
                    style_class=item.style_class,
                    source=source,
                    count=1,
                )
            )


@router.post("", response_model=AnalysisResponse)
@limiter.limit("30/minute")
async def create_analysis(
    request: Request,
    audio: Annotated[UploadFile, File(description="録音ファイル（webm/wav）")],
    track_id: Annotated[uuid.UUID, Form()],
    client_uid: Annotated[str, Form()],
    duration_sec: Annotated[float | None, Form()] = None,
    db: Session = Depends(get_db),
):
    """録音音声を Essentia で推論し、解析結果を返す。音声は推論後に即削除。"""
    # track の存在確認
    track = db.query(Track).filter(Track.id == track_id).first()
    if not track:
        raise HTTPException(status_code=404, detail="track_id が見つかりません")

    anon_user = get_or_create_anon_user(client_uid, db)

    # 音声読み込み（完了後に tempfile は自動削除）
    audio_bytes = await audio.read()
    content_type = audio.content_type or ""
    fmt = "wav" if "wav" in content_type else "webm"
    try:
        audio_array = load_audio_16k(audio_bytes, fmt=fmt)  # type: ignore[arg-type]
    except RuntimeError as e:
        raise HTTPException(status_code=422, detail=str(e))

    # Essentia 推論
    try:
        top_styles = predict_top_styles(audio_array, top_n=10)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    if not top_styles:
        raise HTTPException(status_code=500, detail="推論結果が空です")

    top1 = top_styles[0]

    # Analysis 保存
    from app.config import settings  # noqa: PLC0415

    analysis = Analysis(
        track_id=track_id,
        anonymous_user_id=anon_user.id,
        model_name=settings.essentia_model_name,
        model_version=settings.essentia_model_version,
        top_styles=[s.model_dump() for s in top_styles],
        top1_style=top1.style,
        top1_class=top1.style_class,
        duration_sec=duration_sec,
    )
    db.add(analysis)
    db.flush()  # id を確定させる

    # AnalysisStyle 保存
    for item in top_styles:
        db.add(
            AnalysisStyle(
                analysis_id=analysis.id,
                rank=item.rank,
                style=item.style,
                style_class=item.style_class,
                score=item.score,
            )
        )

    # track_style_counts 更新
    _increment_style_counts(db, track_id, top_styles, source="model")

    db.commit()
    db.refresh(analysis)
    return analysis


@router.get("/{analysis_id}", response_model=AnalysisResponse)
def get_analysis(analysis_id: uuid.UUID, db: Session = Depends(get_db)):
    """解析結果を返す。"""
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="解析結果が見つかりません")
    return analysis


@router.put("/{analysis_id}/correction", response_model=CorrectionResponse)
def correct_analysis(
    analysis_id: uuid.UUID,
    body: CorrectionRequest,
    db: Session = Depends(get_db),
):
    """ユーザが推定スタイルを補正する。"""
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="解析結果が見つかりません")

    anon_user = get_or_create_anon_user(body.client_uid, db)

    # 既存の補正があれば上書き
    correction = (
        db.query(UserCorrection)
        .filter(UserCorrection.analysis_id == analysis_id)
        .first()
    )
    if correction:
        correction.corrected_style = body.corrected_style
        correction.corrected_class = body.corrected_class
        correction.anonymous_user_id = anon_user.id
    else:
        correction = UserCorrection(
            analysis_id=analysis_id,
            anonymous_user_id=anon_user.id,
            corrected_style=body.corrected_style,
            corrected_class=body.corrected_class,
        )
        db.add(correction)
        # 補正スタイルも track_style_counts に記録
        _increment_style_counts(
            db,
            analysis.track_id,
            [StyleItem(rank=1, style=body.corrected_style, style_class=body.corrected_class, score=1.0)],
            source="user",
        )

    db.commit()
    db.refresh(correction)
    return correction
