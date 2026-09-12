from datetime import datetime
import random
from sqlalchemy import (
    Integer,
    BigInteger,
    String,
    Float,
    Text,
    DateTime,
    ForeignKey,
    Sequence,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.connection import Base


class User(Base):
    __tablename__ = "users"

    user_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    full_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    email: Mapped[str] = mapped_column(
        String(150),
        unique=True,
        nullable=False,
        index=True
    )

    password: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    role: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="PHYSICIAN"
    )

    registration_date: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    administrator: Mapped["Administrator | None"] = relationship(
        back_populates="user",
        uselist=False
    )


class Patient(Base):
    __tablename__ = "patients"

    patient_id: Mapped[int] = mapped_column(
        BigInteger,
        Sequence("patients_patient_id_seq", start=1_000_000_000),
        primary_key=True
    )

    created_by: Mapped[int] = mapped_column(
        ForeignKey("users.user_id"),
        nullable=False,
        index=True
    )

    full_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    age: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )

    gender: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True
    )

    contact_information: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True
    )

    created_by_user: Mapped["User"] = relationship(
        foreign_keys=[created_by]
    )

    diagnoses: Mapped[list["Diagnosis"]] = relationship(
        back_populates="patient",
        cascade="all, delete-orphan"
    )

    
class Administrator(Base):
    __tablename__ = "administrators"

    admin_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.user_id"),
        unique=True,
        nullable=False
    )

    user: Mapped["User"] = relationship(
        back_populates="administrator"
    )


class Diagnosis(Base):
    __tablename__ = "diagnoses"

    diagnosis_id: Mapped[int] = mapped_column(
        BigInteger,
        Sequence("diagnoses_diagnosis_id_seq", start=1_000_000_000),
        primary_key=True
    )

    patient_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("patients.patient_id"),
        nullable=False
    )

    image_path: Mapped[str] = mapped_column(String(500), nullable=False)
    predicted_disease: Mapped[str] = mapped_column(String(100), nullable=False)
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False)
    heatmap_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    diagnosis_timestamp: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )
    result_status: Mapped[str] = mapped_column(String(20), nullable=False)
    findings_json: Mapped[str] = mapped_column(Text, nullable=False)
    all_predictions_json: Mapped[str] = mapped_column(Text, nullable=False)

    patient: Mapped["Patient"] = relationship(back_populates="diagnoses")

    medical_report: Mapped["MedicalReport | None"] = relationship(
        back_populates="diagnosis",
        uselist=False,
        cascade="all, delete-orphan"
    )

class MedicalReport(Base):
    __tablename__ = "medical_reports"

    report_id: Mapped[int] = mapped_column(
        BigInteger,
        Sequence("medical_reports_report_id_seq", start=1_000_000_000),
        primary_key=True
    )

    diagnosis_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("diagnoses.diagnosis_id"),
        unique=True,
        nullable=False
    )

    report_path: Mapped[str] = mapped_column(String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    diagnosis: Mapped["Diagnosis"] = relationship(
        back_populates="medical_report"
    )