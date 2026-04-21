import uuid
from datetime import datetime

from pydantic import BaseModel, HttpUrl


class TrackSearchItem(BaseModel):
    spotify_id: str
    title: str
    artist: str
    album: str | None
    artwork_url: str | None


class TrackSearchResponse(BaseModel):
    items: list[TrackSearchItem]


class TrackUpsertRequest(BaseModel):
    spotify_id: str


class TrackResponse(BaseModel):
    id: uuid.UUID
    spotify_track_id: str
    title: str
    artist: str
    album: str | None
    artwork_url: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
