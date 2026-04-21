"""Spotify Client Credentials フローによる曲検索サービス。

OAuth なしでサーバーサイドから Spotify API を叩く。
アクセストークンはプロセス内にメモリキャッシュし、期限切れ時に自動更新する。
"""

import time

import httpx

from app.config import settings
from app.schemas.track import TrackSearchItem

_TOKEN_URL = "https://accounts.spotify.com/api/token"
_SEARCH_URL = "https://api.spotify.com/v1/search"

_cached_token: str | None = None
_token_expires_at: float = 0.0


def _get_access_token() -> str:
    global _cached_token, _token_expires_at

    if _cached_token and time.time() < _token_expires_at - 30:
        return _cached_token

    resp = httpx.post(
        _TOKEN_URL,
        data={"grant_type": "client_credentials"},
        auth=(settings.spotify_client_id, settings.spotify_client_secret),
        timeout=10,
    )
    resp.raise_for_status()
    data = resp.json()
    _cached_token = data["access_token"]
    _token_expires_at = time.time() + data["expires_in"]
    return _cached_token


def get_track_by_id(spotify_id: str) -> TrackSearchItem:
    """Spotify トラック ID から詳細情報を取得する。

    Args:
        spotify_id: Spotify トラック ID

    Returns:
        TrackSearchItem

    Raises:
        httpx.HTTPStatusError: Spotify API エラー（404 等）
    """
    if not settings.spotify_client_id or not settings.spotify_client_secret:
        raise RuntimeError(
            "SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET が設定されていません。"
        )

    token = _get_access_token()
    resp = httpx.get(
        f"https://api.spotify.com/v1/tracks/{spotify_id}",
        headers={"Authorization": f"Bearer {token}"},
        timeout=10,
    )
    resp.raise_for_status()
    item = resp.json()
    images = item.get("album", {}).get("images", [])
    artwork_url = images[0]["url"] if images else None
    return TrackSearchItem(
        spotify_id=item["id"],
        title=item["name"],
        artist=", ".join(a["name"] for a in item.get("artists", [])),
        album=item.get("album", {}).get("name"),
        artwork_url=artwork_url,
    )


def search_tracks(q: str, limit: int = 10) -> list[TrackSearchItem]:
    """Spotify から曲を検索し TrackSearchItem のリストを返す。

    Args:
        q: 検索クエリ
        limit: 取得件数（最大 20）

    Raises:
        httpx.HTTPStatusError: Spotify API エラー
        RuntimeError: Spotify credentials 未設定
    """
    if not settings.spotify_client_id or not settings.spotify_client_secret:
        raise RuntimeError(
            "SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET が設定されていません。"
        )

    token = _get_access_token()
    limit = min(limit, 20)

    resp = httpx.get(
        _SEARCH_URL,
        params={"q": q, "type": "track", "limit": limit},
        headers={"Authorization": f"Bearer {token}"},
        timeout=10,
    )
    resp.raise_for_status()

    items = resp.json().get("tracks", {}).get("items", [])
    results: list[TrackSearchItem] = []
    for item in items:
        images = item.get("album", {}).get("images", [])
        artwork_url = images[0]["url"] if images else None
        results.append(
            TrackSearchItem(
                spotify_id=item["id"],
                title=item["name"],
                artist=", ".join(a["name"] for a in item.get("artists", [])),
                album=item.get("album", {}).get("name"),
                artwork_url=artwork_url,
            )
        )
    return results
