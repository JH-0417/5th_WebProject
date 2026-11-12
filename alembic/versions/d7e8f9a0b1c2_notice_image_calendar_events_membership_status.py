"""notice image, separate calendar events, activity membership status

Revision ID: d7e8f9a0b1c2
Revises: c6d7e8f9a0b1
Create Date: 2026-11-12 20:00:00.000000

- notices.image_url: 공지 첨부 이미지 URL
- calendar_events: 공지사항과 분리한 일정 테이블.
  기존 공지 중 event_start가 있던 항목은 일정으로 복사합니다.
  (notices의 event_* / location 컬럼은 데이터 보존을 위해 지우지 않고 사용만 중단합니다.)
- activity_memberships.status: 프로젝트·스터디 가입 신청(pending) / 확정(approved).
  기존 행은 모두 approved 로 둡니다.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "d7e8f9a0b1c2"
down_revision: Union[str, Sequence[str], None] = "c6d7e8f9a0b1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

MEMBERSHIP_STATUSES = ("pending", "approved")


def _status_enum(dialect_name: str):
    if dialect_name == "postgresql":
        return postgresql.ENUM(
            *MEMBERSHIP_STATUSES, name="activity_membership_status", create_type=False
        )
    return sa.Enum(*MEMBERSHIP_STATUSES, name="activity_membership_status")


def upgrade() -> None:
    bind = op.get_bind()
    dialect_name = bind.dialect.name

    # 1) 공지 이미지
    with op.batch_alter_table("notices") as batch_op:
        batch_op.add_column(sa.Column("image_url", sa.String(length=500), nullable=True))

    # 2) 일정 테이블 + 기존 공지 일정 복사
    op.create_table(
        "calendar_events",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("public_id", sa.String(length=36), nullable=False),
        sa.Column("title", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("event_start", sa.DateTime(timezone=True), nullable=False),
        sa.Column("event_end", sa.DateTime(timezone=True), nullable=True),
        sa.Column("location", sa.String(length=200), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("created_by_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(
            ["created_by_id"],
            ["members.id"],
            name=op.f("fk_calendar_events_created_by_id_members"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_calendar_events")),
        sa.UniqueConstraint("public_id", name=op.f("uq_calendar_events_public_id")),
    )
    op.create_index(
        op.f("ix_calendar_events_event_start"), "calendar_events", ["event_start"]
    )
    op.execute(
        "INSERT INTO calendar_events "
        "(public_id, title, description, event_start, event_end, location, "
        "created_at, updated_at, created_by_id) "
        "SELECT public_id, title, content, event_start, event_end, location, "
        "created_at, updated_at, created_by_id "
        "FROM notices WHERE event_start IS NOT NULL"
    )

    # 3) 프로젝트·스터디 가입 신청 상태
    if dialect_name == "postgresql":
        postgresql.ENUM(*MEMBERSHIP_STATUSES, name="activity_membership_status").create(
            bind, checkfirst=True
        )
    with op.batch_alter_table("activity_memberships") as batch_op:
        batch_op.add_column(
            sa.Column(
                "status",
                _status_enum(dialect_name),
                server_default="approved",
                nullable=False,
            )
        )


def downgrade() -> None:
    bind = op.get_bind()
    dialect_name = bind.dialect.name

    with op.batch_alter_table("activity_memberships") as batch_op:
        batch_op.drop_column("status")
    if dialect_name == "postgresql":
        postgresql.ENUM(name="activity_membership_status").drop(bind, checkfirst=True)

    op.drop_index(op.f("ix_calendar_events_event_start"), table_name="calendar_events")
    op.drop_table("calendar_events")

    with op.batch_alter_table("notices") as batch_op:
        batch_op.drop_column("image_url")
