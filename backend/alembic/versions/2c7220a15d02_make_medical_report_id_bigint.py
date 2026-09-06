"""make medical report id bigint

Revision ID: 2c7220a15d02
Revises: f3573cb39933
Create Date: 2026-09-04 01:04:09.405989

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2c7220a15d02'
down_revision: Union[str, Sequence[str], None] = 'f3573cb39933'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:

    op.alter_column(
        "medical_reports",
        "report_id",
        existing_type=sa.Integer(),
        type_=sa.BigInteger(),
        existing_nullable=False,
    )

    op.execute(
        """
        SELECT setval(
            'medical_reports_report_id_seq',
            GREATEST(
                COALESCE(
                    (SELECT MAX(report_id) FROM medical_reports),
                    999999999
                ),
                999999999
            ),
            true
        )
        """
    )


def downgrade() -> None:

    op.alter_column(
        "medical_reports",
        "report_id",
        existing_type=sa.BigInteger(),
        type_=sa.Integer(),
        existing_nullable=False,
    )