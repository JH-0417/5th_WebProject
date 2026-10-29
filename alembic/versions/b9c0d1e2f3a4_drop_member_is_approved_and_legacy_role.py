"""drop members.is_approved and legacy members.role

Revision ID: b9c0d1e2f3a4
Revises: a8b9c0d1e2f3
Create Date: 2026-10-29 13:00:00.000000

- members.is_approved: join_status와 같은 정보를 중복 저장하던 컬럼을 제거합니다.
  승인 여부는 이제 join_status == "approved" 로만 판단합니다. (MemberDB.is_approved 속성)
- members.role: system_role / club_position 으로 나뉜 뒤 전환 기간 동안만 남겨둔 옛 컬럼을 제거합니다.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "b9c0d1e2f3a4"
down_revision: Union[str, Sequence[str], None] = "a8b9c0d1e2f3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

OLD_ROLES = ("admin", "pm", "member")


def _old_role_enum(dialect_name: str):
    if dialect_name == "postgresql":
        return postgresql.ENUM(*OLD_ROLES, name="member_role", create_type=False)
    return sa.Enum(*OLD_ROLES, name="member_role")


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()

    # 혹시 두 값이 어긋난 회원이 있으면 승인된 쪽(is_approved=True)을 기준으로 맞춘 뒤 제거합니다.
    op.execute(
        "UPDATE members SET join_status = 'approved' "
        "WHERE is_approved IS TRUE AND join_status != 'approved'"
    )

    with op.batch_alter_table("members") as batch_op:
        batch_op.drop_column("is_approved")
        batch_op.drop_column("role")

    if bind.dialect.name == "postgresql":
        postgresql.ENUM(name="member_role").drop(bind, checkfirst=True)


def downgrade() -> None:
    """Downgrade schema."""
    bind = op.get_bind()
    dialect_name = bind.dialect.name

    if dialect_name == "postgresql":
        postgresql.ENUM(*OLD_ROLES, name="member_role").create(bind, checkfirst=True)

    with op.batch_alter_table("members") as batch_op:
        batch_op.add_column(
            sa.Column(
                "is_approved",
                sa.Boolean(),
                nullable=False,
                server_default=sa.false(),
            )
        )
        batch_op.add_column(
            sa.Column(
                "role",
                _old_role_enum(dialect_name),
                nullable=False,
                server_default="member",
            )
        )

    op.execute("UPDATE members SET is_approved = TRUE WHERE join_status = 'approved'")
    op.execute("UPDATE members SET role = 'pm' WHERE club_position != 'member'")
    op.execute("UPDATE members SET role = 'admin' WHERE system_role = 'admin'")
