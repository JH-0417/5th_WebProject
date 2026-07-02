import uuid
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from datetime import datetime
from database import Base


def generate_uuid():
    return str(uuid.uuid4())


# ─── 회원 ─────────────────────────────────────────────────────────────

class MemberDB(Base):
    __tablename__ = "members"

    id              = Column(Integer, primary_key=True, autoincrement=True)                     # 가입 번호
    public_id       = Column(String, unique=True, default=generate_uuid, nullable=False)        # 공개 id(웹에서 사용)
    login_id        = Column(String(12), unique=True, nullable=False)                           # 로그인 id
    hashed_password = Column(String, nullable=False)                                            # pw 암호화
    name            = Column(String(30), nullable=False)                                        # 이름
    student_id      = Column(String(10), unique=True, nullable=False)                           # 학번
    department      = Column(String(50), nullable=True)                                         # 과
    role            = Column(String(10), default="member", nullable=False)                      # 역할 admin, pm, member
    is_approved     = Column(Boolean, default=False)                                            # 가입 승인 여부
    github          = Column(String(39), nullable=True)                                         # GitHub name
    bio             = Column(Text, nullable=True)                                               # 소개
    tech_stack      = Column(Text, nullable=True)                                               # 아래 참조
    
    """ ex)
        언어         Python, Java, C++, JavaScript, TypeScript, Kotlin, Swift
        프론트       React, Vue, Next.js, Flutter
        백엔드       FastAPI, Spring, Django, Node.js, Express
        DB          MySQL, PostgreSQL, MongoDB, SQLite
        ML/DL       PyTorch, TensorFlow, Scikit-learn
        도구         Git, Docker, AWS, Firebase
        게임         Unity, Unreal Engine
    """
