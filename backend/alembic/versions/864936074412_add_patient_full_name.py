"""add patient full name

Revision ID: 864936074412
Revises: edefe42d94c5
Create Date: 2026-09-11
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "864936074412"
down_revision = "edefe42d94c5"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Add the new patient name column
    op.add_column(
        "patients",
        sa.Column(
            "full_name",
            sa.String(length=100),
            nullable=True
        )
    )

    # 2. Preserve the names of existing patients
    op.execute(
        """
        UPDATE patients
        SET full_name = 'Test User'
        WHERE patient_id = 1
        """
    )

    op.execute(
        """
        UPDATE patients
        SET full_name = 'Test User3'
        WHERE patient_id = 2
        """
    )

    op.execute(
        """
        UPDATE patients
        SET full_name = 'Sumit Kumar Prasad'
        WHERE patient_id = 1000000000
        """
    )

    # 3. Make the field mandatory for all future patients
    op.alter_column(
        "patients",
        "full_name",
        existing_type=sa.String(length=100),
        nullable=False
    )


def downgrade() -> None:
    op.drop_column("patients", "full_name")
