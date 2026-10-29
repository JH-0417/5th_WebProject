"""create gallery albums

Revision ID: f3a4b5c6d7e8
Revises: e2f3a4b5c6d7
Create Date: 2026-10-30 10:00:00.000000

행사(MT, 발표회 등)별로 갤러리 사진을 묶는 앨범 테이블을 만들고,
gallery.album_id를 추가합니다. 앨범이 삭제되면 사진은 남고 album_id만 비워집니다.
기존 사진은 앨범 없이(album_id = NULL) 그대로 유지됩니다.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "f3a4b5c6d7e8"
down_revision: Union[str, Sequence[str], None] = "e2f3a4b5c6d7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "gallery_albums",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("public_id", sa.String(length=36), nullable=False),
        sa.Column("title", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("event_date", sa.Date(), nullable=True),
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
        sa.PrimaryKeyConstraint("id", name=op.f("pk_gallery_albums")),
        sa.UniqueConstraint("public_id", name=op.f("uq_gallery_albums_public_id")),
    )

    with op.batch_alter_table("gallery") as batch_op:
        batch_op.add_column(sa.Column("album_id", sa.Integer(), nullable=True))
        batch_op.create_index(op.f("ix_gallery_album_id"), ["album_id"])
        batch_op.create_foreign_key(
            op.f("fk_gallery_album_id_gallery_albums"),
            "gallery_albums",
            ["album_id"],
            ["id"],
            ondelete="SET NULL",
        )


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table("gallery") as batch_op:
        batch_op.drop_constraint(op.f("fk_gallery_album_id_gallery_albums"), type_="foreignkey")
        batch_op.drop_index(op.f("ix_gallery_album_id"))
        batch_op.drop_column("album_id")

    op.drop_table("gallery_albums")
