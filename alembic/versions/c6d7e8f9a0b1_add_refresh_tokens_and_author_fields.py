"""add refresh tokens and notice/faq author fields

Revision ID: c6d7e8f9a0b1
Revises: b5c6d7e8f9a0
Create Date: 2026-10-30 14:00:00.000000

- refresh_tokens: 로그인 유지용 Refresh Token(해시) 저장 테이블
- notices, faqs: 작성자(created_by_id)·마지막 수정자(updated_by_id) 컬럼.
  기존 글은 작성자 정보가 없어 NULL로 남습니다.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c6d7e8f9a0b1"
down_revision: Union[str, Sequence[str], None] = "b5c6d7e8f9a0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

AUTHOR_TABLES = ("notices", "faqs")


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "refresh_tokens",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("member_id", sa.Integer(), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["member_id"],
            ["members.id"],
            name=op.f("fk_refresh_tokens_member_id_members"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_refresh_tokens")),
        sa.UniqueConstraint("token_hash", name=op.f("uq_refresh_tokens_token_hash")),
    )
    op.create_index(op.f("ix_refresh_tokens_member_id"), "refresh_tokens", ["member_id"])

    for table in AUTHOR_TABLES:
        with op.batch_alter_table(table) as batch_op:
            for column in ("created_by_id", "updated_by_id"):
                batch_op.add_column(sa.Column(column, sa.Integer(), nullable=True))
                batch_op.create_foreign_key(
                    op.f(f"fk_{table}_{column}_members"),
                    "members",
                    [column],
                    ["id"],
                    ondelete="SET NULL",
                )


def downgrade() -> None:
    """Downgrade schema."""
    for table in AUTHOR_TABLES:
        with op.batch_alter_table(table) as batch_op:
            for column in ("created_by_id", "updated_by_id"):
                batch_op.drop_constraint(op.f(f"fk_{table}_{column}_members"), type_="foreignkey")
                batch_op.drop_column(column)

    op.drop_index(op.f("ix_refresh_tokens_member_id"), table_name="refresh_tokens")
    op.drop_table("refresh_tokens")
