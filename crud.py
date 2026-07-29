"""
DB 조회(Read) 로직을 모아두는 CRUD 모듈.

라우터(members.py 등)는 DB를 직접 다루지 않고 반드시 이 모듈의 함수를 통해
데이터를 가져오도록 구조화합니다. 덕분에 DB 접근 방식이 바뀌어도 라우터 코드는
수정하지 않아도 됩니다.
"""

from typing import List, Optional

from sqlalchemy.orm import Session

from models import FaqDB, GalleryDB, MemberDB, NoticeDB, ProjectDB


def get_members(
    db: Session,
    name: Optional[str] = None,
    role: Optional[str] = None,
    roles: Optional[List[str]] = None,
) -> List[MemberDB]:
    """
    회원 목록을 반환합니다.

    name이 주어지면 해당 문자열을 포함하는 이름만 필터링합니다. (부분 일치)
    role이 주어지면 해당 역할(admin / pm / member)만 필터링합니다. (완전 일치)
    roles가 주어지면 해당 역할 목록에 포함된 회원만 필터링합니다. (IN 조건)
    - roles는 비로그인 사용자에게 임원진(admin, pm)만 노출할 때 사용합니다.
    - role과 roles를 동시에 넘기면 두 조건이 모두 AND로 적용됩니다.
    두 조건을 동시에 사용할 수 있으며, 가입 번호(id) 오름차순으로 정렬합니다.
    """
    query = db.query(MemberDB)
    if name is not None:
        query = query.filter(MemberDB.name.contains(name))
    if role is not None:
        query = query.filter(MemberDB.role == role)
    if roles is not None:
        query = query.filter(MemberDB.role.in_(roles))
    return query.order_by(MemberDB.id).all()


def get_member_by_public_id(db: Session, public_id: str) -> Optional[MemberDB]:
    """
    public_id로 회원 단건을 조회합니다.

    일치하는 회원이 없으면 None을 반환합니다.
    (404 처리는 호출부인 라우터에서 담당합니다.)
    """
    return db.query(MemberDB).filter(MemberDB.public_id == public_id).first()


def update_member(db: Session, public_id: str, updates: dict) -> Optional[MemberDB]:
    """
    public_id로 회원을 찾아 전달된 필드만 부분 수정합니다.

    updates는 exclude_unset=True로 만든 dict여야 합니다.
    회원이 없으면 None을 반환합니다.
    (unique 충돌 시 IntegrityError는 호출부인 라우터에서 409로 변환합니다.)
    """
    member = get_member_by_public_id(db, public_id)
    if member is None:
        return None

    for field, value in updates.items():
        setattr(member, field, value)

    db.commit()
    db.refresh(member)
    return member


def delete_member(db: Session, public_id: str) -> Optional[MemberDB]:
    """
    public_id로 회원을 찾아 삭제합니다.

    회원이 없으면 None을 반환합니다.
    (admin 삭제 금지 등 권한 정책은 호출부인 라우터에서 담당합니다.)
    """
    member = get_member_by_public_id(db, public_id)
    if member is None:
        return None

    db.delete(member)
    db.commit()
    return member


def update_member_password(
    db: Session,
    member: MemberDB,
    hashed_password: str,
) -> MemberDB:
    """
    회원의 hashed_password를 갱신합니다.

    평문 비밀번호는 받지 않으며, 호출부에서 hash_password()로 해싱한 값만 전달합니다.
    """
    member.hashed_password = hashed_password
    db.commit()
    db.refresh(member)
    return member


# ─── 프로젝트 / 스터디 CRUD (동일 테이블, category로 구분) ─────────────────────
# 실제 DB 쓰기는 _*_project_row 내부 함수에만 두고,
# create/update/delete_project|study 래퍼가 category를 고정·검증합니다.

def get_projects(db: Session) -> List[ProjectDB]:
    """category=project 인 목록을 id 오름차순으로 반환합니다."""
    return (
        db.query(ProjectDB)
        .filter(ProjectDB.category == "project")
        .order_by(ProjectDB.id)
        .all()
    )


def get_studies(db: Session) -> List[ProjectDB]:
    """category=study 인 목록을 id 오름차순으로 반환합니다."""
    return (
        db.query(ProjectDB)
        .filter(ProjectDB.category == "study")
        .order_by(ProjectDB.id)
        .all()
    )


