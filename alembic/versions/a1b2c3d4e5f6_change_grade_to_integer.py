"""change grade column from string to integer

Revision ID: a1b2c3d4e5f6
Revises: 3b2825688024
Create Date: 2026-07-15 16:00:00.000000

"""
from typing import Sequence, Union
import re

from alembic import context, op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "3b2825688024"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _to_grade_int(raw: str) -> int:
    """'1학년', '3' 같은 문자열에서 선두 숫자를 추출해 1~4 정수로 변환합니다."""
    match = re.match(r"^(\d+)", str(raw).strip())
    if match is None:
        raise ValueError(f"학년 값을 정수로 변환할 수 없습니다: {raw!r}")
    value = int(match.group(1))
    if value < 1 or value > 4:
        raise ValueError(f"학년은 1~4만 허용됩니다: {raw!r} → {value}")
    return value


def upgrade() -> None:
    """Upgrade schema."""
    # 1) 기존 문자열 grade를 정수 문자열(예: "1")로 정규화
    if context.is_offline_mode():
        # 정적 SQL 생성 시에는 조회 결과를 Python에서 순회할 수 없습니다.
        # grade가 1~4만 허용된다는 기존 검증 규칙에 따라 첫 글자를 사용합니다.
        op.execute("UPDATE members SET grade = substr(trim(grade), 1, 1)")
    else:
        conn = op.get_bind()
        rows = conn.execute(sa.text("SELECT id, grade FROM members")).fetchall()
        for row_id, grade_raw in rows:
            grade_int = _to_grade_int(grade_raw)
            conn.execute(
                sa.text("UPDATE members SET grade = :grade WHERE id = :id"),
                {"grade": str(grade_int), "id": row_id},
            )

    # 2) 컬럼 타입을 Integer로 변경 (SQLite는 batch_alter 사용)
    with op.batch_alter_table("members", schema=None) as batch_op:
        batch_op.alter_column(
            "grade",
            existing_type=sa.VARCHAR(length=10),
            type_=sa.Integer(),
            existing_nullable=False,
            postgresql_using="grade::integer",
        )


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table("members", schema=None) as batch_op:
        batch_op.alter_column(
            "grade",
            existing_type=sa.Integer(),
            type_=sa.VARCHAR(length=10),
            existing_nullable=False,
            postgresql_using="grade::text",
        )

    # 정수를 다시 "N학년" 문자열로 되돌림
    conn = op.get_bind()
    rows = conn.execute(sa.text("SELECT id, grade FROM members")).fetchall()
    for row_id, grade_raw in rows:
        conn.execute(
            sa.text("UPDATE members SET grade = :grade WHERE id = :id"),
            {"grade": f"{grade_raw}학년", "id": row_id},
        )
