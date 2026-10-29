"""create recruitment settings table

Revision ID: d1e2f3a4b5c6
Revises: c0d1e2f3a4b5
Create Date: 2026-10-29 15:00:00.000000

관리자가 모집을 열었을 때만 가입 신청을 받도록 모집 설정 테이블(단일 행)을 만듭니다.
처음에는 '닫힘' 상태로 시작합니다.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d1e2f3a4b5c6"
down_revision: Union[str, Sequence[str], None] = "c0d1e2f3a4b5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "recruitment_settings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("is_open", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("message", sa.String(length=200), nullable=True),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_recruitment_settings")),
    )
    op.execute("INSERT INTO recruitment_settings (id, is_open) VALUES (1, false)")


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("recruitment_settings")
