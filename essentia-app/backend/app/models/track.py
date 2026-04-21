import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Track(Base):
    __tablename__ = "tracks"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    spotify_track_id: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    artist: Mapped[str] = mapped_column(Text, nullable=False)
    album: Mapped[str | None] = mapped_column(Text, nullable=True)
    artwork_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    raw_metadata: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    analyses: Mapped[list["Analysis"]] = relationship(  # noqa: F821
        "Analysis", back_populates="track"
    )
    style_counts: Mapped[list["TrackStyleCount"]] = relationship(  # noqa: F821
        "TrackStyleCount", back_populates="track"
    )
