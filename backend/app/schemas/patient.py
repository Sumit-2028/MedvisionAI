from pydantic import BaseModel, Field
from typing import Optional


class PatientCreate(BaseModel):
    full_name: str = Field(
        ...,
        min_length=2,
        max_length=100
    )

    age: int = Field(
        ...,
        ge=1,
        le=120
    )

    gender: str = Field(
        ...,
        min_length=1,
        max_length=20
    )

    contact_information: Optional[str] = Field(
        default=None,
        max_length=50
    )