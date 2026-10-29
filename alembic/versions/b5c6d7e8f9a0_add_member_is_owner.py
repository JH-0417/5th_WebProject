"""add members.is_owner

Revision ID: b5c6d7e8f9a0
Revises: a4b5c6d7e8f9
Create Date: 2026-10-30 12:00:00.000000

최고관리자(사이트 주인) 표시 컬럼을 추가합니다.
관리자 임명·해제와 최고관리자 양도는 최고관리자만 할 수 있습니다.

최초 최고관리자: 가장 먼저 가입한(id가 가장 작은) admin 회원을 최고관리자로 지정합니다.
다른 사람이 지정되었다면 그 계정으로 POST /admin/owner/transfer 를 호출해 넘기면 됩니다.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b5c6d7e8f9a0"
down_revision: Union[str, Sequence[str], None] = "a4b5c6d7e8f9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table("members") as batch_op:
        batch_op.add_column(
            sa.Column("is_owner", sa.Boolean(), server_default=sa.false(), nullable=False)
        )

    op.execute(
        "UPDATE members SET is_owner = TRUE "
        "WHERE id = (SELECT MIN(id) FROM members WHERE system_role = 'admin')"
    )


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table("members") as batch_op:
        batch_op.drop_column("is_owner")
