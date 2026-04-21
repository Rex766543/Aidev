import uuid
from datetime import datetime

from pydantic import BaseModel


class StyleItem(BaseModel):
    rank: int
    style: str
    style_class: str
    score: float


class AnalysisCreate(BaseModel):
    track_id: uuid.UUID
    client_uid: str
    duration_sec: float | None = None


class AnalysisResponse(BaseModel):
    id: uuid.UUID
    track_id: uuid.UUID
    model_name: str
    model_version: str
    top1_style: str
    top1_class: str
    top_styles: list[StyleItem]
    created_at: datetime

    model_config = {"from_attributes": True}
