import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


def generate_uuid():
    return str(uuid.uuid4())


def utc_now():
    return datetime.now(timezone.utc)


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


# ─── 프로젝트 ───────────────────────────────────────────────────────────

class ProjectDB(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    public_id: Mapped[str] = mapped_column(String(36), unique=True, default=generate_uuid)
    title: Mapped[str] = mapped_column(String(100))
    description: Mapped[str] = mapped_column(Text)
    tech_stack: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        Enum("planned", "in_progress", "completed"),
        default="planned",
    )
    category: Mapped[str] = mapped_column(
        Enum("project", "study"),
        default="project",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
        server_default=func.now(),
    )


# ─── 공지사항 ───────────────────────────────────────────────────────────

class NoticeDB(Base):
    __tablename__ = "notices"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    public_id: Mapped[str] = mapped_column(String(36), unique=True, default=generate_uuid)
    title: Mapped[str] = mapped_column(String(100))
    content: Mapped[str] = mapped_column(Text)
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False)
    # 일정 공지일 때만 사용 (일반 공지는 null)
    event_start: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    event_end: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
        server_default=func.now(),
    )


# ─── 갤러리 ───────────────────────────────────────────────────────────

class GalleryDB(Base):
    __tablename__ = "gallery"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    public_id: Mapped[str] = mapped_column(String(36), unique=True, default=generate_uuid)
    image_url: Mapped[str] = mapped_column(String(500))
    caption: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    uploaded_by: Mapped[int] = mapped_column(Integer, ForeignKey("members.id"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
        server_default=func.now(),
    )


# ─── FAQ ───────────────────────────────────────────────────────────────

class FaqDB(Base):
    __tablename__ = "faqs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    public_id: Mapped[str] = mapped_column(String(36), unique=True, default=generate_uuid)
    question: Mapped[str] = mapped_column(String(200))
    answer: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        server_default=func.now(),
    )
