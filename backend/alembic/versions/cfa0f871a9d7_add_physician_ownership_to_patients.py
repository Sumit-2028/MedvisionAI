"""add physician ownership to patients

Revision ID: cfa0f871a9d7
Revises: 2c7220a15d02
Create Date: 2026-09-11 22:29:34.335742
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "cfa0f871a9d7"
down_revision: Union[str, Sequence[str], None] = "2c7220a15d02"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    # =========================================================
    # 1. Add created_by column
    # =========================================================
    # Initially nullable because existing patients already exist.
    op.add_column(
        "patients",
        sa.Column(
            "created_by",
            sa.Integer(),
            nullable=True
        )
    )

    # =========================================================
    # 2. Assign existing patients to their current user
    # =========================================================
    #
    # Existing structure:
    #
    # patients.user_id -> users.user_id
    #
    # We use that relationship to populate created_by
    # for the existing records.
    #
    op.execute(
        """
        UPDATE patients
        SET created_by = user_id
        WHERE created_by IS NULL
        """
    )

    # =========================================================
    # 3. Add foreign key
    # =========================================================

    op.create_foreign_key(
        "fk_patients_created_by_users",
        "patients",
        "users",
        ["created_by"],
        ["user_id"]
    )

    # =========================================================
    # 4. Add index
    # =========================================================

    op.create_index(
        "ix_patients_created_by",
        "patients",
        ["created_by"],
        unique=False
    )

    # =========================================================
    # 5. Make created_by mandatory
    # =========================================================

    op.alter_column(
        "patients",
        "created_by",
        existing_type=sa.Integer(),
        nullable=False
    )


def downgrade() -> None:
    """Downgrade schema."""

    # Remove index
    op.drop_index(
        "ix_patients_created_by",
        table_name="patients"
    )

    # Remove foreign key
    op.drop_constraint(
        "fk_patients_created_by_users",
        "patients",
        type_="foreignkey"
    )

    # Remove column
    op.drop_column(
        "patients",
        "created_by"
    )