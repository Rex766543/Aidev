import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class AnonymousUser(Base):
    __tablename__ = "anonymous_users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    client_uid: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    analyses: Mapped[list["Analysis"]] = relationship(  # noqa: F821
        "Analysis", back_populates="anonymous_user"
    )
    corrections: Mapped[list["UserCorrection"]] = relationship(  # noqa: F821
        "UserCorrection", back_populates="anonymous_user"
    )
