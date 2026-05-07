from enum import Enum
from typing import Optional

from pydantic import BaseModel


class NoteTone(str, Enum):
    concise = "concise"
    detailed = "detailed"
    exam_prep = "exam_prep"
    beginner = "beginner"


class FolderCreate(BaseModel):
    name: str


class FolderUpdate(BaseModel):
    name: str


class GenerateNotesRequest(BaseModel):
    document_id: str
    tone: NoteTone
    title: Optional[str] = None

