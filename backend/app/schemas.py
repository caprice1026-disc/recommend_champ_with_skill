from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class StrictModel(BaseModel):
    model_config = ConfigDict(extra='forbid')


class FeedbackRequest(StrictModel):
    diagnosisVersion: str = Field(min_length=1)
    satisfaction: Literal['satisfied', 'partial', 'disagree']
    selfReportedStrongChampions: list[str] = Field(default_factory=list, max_length=5)
    frequentlyPlayedChampions: list[str] = Field(default_factory=list, max_length=5)
    wouldTryRecommendation: bool | None = None
    comment: str = Field(default='', max_length=2000)


class DiagnosisSaveRequest(StrictModel):
    diagnosisVersion: str = Field(min_length=1)
    consentToSave: bool
    abilityVector: dict[str, float]
    subscores: dict[str, Any]
    confidence: dict[str, float]
    recommendations: dict[str, Any]
    aptitudeTypes: dict[str, Any]
    configVersions: dict[str, str]
    createdAt: datetime


class SaveResponse(StrictModel):
    resultId: str
    saved: bool