def get_project_by_public_id(db: Session, public_id: str) -> Optional[ProjectDB]:
    """public_id로 category=project 단건을 조회합니다. 없으면 None."""
    return (
        db.query(ProjectDB)
        .filter(
            ProjectDB.public_id == public_id,
            ProjectDB.category == "project",
        )
        .first()
    )


def get_study_by_public_id(db: Session, public_id: str) -> Optional[ProjectDB]:
    """public_id로 category=study 단건을 조회합니다. 없으면 None."""
    return (
        db.query(ProjectDB)
        .filter(
            ProjectDB.public_id == public_id,
            ProjectDB.category == "study",
        )
        .first()
    )


def _insert_project_row(db: Session, data: dict) -> ProjectDB:
    """projects 테이블에 한 행을 추가합니다. category는 호출부가 넣은 값을 그대로 사용합니다."""
    row = ProjectDB(**data)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def _update_project_row(
    db: Session,
    public_id: str,
    updates: dict,
) -> Optional[ProjectDB]:
    """public_id로 행을 찾아 전달된 필드만 부분 수정합니다."""
    row = db.query(ProjectDB).filter(ProjectDB.public_id == public_id).first()
    if row is None:
        return None

    for field, value in updates.items():
        setattr(row, field, value)

    db.commit()
    db.refresh(row)
    return row


def _delete_project_row(db: Session, public_id: str) -> Optional[ProjectDB]:
    """public_id로 행을 삭제합니다. 없으면 None."""
    row = db.query(ProjectDB).filter(ProjectDB.public_id == public_id).first()
    if row is None:
        return None

    db.delete(row)
    db.commit()
    return row


def create_project(db: Session, data: dict) -> ProjectDB:
    """프로젝트를 생성합니다. category는 항상 project로 고정합니다."""
    payload = {**data, "category": "project"}
    return _insert_project_row(db, payload)


def create_study(db: Session, data: dict) -> ProjectDB:
    """스터디를 생성합니다. category는 항상 study로 고정합니다."""
    payload = {**data, "category": "study"}
    return _insert_project_row(db, payload)


def update_project(
    db: Session,
    public_id: str,
    updates: dict,
) -> Optional[ProjectDB]:
    """
    category=project 인 행만 부분 수정합니다.
    없거나 study이면 None을 반환합니다. category 변경은 무시합니다.
    """
    if get_project_by_public_id(db, public_id) is None:
        return None

    safe_updates = {k: v for k, v in updates.items() if k != "category"}
    if not safe_updates:
        return get_project_by_public_id(db, public_id)
    return _update_project_row(db, public_id, safe_updates)


def update_study(
    db: Session,
    public_id: str,
    updates: dict,
) -> Optional[ProjectDB]:
    """
    category=study 인 행만 부분 수정합니다.
    없거나 project이면 None을 반환합니다. category 변경은 무시합니다.
    """
    if get_study_by_public_id(db, public_id) is None:
        return None

    safe_updates = {k: v for k, v in updates.items() if k != "category"}
    if not safe_updates:
        return get_study_by_public_id(db, public_id)
    return _update_project_row(db, public_id, safe_updates)


def delete_project(db: Session, public_id: str) -> Optional[ProjectDB]:
    """category=project 인 행만 삭제합니다. 없거나 study이면 None."""
    if get_project_by_public_id(db, public_id) is None:
        return None
    return _delete_project_row(db, public_id)


def delete_study(db: Session, public_id: str) -> Optional[ProjectDB]:
    """category=study 인 행만 삭제합니다. 없거나 project이면 None."""
    if get_study_by_public_id(db, public_id) is None:
        return None
    return _delete_project_row(db, public_id)


# ─── 공지사항 CRUD ─────────────────────────────────────────────────────────────

def get_notices(db: Session) -> List[NoticeDB]:
    """공지사항 목록을 created_at 내림차순으로 반환합니다."""
    return db.query(NoticeDB).order_by(NoticeDB.created_at.desc()).all()


def get_notice_by_public_id(db: Session, public_id: str) -> Optional[NoticeDB]:
    """public_id로 공지사항 단건을 조회합니다. 없으면 None."""
    return db.query(NoticeDB).filter(NoticeDB.public_id == public_id).first()


