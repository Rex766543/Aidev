import uuid
from datetime import datetime

from pydantic import BaseModel


class CorrectionRequest(BaseModel):
    corrected_style: str
    corrected_class: str
    client_uid: str


class CorrectionResponse(BaseModel):
    id: uuid.UUID
    analysis_id: uuid.UUID
    corrected_style: str
    corrected_class: str
    created_at: datetime

    model_config = {"from_attributes": True}
