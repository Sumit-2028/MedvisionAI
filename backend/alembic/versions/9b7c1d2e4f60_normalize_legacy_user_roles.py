"""normalize legacy user roles to physician

Revision ID: 9b7c1d2e4f60
Revises: 864936074412
Create Date: 2026-09-12
"""

from typing import Sequence, Union

from alembic import op


revision: str = "9b7c1d2e4f60"
down_revision: Union[str, Sequence[str], None] = "864936074412"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Accounts created before the PHYSICIAN/ADMIN role model used USER.
    # They are physician workspace accounts in the current architecture.
    op.execute(
        """
        UPDATE users
        SET role = 'PHYSICIAN'
        WHERE role = 'USER'
        """
    )


def downgrade() -> None:
    # This data migration is intentionally not reversed: converting every
    # PHYSICIAN back to USER would also downgrade accounts created later.
    pass
