"""add member apply fields and join_status

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-08-10 11:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f6a7b8c9d0e1"
down_revision: Union[str, Sequence[str], None] = "e5f6a7b8c9d0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    join_status_enum = sa.Enum(
        "pending", "approved", "rejected", name="member_join_status"
    )
    if bind.dialect.name == "postgresql":
        join_status_enum.create(bind, checkfirst=True)

    with op.batch_alter_table("members") as batch_op:
        batch_op.add_column(
            sa.Column(
                "join_status",
                join_status_enum,
                nullable=False,
                server_default="pending",
            )
        )
        batch_op.add_column(
            sa.Column(
                "apply_reason",
                sa.Text(),
                nullable=False,
                server_default="",
            )
        )
        batch_op.add_column(
            sa.Column(
                "desired_activity",
                sa.Text(),
                nullable=False,
                server_default="",
            )
        )

    # 기존 is_approved=True 회원은 approved 로 맞춤
    op.execute(
        "UPDATE members SET join_status = 'approved' WHERE is_approved IS TRUE"
    )


def downgrade() -> None:
    bind = op.get_bind()
    with op.batch_alter_table("members") as batch_op:
        batch_op.drop_column("desired_activity")
        batch_op.drop_column("apply_reason")
        batch_op.drop_column("join_status")

    if bind.dialect.name == "postgresql":
        sa.Enum(name="member_join_status").drop(bind, checkfirst=True)
