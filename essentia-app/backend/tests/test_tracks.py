from unittest.mock import patch

from app.schemas.track import TrackSearchItem, TrackResponse


MOCK_ITEMS = [
    TrackSearchItem(
        spotify_id="abc123",
        title="Test Song",
        artist="Test Artist",
        album="Test Album",
        artwork_url=None,
    )
]


def test_search_missing_query(client):
    """q パラメータなしは 422"""
    resp = client.get("/api/tracks/search")
    assert resp.status_code == 422


def test_search_spotify_unavailable(client):
    """Spotify 未設定時は 503"""
    with patch(
        "app.routers.tracks.search_tracks",
        side_effect=RuntimeError("credentials missing"),
    ):
        resp = client.get("/api/tracks/search?q=test")
    assert resp.status_code == 503


def test_search_ok(client):
    """Spotify が返せば 200 + items"""
    with patch("app.routers.tracks.search_tracks", return_value=MOCK_ITEMS):
        resp = client.get("/api/tracks/search?q=test")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["spotify_id"] == "abc123"


def test_upsert_track_creates_new(client):
    """初回 upsert → DB に登録して返す"""
    mock_info = TrackSearchItem(
        spotify_id="xyz999",
        title="New Song",
        artist="New Artist",
        album=None,
        artwork_url=None,
    )
    with patch("app.routers.tracks.get_track_by_id", return_value=mock_info):
        resp = client.post("/api/tracks", json={"spotify_id": "xyz999"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["spotify_track_id"] == "xyz999"
    assert data["title"] == "New Song"


def test_upsert_track_returns_existing(client, db_session):
    """2回目は Spotify を叩かずに既存レコードを返す"""
    mock_info = TrackSearchItem(
        spotify_id="dup001",
        title="Dup Song",
        artist="Dup Artist",
        album=None,
        artwork_url=None,
    )
    with patch("app.routers.tracks.get_track_by_id", return_value=mock_info):
        resp1 = client.post("/api/tracks", json={"spotify_id": "dup001"})
    assert resp1.status_code == 200

    # 2回目は get_track_by_id を呼ばない
    with patch("app.routers.tracks.get_track_by_id", side_effect=AssertionError("should not call")):
        resp2 = client.post("/api/tracks", json={"spotify_id": "dup001"})
    assert resp2.status_code == 200
    assert resp1.json()["id"] == resp2.json()["id"]
