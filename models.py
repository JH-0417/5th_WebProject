import uuid
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


def generate_uuid():
    return str(uuid.uuid4())


# ─── 회원 ─────────────────────────────────────────────────────────────

class MemberDB(Base):
    __tablename__ = "members"

    id              = Column(Integer, primary_key=True, autoincrement=True)
    public_id       = Column(String, unique=True, default=generate_uuid, nullable=False)
    login_id        = Column(String(12), unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    name            = Column(String, nullable=False)
    student_id      = Column(String, unique=True, nullable=False)
    department      = Column(String, nullable=True)
    phone           = Column(String, nullable=True)
    role            = Column(String, default="member")   # admin / pm / member
    is_approved     = Column(Boolean, default=False)
    is_active       = Column(Boolean, default=True)
    github          = Column(String, nullable=True)
    bio             = Column(Text, nullable=True)
    profile_image   = Column(String, nullable=True)
    languages       = Column(String, nullable=True)      # 예: "Python,Java,C++"
    created_at      = Column(DateTime, default=datetime.utcnow)

    projects = relationship("ProjectDB", back_populates="owner")


# ─── 프로젝트 ──────────────────────────────────────────────────────────

class ProjectDB(Base):
    __tablename__ = "projects"

    id          = Column(Integer, primary_key=True, autoincrement=True)
    public_id   = Column(String, unique=True, default=generate_uuid, nullable=False)
    title       = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    part        = Column(String, nullable=True)           # web / game / sw
    status      = Column(String, default="진행중")        # 진행중 / 완료
    tech_stack  = Column(String, nullable=True)
    github      = Column(String, nullable=True)
    created_at  = Column(DateTime, default=datetime.utcnow)
    owner_id    = Column(Integer, ForeignKey("members.id"))

    owner   = relationship("MemberDB", back_populates="projects")
    members = relationship("MemberProjectDB", back_populates="project")
    logs    = relationship("ProjectLogDB", back_populates="project")


class MemberProjectDB(Base):
    """프로젝트 참여 멤버 중간 테이블"""
    __tablename__ = "members_projects"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    member_id  = Column(Integer, ForeignKey("members.id"))
    project_id = Column(Integer, ForeignKey("projects.id"))

    member  = relationship("MemberDB")
    project = relationship("ProjectDB", back_populates="members")


class ProjectLogDB(Base):
    __tablename__ = "project_logs"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    public_id  = Column(String, unique=True, default=generate_uuid, nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"))
    title      = Column(String, nullable=False)
    content    = Column(Text, nullable=False)
    author_id  = Column(Integer, ForeignKey("members.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("ProjectDB", back_populates="logs")
    author  = relationship("MemberDB")


# ─── 공지사항 ──────────────────────────────────────────────────────────

class NoticeDB(Base):
    __tablename__ = "notices"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    public_id  = Column(String, unique=True, default=generate_uuid, nullable=False)
    title      = Column(String, nullable=False)
    content    = Column(Text, nullable=False)
    author_id  = Column(Integer, ForeignKey("members.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    author = relationship("MemberDB")


# ─── 갤러리 ───────────────────────────────────────────────────────────

class GalleryDB(Base):
    __tablename__ = "gallery"

    id          = Column(Integer, primary_key=True, autoincrement=True)
    public_id   = Column(String, unique=True, default=generate_uuid, nullable=False)
    image_url   = Column(String, nullable=False)
    caption     = Column(String, nullable=True)
    uploaded_by = Column(Integer, ForeignKey("members.id"))
    created_at  = Column(DateTime, default=datetime.utcnow)

    uploader = relationship("MemberDB")


# ─── 캘린더 ───────────────────────────────────────────────────────────

class CalendarDB(Base):
    __tablename__ = "calendar"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    public_id  = Column(String, unique=True, default=generate_uuid, nullable=False)
    title      = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    event_type = Column(String, nullable=True)   # 회식 / OT / MT / 축제 / 스터디 등
    start_at   = Column(DateTime, nullable=False)
    end_at     = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ─── 지원서 ───────────────────────────────────────────────────────────

class ApplyDB(Base):
    __tablename__ = "applies"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    name       = Column(String, nullable=False)
    student_id = Column(String, nullable=False)
    department = Column(String, nullable=False)
    reason     = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
