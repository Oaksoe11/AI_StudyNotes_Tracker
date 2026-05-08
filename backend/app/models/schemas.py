from enum import Enum
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator


class NoteTone(str, Enum):
    concise = "concise"
    detailed = "detailed"
    exam_prep = "exam_prep"
    beginner = "beginner"


class DocumentStatus(str, Enum):
    uploaded = "uploaded"
    extracting = "extracting"
    generating = "generating"
    completed = "completed"
    failed = "failed"


class FolderCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)

    @field_validator("name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Folder name is required.")
        return cleaned


class FolderUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=120)

    @field_validator("name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Folder name is required.")
        return cleaned


class GenerateNotesRequest(BaseModel):
    document_id: str
    tone: NoteTone = NoteTone.concise
    title: Optional[str] = None


class GenerateQuizRequest(BaseModel):
    document_id: Optional[str] = None
    note_id: Optional[str] = None
    difficulty: Literal["mixed", "easy", "medium", "hard"] = "mixed"
    save_quiz: bool = True
