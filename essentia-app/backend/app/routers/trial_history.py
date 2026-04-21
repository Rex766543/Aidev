"""履歴ルーター。

GET /api/my/history — 匿名ユーザの過去の解析試行履歴
"""

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.models.analysis import Analysis
from app.models.anonymous_user import AnonymousUser
from app.models.correction import UserCorrection
from app.models.track import Track

router = APIRouter()


class TrackSummary(BaseModel):
    id: str          # 内部 UUID（再録音リンク生成に使用）
    spotify_id: str
    title: str
    artist: str
    artwork_url: str | None


class HistoryItem(BaseModel):
    analysis_id: str
    track: TrackSummary
    top1_style: str
    top1_class: str
    corrected_style: str | None
    created_at: str


class HistoryResponse(BaseModel):
    items: list[HistoryItem]


@router.get("", response_model=HistoryResponse)
def get_history(
    client_uid: str = Query(...),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """匿名ユーザの解析履歴を返す。"""
    user = (
        db.query(AnonymousUser)
        .filter(AnonymousUser.client_uid == client_uid)
        .first()
    )
    if not user:
        return HistoryResponse(items=[])

    analyses = (
        db.query(Analysis)
        .filter(Analysis.anonymous_user_id == user.id)
        .order_by(Analysis.created_at.desc())
        .limit(limit)
        .all()
    )

    items: list[HistoryItem] = []
    for analysis in analyses:
        track = db.query(Track).filter(Track.id == analysis.track_id).first()
        if not track:
            continue

        correction = (
            db.query(UserCorrection)
            .filter(UserCorrection.analysis_id == analysis.id)
            .first()
        )

        items.append(
            HistoryItem(
                analysis_id=str(analysis.id),
                track=TrackSummary(
                    id=str(track.id),
                    spotify_id=track.spotify_track_id,
                    title=track.title,
                    artist=track.artist,
                    artwork_url=track.artwork_url,
                ),
                top1_style=analysis.top1_style,
                top1_class=analysis.top1_class,
                corrected_style=correction.corrected_style if correction else None,
                created_at=analysis.created_at.isoformat(),
            )
        )

    return HistoryResponse(items=items)
