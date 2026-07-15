import uuid
from typing import Optional

from sqlalchemy import Enum, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


def generate_uuid():
    return str(uuid.uuid4())


# ─── 회원 ─────────────────────────────────────────────────────────────

class MemberDB(Base):
    __tablename__ = "members"

    #필수 입력
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)  # 가입 번호
    public_id: Mapped[str] = mapped_column(String(36), unique=True, default=generate_uuid)  # 공개 id(웹에서 사용)
    login_id: Mapped[str] = mapped_column(String(12), unique=True)  # 로그인 id
    hashed_password: Mapped[str] = mapped_column(String(255))  # pw 암호화
    name: Mapped[str] = mapped_column(String(30))  # 이름
    student_id: Mapped[str] = mapped_column(String(10), unique=True)  # 학번
    department: Mapped[str] = mapped_column(String(50))  # 과
    grade: Mapped[int] = mapped_column(Integer)  # 학년 (1~4)
    phone_number: Mapped[str] = mapped_column(String(20), unique=True)  # 휴대폰 번호 (하이픈 없이 숫자만, "010" 포함 전체 저장)
    role: Mapped[str] = mapped_column(Enum("admin", "pm", "member"), default="member")  # 역할 admin, pm, member
    is_approved: Mapped[bool] = mapped_column(default=False)  # 가입 승인 여부
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)  # 이메일

    #선택 입력
    github_username: Mapped[Optional[str]] = mapped_column(String(39))  # GitHub 사용자명 # 사진도 포함?
    bio: Mapped[Optional[str]] = mapped_column(Text)  # 소개
    tech_stack: Mapped[Optional[str]] = mapped_column(Text)  # 사용·관심 기술
    
    