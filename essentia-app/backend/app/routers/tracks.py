"""曲検索・upsert ルーター。

GET  /api/tracks/search  — Spotify 経由で曲を検索
POST /api/tracks         — 選択した曲を内部 DB に upsert
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.models.track import Track
from app.schemas.track import TrackResponse, TrackSearchResponse, TrackUpsertRequest
from app.services.spotify_service import get_track_by_id, search_tracks

router = APIRouter()


@router.get("/search", response_model=TrackSearchResponse)
def search(
    q: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=20),
):
    """Spotify から曲を検索して返す。"""
    try:
        items = search_tracks(q, limit)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Spotify API エラー: {e}")
    return TrackSearchResponse(items=items)


@router.post("", response_model=TrackResponse)
def upsert_track(body: TrackUpsertRequest, db: Session = Depends(get_db)):
    """選択した曲を内部 DB に upsert して返す。"""
    track = (
        db.query(Track)
        .filter(Track.spotify_track_id == body.spotify_id)
        .first()
    )
    if track:
        return track

    # Spotify から詳細取得
    try:
        info = get_track_by_id(body.spotify_id)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Spotify API エラー: {e}")

    track = Track(
        spotify_track_id=info.spotify_id,
        title=info.title,
        artist=info.artist,
        album=info.album,
        artwork_url=info.artwork_url,
    )
    db.add(track)
    db.commit()
    db.refresh(track)
    return track
