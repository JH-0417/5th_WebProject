"""add study schedule, location and recruiting fields

Revision ID: a4b5c6d7e8f9
Revises: f3a4b5c6d7e8
Create Date: 2026-10-30 11:00:00.000000

스터디(projects.category = 'study') 운영 정보를 저장할 컬럼을 추가합니다.
- meeting_schedule: 모임 일정 (예: "매주 수요일 19:00~20:00")
- location: 모임 장소
- is_recruiting: 스터디원 모집 중 여부 (기존 행은 false)
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a4b5c6d7e8f9"
down_revision: Union[str, Sequence[str], None] = "f3a4b5c6d7e8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table("projects") as batch_op:
        batch_op.add_column(sa.Column("meeting_schedule", sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column("location", sa.String(length=100), nullable=True))
        batch_op.add_column(
            sa.Column("is_recruiting", sa.Boolean(), server_default=sa.false(), nullable=False)
        )


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table("projects") as batch_op:
        batch_op.drop_column("is_recruiting")
        batch_op.drop_column("location")
        batch_op.drop_column("meeting_schedule")
