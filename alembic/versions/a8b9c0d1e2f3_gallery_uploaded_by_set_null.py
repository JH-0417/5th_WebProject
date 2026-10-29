"""gallery.uploaded_by set null on member delete

Revision ID: a8b9c0d1e2f3
Revises: f7a8b9c0d1e2
Create Date: 2026-10-29 12:00:00.000000

갤러리 사진을 올린 회원을 삭제하면 외래키 위반으로 삭제가 실패하던 문제를 고칩니다.
uploaded_by를 nullable로 바꾸고, 회원 삭제 시 NULL로 비우도록(ON DELETE SET NULL) 합니다.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a8b9c0d1e2f3"
down_revision: Union[str, Sequence[str], None] = "f7a8b9c0d1e2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

FK_NAME = "fk_gallery_uploaded_by_members"


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table("gallery") as batch_op:
        batch_op.drop_constraint(FK_NAME, type_="foreignkey")
        batch_op.alter_column("uploaded_by", existing_type=sa.Integer(), nullable=True)
        batch_op.create_foreign_key(
            FK_NAME,
            "members",
            ["uploaded_by"],
            ["id"],
            ondelete="SET NULL",
        )


def downgrade() -> None:
    """Downgrade schema."""
    # 업로더가 비어 있는 사진이 있으면 NOT NULL로 되돌릴 수 없으므로 먼저 정리합니다.
    op.execute("DELETE FROM gallery WHERE uploaded_by IS NULL")
    with op.batch_alter_table("gallery") as batch_op:
        batch_op.drop_constraint(FK_NAME, type_="foreignkey")
        batch_op.alter_column("uploaded_by", existing_type=sa.Integer(), nullable=False)
        batch_op.create_foreign_key(FK_NAME, "members", ["uploaded_by"], ["id"])
