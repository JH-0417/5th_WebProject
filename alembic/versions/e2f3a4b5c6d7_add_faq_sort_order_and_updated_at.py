"""add faq sort_order and updated_at

Revision ID: e2f3a4b5c6d7
Revises: d1e2f3a4b5c6
Create Date: 2026-10-29 16:00:00.000000

FAQ 수정과 표시 순서 변경을 위해 sort_order, updated_at 컬럼을 추가합니다.
기존 FAQ는 등록 순서(id)를 그대로 표시 순서로 사용합니다.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e2f3a4b5c6d7"
down_revision: Union[str, Sequence[str], None] = "d1e2f3a4b5c6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table("faqs") as batch_op:
        batch_op.add_column(
            sa.Column("sort_order", sa.Integer(), server_default="0", nullable=False)
        )
        batch_op.add_column(
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            )
        )
    op.execute("UPDATE faqs SET sort_order = id, updated_at = created_at")


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table("faqs") as batch_op:
        batch_op.drop_column("updated_at")
        batch_op.drop_column("sort_order")