def create_notice(db: Session, data: dict) -> NoticeDB:
    """공지사항을 생성합니다. is_pinned는 항상 False로 고정합니다."""
    payload = {**data, "is_pinned": False}
    notice = NoticeDB(**payload)
    db.add(notice)
    db.commit()
    db.refresh(notice)
    return notice


def update_notice(
    db: Session,
    public_id: str,
    updates: dict,
) -> Optional[NoticeDB]:
    """
    public_id로 공지사항을 찾아 전달된 필드만 부분 수정합니다.
    없으면 None. is_pinned 변경은 이번 Issue에서 무시합니다.
    """
    notice = get_notice_by_public_id(db, public_id)
    if notice is None:
        return None

    safe_updates = {k: v for k, v in updates.items() if k != "is_pinned"}
    if not safe_updates:
        return notice

    for field, value in safe_updates.items():
        setattr(notice, field, value)

    db.commit()
    db.refresh(notice)
    return notice


def delete_notice(db: Session, public_id: str) -> Optional[NoticeDB]:
    """public_id로 공지사항을 삭제합니다. 없으면 None."""
    notice = get_notice_by_public_id(db, public_id)
    if notice is None:
        return None

    db.delete(notice)
    db.commit()
    return notice


# ─── 갤러리 CRUD ─────────────────────────────────────────────────────────────

def get_galleries(db: Session) -> List[GalleryDB]:
    """갤러리 목록을 created_at 내림차순(최신순)으로 반환합니다."""
    return db.query(GalleryDB).order_by(GalleryDB.created_at.desc()).all()


def get_gallery_by_public_id(db: Session, public_id: str) -> Optional[GalleryDB]:
    """public_id로 갤러리 사진 단건을 조회합니다. 없으면 None."""
    return db.query(GalleryDB).filter(GalleryDB.public_id == public_id).first()


def create_gallery(db: Session, data: dict, uploaded_by: int) -> GalleryDB:
    """갤러리 사진을 생성합니다. uploaded_by는 호출부에서 현재 admin id를 전달합니다."""
    payload = {**data, "uploaded_by": uploaded_by}
    gallery = GalleryDB(**payload)
    db.add(gallery)
    db.commit()
    db.refresh(gallery)
    return gallery


def update_gallery(
    db: Session,
    public_id: str,
    updates: dict,
) -> Optional[GalleryDB]:
    """public_id로 갤러리 사진을 찾아 전달된 필드만 부분 수정합니다. 없으면 None."""
    gallery = get_gallery_by_public_id(db, public_id)
    if gallery is None:
        return None

    safe_updates = {k: v for k, v in updates.items() if k != "uploaded_by"}
    if not safe_updates:
        return gallery

    for field, value in safe_updates.items():
        setattr(gallery, field, value)

    db.commit()
    db.refresh(gallery)
    return gallery


def delete_gallery(db: Session, public_id: str) -> Optional[GalleryDB]:
    """public_id로 갤러리 사진을 삭제합니다. 없으면 None."""
    gallery = get_gallery_by_public_id(db, public_id)
    if gallery is None:
        return None

    db.delete(gallery)
    db.commit()
    return gallery


# ─── FAQ CRUD ────────────────────────────────────────────────────────────────

def get_faqs(db: Session) -> List[FaqDB]:
    """FAQ 목록을 id 오름차순으로 반환합니다."""
    return db.query(FaqDB).order_by(FaqDB.id.asc()).all()


def get_faq_by_public_id(db: Session, public_id: str) -> Optional[FaqDB]:
    """public_id로 FAQ 단건을 조회합니다. 없으면 None."""
    return db.query(FaqDB).filter(FaqDB.public_id == public_id).first()


def create_faq(db: Session, data: dict) -> FaqDB:
    """FAQ를 생성합니다."""
    faq = FaqDB(**data)
    db.add(faq)
    db.commit()
    db.refresh(faq)
    return faq


def delete_faq(db: Session, public_id: str) -> Optional[FaqDB]:
    """public_id로 FAQ를 삭제합니다. 없으면 None."""
    faq = get_faq_by_public_id(db, public_id)
    if faq is None:
        return None

    db.delete(faq)
    db.commit()
    return faq
