"""split member roles and add activity memberships

Revision ID: f7a8b9c0d1e2
Revises: f6a7b8c9d0e1
Create Date: 2026-08-13 20:35:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "f7a8b9c0d1e2"
down_revision: Union[str, Sequence[str], None] = "f6a7b8c9d0e1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


SYSTEM_ROLES = ("admin", "member")
CLUB_POSITIONS = (
    "president",
    "vice_president",
    "treasurer",
    "officer",
    "member",
)
ACTIVITY_ROLES = ("leader", "member")


def _enum(name: str, values: tuple[str, ...], dialect_name: str):
    if dialect_name == "postgresql":
        return postgresql.ENUM(*values, name=name, create_type=False)
    return sa.Enum(*values, name=name)


def upgrade() -> None:
    bind = op.get_bind()
    dialect_name = bind.dialect.name

    if dialect_name == "postgresql":
        postgresql.ENUM(*SYSTEM_ROLES, name="member_system_role").create(
            bind, checkfirst=True
        )
        postgresql.ENUM(*CLUB_POSITIONS, name="member_club_position").create(
            bind, checkfirst=True
        )
        postgresql.ENUM(*ACTIVITY_ROLES, name="activity_membership_role").create(
            bind, checkfirst=True
        )

    with op.batch_alter_table("members") as batch_op:
        batch_op.add_column(
            sa.Column(
                "system_role",
                _enum("member_system_role", SYSTEM_ROLES, dialect_name),
                nullable=True,
            ),
        )
        batch_op.add_column(
            sa.Column(
                "club_position",
                _enum("member_club_position", CLUB_POSITIONS, dialect_name),
                nullable=True,
            ),
        )

    op.execute("UPDATE members SET system_role = 'member', club_position = 'member'")
    op.execute(
        "UPDATE members SET system_role = 'admin', club_position = 'officer' "
        "WHERE role = 'admin'"
    )
    op.execute(
        "UPDATE members SET club_position = 'officer' WHERE role = 'pm'"
    )

    with op.batch_alter_table("members") as batch_op:
        batch_op.alter_column(
            "system_role",
            existing_type=_enum("member_system_role", SYSTEM_ROLES, dialect_name),
            nullable=False,
            server_default="member",
        )
        batch_op.alter_column(
            "club_position",
            existing_type=_enum("member_club_position", CLUB_POSITIONS, dialect_name),
            nullable=False,
            server_default="member",
        )
        # 롤링 배포 중 구버전 백엔드도 가입 처리를 계속할 수 있도록
        # 기존 role 컬럼은 전환 기간 동안 유지하고 서버 기본값을 부여합니다.
        batch_op.alter_column(
            "role",
            existing_type=_enum(
                "member_role", ("admin", "pm", "member"), dialect_name
            ),
            existing_nullable=False,
            server_default="member",
        )

    op.create_table(
        "activity_memberships",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("activity_id", sa.Integer(), nullable=False),
        sa.Column("member_id", sa.Integer(), nullable=False),
        sa.Column(
            "role",
            _enum("activity_membership_role", ACTIVITY_ROLES, dialect_name),
            server_default="member",
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["activity_id"],
            ["projects.id"],
            name=op.f("fk_activity_memberships_activity_id_projects"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["member_id"],
            ["members.id"],
            name=op.f("fk_activity_memberships_member_id_members"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_activity_memberships")),
        sa.UniqueConstraint(
            "activity_id",
            "member_id",
            name="uq_activity_member",
        ),
    )
    op.create_index(
        op.f("ix_activity_memberships_activity_id"),
        "activity_memberships",
        ["activity_id"],
    )
    op.create_index(
        op.f("ix_activity_memberships_member_id"),
        "activity_memberships",
        ["member_id"],
    )

def downgrade() -> None:
    bind = op.get_bind()
    dialect_name = bind.dialect.name

    old_role = _enum("member_role", ("admin", "pm", "member"), dialect_name)
    op.execute("UPDATE members SET role = 'member'")
    op.execute("UPDATE members SET role = 'pm' WHERE club_position != 'member'")
    op.execute("UPDATE members SET role = 'admin' WHERE system_role = 'admin'")

    op.drop_index(
        op.f("ix_activity_memberships_member_id"),
        table_name="activity_memberships",
    )
    op.drop_index(
        op.f("ix_activity_memberships_activity_id"),
        table_name="activity_memberships",
    )
    op.drop_table("activity_memberships")
    with op.batch_alter_table("members") as batch_op:
        batch_op.alter_column(
            "role",
            existing_type=old_role,
            existing_nullable=False,
            server_default=None,
        )
        batch_op.drop_column("club_position")
        batch_op.drop_column("system_role")

    if dialect_name == "postgresql":
        postgresql.ENUM(name="activity_membership_role").drop(bind, checkfirst=True)
        postgresql.ENUM(name="member_club_position").drop(bind, checkfirst=True)
        postgresql.ENUM(name="member_system_role").drop(bind, checkfirst=True)
