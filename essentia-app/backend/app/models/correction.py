import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class UserCorrection(Base):
    __tablename__ = "user_corrections"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    analysis_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("analyses.id", ondelete="CASCADE"),
        nullable=False,
    )
    anonymous_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("anonymous_users.id"), nullable=True
    )
    corrected_style: Mapped[str] = mapped_column(Text, nullable=False)
    corrected_class: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    analysis: Mapped["Analysis"] = relationship(  # noqa: F821
        "Analysis", back_populates="correction"
    )
    anonymous_user: Mapped["AnonymousUser | None"] = relationship(  # noqa: F821
        "AnonymousUser", back_populates="corrections"
    )
