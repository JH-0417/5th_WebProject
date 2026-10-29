import uuid
from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    false,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

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
    system_role: Mapped[str] = mapped_column(
        Enum("admin", "member", name="member_system_role"),
        default="member",
    )  # 사이트 관리 권한
    club_position: Mapped[str] = mapped_column(
        Enum(
            "president",
            "vice_president",
            "treasurer",
            "officer",
            "member",
            name="member_club_position",
        ),
        default="member",
    )  # 동아리 직책
    join_status: Mapped[str] = mapped_column(
        Enum("pending", "approved", "rejected", name="member_join_status"),
        default="pending",
    )  # 가입 심사 상태: 대기 / 승인 / 탈락
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)  # 이메일
    apply_reason: Mapped[str] = mapped_column(Text, default="")  # 지원 사유
    desired_activity: Mapped[str] = mapped_column(Text, default="")  # 동아리에서 해보고 싶은 활동

    @property
    def is_approved(self) -> bool:
        """가입 승인 여부. join_status 한 곳에만 저장하고 여기서 계산합니다."""
        return self.join_status == "approved"

    #선택 입력
    github_username: Mapped[Optional[str]] = mapped_column(String(39))  # GitHub 사용자명 # 사진도 포함?
    bio: Mapped[Optional[str]] = mapped_column(Text)  # 소개
    tech_stack: Mapped[Optional[str]] = mapped_column(Text)  # 사용·관심 기술
    activity_memberships: Mapped[List["ActivityMembershipDB"]] = relationship(
        back_populates="member",
        cascade="all, delete-orphan",
    )


# ─── 프로젝트 ───────────────────────────────────────────────────────────

class ProjectDB(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    public_id: Mapped[str] = mapped_column(String(36), unique=True, default=generate_uuid)
    title: Mapped[str] = mapped_column(String(100))
    description: Mapped[str] = mapped_column(Text)
    tech_stack: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        Enum("planned", "in_progress", "completed", name="project_status"),
        default="planned",
    )
    category: Mapped[str] = mapped_column(
        Enum("project", "study", name="project_category"),
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
    memberships: Mapped[List["ActivityMembershipDB"]] = relationship(
        back_populates="activity",
        cascade="all, delete-orphan",
        order_by="ActivityMembershipDB.id",
    )


class ActivityMembershipDB(Base):
    """프로젝트·스터디마다 회원이 맡은 역할을 저장하는 연결 테이블."""

    __tablename__ = "activity_memberships"
    __table_args__ = (
        UniqueConstraint("activity_id", "member_id", name="uq_activity_member"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    activity_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    member_id: Mapped[int] = mapped_column(
        ForeignKey("members.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role: Mapped[str] = mapped_column(
        Enum("leader", "member", name="activity_membership_role"),
        default="member",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        server_default=func.now(),
    )

    activity: Mapped["ProjectDB"] = relationship(back_populates="memberships")
    member: Mapped["MemberDB"] = relationship(back_populates="activity_memberships")


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
    # 업로드한 회원이 삭제되어도 사진은 남기고 업로더만 비웁니다.
    uploaded_by: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("members.id", ondelete="SET NULL"),
        nullable=True,
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


# ─── 문의 (Contact) ─────────────────────────────────────────────────────

class ContactInquiryDB(Base):
    """사이트 Contact 폼으로 들어온 외부 문의. 관리자만 조회합니다."""

    __tablename__ = "contact_inquiries"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    public_id: Mapped[str] = mapped_column(String(36), unique=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(30))
    email: Mapped[str] = mapped_column(String(255))
    subject: Mapped[str] = mapped_column(String(100))
    message: Mapped[str] = mapped_column(Text)
    is_resolved: Mapped[bool] = mapped_column(Boolean, default=False, server_default=false())  # 답변·처리 완료 여부
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        server_default=func.now(),
    )
