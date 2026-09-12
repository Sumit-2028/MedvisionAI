"""replace patient user relationship

Revision ID: edefe42d94c5
Revises: cfa0f871a9d7
Create Date: 2026-09-11 23:00:44.666704
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "edefe42d94c5"
down_revision: Union[str, Sequence[str], None] = "cfa0f871a9d7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    # =========================================================
    # 1. Assign ALL existing patients to Sumit's physician
    # =========================================================
    #
    # Sumit's user_id = 3
    #
    # Existing patient records are preserved.
    # Only their physician ownership is changed.
    #
    op.execute(
        """
        UPDATE patients
        SET created_by = 3
        """
    )

    # =========================================================
    # 2. Remove old foreign key
    # =========================================================

    op.drop_constraint(
        "patients_user_id_fkey",
        "patients",
        type_="foreignkey"
    )

    # =========================================================
    # 3. Remove old unique constraint
    # =========================================================

    op.drop_constraint(
        "patients_user_id_key",
        "patients",
        type_="unique"
    )

    # =========================================================
    # 4. Remove old user_id column
    # =========================================================

    op.drop_column(
        "patients",
        "user_id"
    )


def downgrade() -> None:
    """Downgrade schema."""

    # =========================================================
    # 1. Restore user_id column
    # =========================================================

    op.add_column(
        "patients",
        sa.Column(
            "user_id",
            sa.Integer(),
            nullable=True
        )
    )

    # =========================================================
    # 2. Restore values from created_by
    # =========================================================

    op.execute(
        """
        UPDATE patients
        SET user_id = created_by
        """
    )

    # =========================================================
    # 3. Make user_id NOT NULL
    # =========================================================

    op.alter_column(
        "patients",
        "user_id",
        existing_type=sa.Integer(),
        nullable=False
    )

    # =========================================================
    # 4. Restore foreign key
    # =========================================================

    op.create_foreign_key(
        "patients_user_id_fkey",
        "patients",
        "users",
        ["user_id"],
        ["user_id"]
    )

    # =========================================================
    # 5. Restore unique constraint
    # =========================================================

    op.create_unique_constraint(
        "patients_user_id_key",
        "patients",
        ["user_id"]
    )