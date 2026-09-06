"""update patient and diagnosis id generation

Revision ID: f3573cb39933
Revises: 84431d117900
Create Date: 2026-09-03 21:38:00.345731
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "f3573cb39933"
down_revision: Union[str, Sequence[str], None] = "84431d117900"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Change Patient ID from INTEGER to BIGINT
    op.alter_column(
        "patients",
        "patient_id",
        existing_type=sa.Integer(),
        type_=sa.BigInteger(),
        existing_nullable=False,
    )

    # Change Diagnosis ID from INTEGER to BIGINT
    op.alter_column(
        "diagnoses",
        "diagnosis_id",
        existing_type=sa.Integer(),
        type_=sa.BigInteger(),
        existing_nullable=False,
    )

    # Change Diagnosis.patient_id to BIGINT
    op.alter_column(
        "diagnoses",
        "patient_id",
        existing_type=sa.Integer(),
        type_=sa.BigInteger(),
        existing_nullable=False,
    )

    # Change MedicalReport.diagnosis_id to BIGINT
    op.alter_column(
        "medical_reports",
        "diagnosis_id",
        existing_type=sa.Integer(),
        type_=sa.BigInteger(),
        existing_nullable=False,
    )

    # Make new Patient IDs start at 1,000,000,000
    op.execute(
        """
        SELECT setval(
            'patients_patient_id_seq',
            GREATEST(
                COALESCE((SELECT MAX(patient_id) FROM patients), 999999999),
                999999999
            ),
            true
        )
        """
    )

    # Make new Diagnosis IDs start at 1,000,000,000
    op.execute(
        """
        SELECT setval(
            'diagnoses_diagnosis_id_seq',
            GREATEST(
                COALESCE((SELECT MAX(diagnosis_id) FROM diagnoses), 999999999),
                999999999
            ),
            true
        )
        """
    )


def downgrade() -> None:
    # Change MedicalReport.diagnosis_id back to INTEGER
    op.alter_column(
        "medical_reports",
        "diagnosis_id",
        existing_type=sa.BigInteger(),
        type_=sa.Integer(),
        existing_nullable=False,
    )

    # Change Diagnosis.patient_id back to INTEGER
    op.alter_column(
        "diagnoses",
        "patient_id",
        existing_type=sa.BigInteger(),
        type_=sa.Integer(),
        existing_nullable=False,
    )

    # Change Diagnosis ID back to INTEGER
    op.alter_column(
        "diagnoses",
        "diagnosis_id",
        existing_type=sa.BigInteger(),
        type_=sa.Integer(),
        existing_nullable=False,
    )

    # Change Patient ID back to INTEGER
    op.alter_column(
        "patients",
        "patient_id",
        existing_type=sa.BigInteger(),
        type_=sa.Integer(),
        existing_nullable=False,
    )