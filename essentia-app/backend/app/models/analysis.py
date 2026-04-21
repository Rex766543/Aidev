import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Analysis(Base):
    __tablename__ = "analyses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    track_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tracks.id", ondelete="CASCADE"), nullable=False
    )
    anonymous_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("anonymous_users.id"), nullable=True
    )
    model_name: Mapped[str] = mapped_column(Text, nullable=False)
    model_version: Mapped[str] = mapped_column(Text, nullable=False)
    # topN 全候補 JSONB: [{"rank":1,"style":"House","class":"Electronic","score":0.42}, ...]
    top_styles: Mapped[list] = mapped_column(JSONB, nullable=False)
    top1_style: Mapped[str] = mapped_column(Text, nullable=False)
    top1_class: Mapped[str] = mapped_column(Text, nullable=False)
    duration_sec: Mapped[float | None] = mapped_column(Float, nullable=True)
    segment_label: Mapped[str | None] = mapped_column(Text, nullable=True)  # want
    flagged: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    track: Mapped["Track"] = relationship("Track", back_populates="analyses")  # noqa: F821
    anonymous_user: Mapped["AnonymousUser | None"] = relationship(  # noqa: F821
        "AnonymousUser", back_populates="analyses"
    )
    styles: Mapped[list["AnalysisStyle"]] = relationship(
        "AnalysisStyle", back_populates="analysis", cascade="all, delete-orphan"
    )
    correction: Mapped["UserCorrection | None"] = relationship(  # noqa: F821
        "UserCorrection", back_populates="analysis", uselist=False
    )


class AnalysisStyle(Base):
    __tablename__ = "analysis_styles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    analysis_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("analyses.id", ondelete="CASCADE"),
        nullable=False,
    )
    rank: Mapped[int] = mapped_column(Integer, nullable=False)
    style: Mapped[str] = mapped_column(Text, nullable=False)
    style_class: Mapped[str] = mapped_column(Text, nullable=False)
    score: Mapped[float] = mapped_column(Float, nullable=False)

    analysis: Mapped["Analysis"] = relationship("Analysis", back_populates="styles")


class TrackStyleCount(Base):
    """曲ごとのジャンル分布カウント（want: 将来の集計 UI 用）。"""

    __tablename__ = "track_style_counts"

    track_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tracks.id", ondelete="CASCADE"),
        primary_key=True,
    )
    style: Mapped[str] = mapped_column(Text, primary_key=True)
    style_class: Mapped[str] = mapped_column(Text, nullable=False)
    source: Mapped[str] = mapped_column(String(10), primary_key=True)  # 'model' | 'user'
    count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_updated: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    track: Mapped["Track"] = relationship("Track", back_populates="style_counts")  # noqa: F821
