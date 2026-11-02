import uuid
from typing import Annotated

from pydantic import BaseModel, StringConstraints

TAG_NAME_MAX_LENGTH = 50

TagName = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=TAG_NAME_MAX_LENGTH)
]


class TagInput(BaseModel):
    name: TagName


class TagSummary(BaseModel):
    id: uuid.UUID
    name: str
    key: str | None


class TagResponse(TagSummary):
    is_own: bool
