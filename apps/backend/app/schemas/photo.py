import uuid

from pydantic import BaseModel


class PhotoUploadResponse(BaseModel):
    id: uuid.UUID
    width: int
    height: int
