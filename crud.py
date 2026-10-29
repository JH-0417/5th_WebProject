"""
DB 조회(Read) 로직을 모아두는 CRUD 모듈.

라우터(members.py 등)는 DB를 직접 다루지 않고 반드시 이 모듈의 함수를 통해
데이터를 가져오도록 구조화합니다. 덕분에 DB 접근 방식이 바뀌어도 라우터 코드는
수정하지 않아도 됩니다.
"""

from typing import List, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from models import (
    ActivityMembershipDB,
    ContactInquiryDB,
    FaqDB,
    GalleryAlbumDB,
    GalleryDB,
    MemberDB,
    NoticeDB,
    ProjectDB,
    RecruitmentSettingDB,
)


def get_members(
    db: Session,
    name: Optional[str] = None,
    system_role: Optional[str] = None,
    club_position: Optional[str] = None,
    club_positions: Optional[List[str]] = None,
    join_status: Optional[str] = None,
) -> List[MemberDB]:
    """
    회원 목록을 반환합니다.

    name이 주어지면 해당 문자열을 포함하는 이름만 필터링합니다. (부분 일치)
    system_role은 사이트 권한, club_position은 동아리 직책을 필터링합니다.
    club_positions는 비로그인 사용자에게 공개할 임원 직책 목록에 사용합니다.
    join_status가 주어지면 pending / approved / rejected 로 필터링합니다.
    두 조건을 동시에 사용할 수 있으며, 가입 번호(id) 오름차순으로 정렬합니다.
    """
    query = db.query(MemberDB)
    if name is not None:
        query = query.filter(MemberDB.name.contains(name))
    if system_role is not None:
        query = query.filter(MemberDB.system_role == system_role)
    if club_position is not None:
        query = query.filter(MemberDB.club_position == club_position)
    if club_positions is not None:
        query = query.filter(MemberDB.club_position.in_(club_positions))
    if join_status is not None:
        query = query.filter(MemberDB.join_status == join_status)
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
    is_approved가 포함되면 join_status로 변환해 저장합니다. (is_approved는 계산 속성)
    회원이 없으면 None을 반환합니다.
    (unique 충돌 시 IntegrityError는 호출부인 라우터에서 409로 변환합니다.)
    """
    member = get_member_by_public_id(db, public_id)
    if member is None:
        return None

    if "is_approved" in updates:
        approved = bool(updates.pop("is_approved"))
        updates["join_status"] = "approved" if approved else "pending"

    for field, value in updates.items():
        setattr(member, field, value)

    db.commit()
    db.refresh(member)
    return member


def set_member_join_status(
    db: Session,
    public_id: str,
    join_status: str,
) -> Optional[MemberDB]:
    """
    회원의 가입 심사 상태(join_status)를 변경합니다. is_approved는 여기서 자동 계산됩니다.

    join_status: pending / approved / rejected
    """
    member = get_member_by_public_id(db, public_id)
    if member is None:
        return None

    member.join_status = join_status
    db.commit()
    db.refresh(member)
    return member


def count_members_by_system_role(db: Session, system_role: str) -> int:
    """지정한 시스템 권한을 가진 회원 수를 반환합니다."""
    return (
        db.query(MemberDB)
        .filter(MemberDB.system_role == system_role)
        .count()
    )


def set_member_system_role(
    db: Session,
    public_id: str,
    system_role: str,
) -> Optional[MemberDB]:
    """회원의 사이트 관리 권한을 변경합니다."""
    member = get_member_by_public_id(db, public_id)
    if member is None:
        return None

    member.system_role = system_role
    db.commit()
    db.refresh(member)
    return member


def set_member_club_position(
    db: Session,
    public_id: str,
    club_position: str,
) -> Optional[MemberDB]:
    """회원의 동아리 직책을 변경합니다."""
    member = get_member_by_public_id(db, public_id)
    if member is None:
        return None

    member.club_position = club_position
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


def _insert_project_row(
    db: Session,
    data: dict,
    leader_member_id: Optional[int] = None,
) -> ProjectDB:
    """projects 테이블에 한 행을 추가합니다. category는 호출부가 넣은 값을 그대로 사용합니다."""
    row = ProjectDB(**data)
    db.add(row)
    db.flush()
    if leader_member_id is not None:
        db.add(
            ActivityMembershipDB(
                activity_id=row.id,
                member_id=leader_member_id,
                role="leader",
            )
        )
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


def create_project(
    db: Session,
    data: dict,
    leader_member_id: Optional[int] = None,
) -> ProjectDB:
    """프로젝트를 생성하고 생성자를 프로젝트장으로 등록합니다."""
    payload = {**data, "category": "project"}
    return _insert_project_row(db, payload, leader_member_id)


def create_study(
    db: Session,
    data: dict,
    leader_member_id: Optional[int] = None,
) -> ProjectDB:
    """스터디를 생성하고 생성자를 스터디장으로 등록합니다."""
    payload = {**data, "category": "study"}
    return _insert_project_row(db, payload, leader_member_id)


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


def get_calendar_events(db: Session) -> List[NoticeDB]:
    """
    캘린더용 일정을 반환합니다.

    event_start가 있는 Notice만 포함하며, event_start 오름차순(가까운 일정 순)으로 정렬합니다.
    """
    return (
        db.query(NoticeDB)
        .filter(NoticeDB.event_start.isnot(None))
        .order_by(NoticeDB.event_start.asc())
        .all()
    )


# ─── 갤러리 CRUD ─────────────────────────────────────────────────────────────

def get_galleries(db: Session, album_id: Optional[int] = None) -> List[GalleryDB]:
    """갤러리 목록을 created_at 내림차순(최신순)으로 반환합니다. album_id로 앨범별 필터링."""
    query = db.query(GalleryDB)
    if album_id is not None:
        query = query.filter(GalleryDB.album_id == album_id)
    return query.order_by(GalleryDB.created_at.desc(), GalleryDB.id.desc()).all()


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


# ─── 갤러리 앨범 CRUD ─────────────────────────────────────────────────────────

def get_gallery_albums(db: Session) -> List[GalleryAlbumDB]:
    """앨범 목록을 행사 날짜 최신순으로 반환합니다. 날짜가 없는 앨범은 뒤로, 같으면 최근 생성순."""
    return (
        db.query(GalleryAlbumDB)
        .order_by(
            GalleryAlbumDB.event_date.is_(None),
            GalleryAlbumDB.event_date.desc(),
            GalleryAlbumDB.id.desc(),
        )
        .all()
    )


def get_gallery_album_by_public_id(db: Session, public_id: str) -> Optional[GalleryAlbumDB]:
    """public_id로 앨범 단건을 조회합니다. 없으면 None."""
    return db.query(GalleryAlbumDB).filter(GalleryAlbumDB.public_id == public_id).first()


def create_gallery_album(db: Session, data: dict) -> GalleryAlbumDB:
    """앨범을 생성합니다."""
    album = GalleryAlbumDB(**data)
    db.add(album)
    db.commit()
    db.refresh(album)
    return album


def update_gallery_album(db: Session, public_id: str, updates: dict) -> Optional[GalleryAlbumDB]:
    """public_id로 앨범을 찾아 전달된 필드만 수정합니다. 없으면 None."""
    album = get_gallery_album_by_public_id(db, public_id)
    if album is None:
        return None
    for field, value in updates.items():
        setattr(album, field, value)
    db.commit()
    db.refresh(album)
    return album


def delete_gallery_album(db: Session, public_id: str) -> Optional[GalleryAlbumDB]:
    """
    앨범을 삭제합니다. 없으면 None.

    앨범에 있던 사진은 지우지 않고 앨범 연결만 비웁니다.
    (사진까지 지울지는 호출부인 라우터에서 결정합니다.)
    """
    album = get_gallery_album_by_public_id(db, public_id)
    if album is None:
        return None
    for photo in album.photos:
        photo.album_id = None
    db.delete(album)
    db.commit()
    return album


# ─── FAQ CRUD ────────────────────────────────────────────────────────────────

def get_faqs(db: Session) -> List[FaqDB]:
    """FAQ 목록을 표시 순서(sort_order), 같으면 등록 순서(id)대로 반환합니다."""
    return db.query(FaqDB).order_by(FaqDB.sort_order.asc(), FaqDB.id.asc()).all()


def get_faq_by_public_id(db: Session, public_id: str) -> Optional[FaqDB]:
    """public_id로 FAQ 단건을 조회합니다. 없으면 None."""
    return db.query(FaqDB).filter(FaqDB.public_id == public_id).first()


def create_faq(db: Session, data: dict) -> FaqDB:
    """FAQ를 생성합니다. sort_order가 없으면 맨 아래 순서로 넣습니다."""
    if data.get("sort_order") is None:
        max_order = db.query(func.max(FaqDB.sort_order)).scalar()
        data = {**data, "sort_order": 0 if max_order is None else max_order + 1}
    faq = FaqDB(**data)
    db.add(faq)
    db.commit()
    db.refresh(faq)
    return faq


def update_faq(db: Session, public_id: str, updates: dict) -> Optional[FaqDB]:
    """public_id로 FAQ를 찾아 전달된 필드만 수정합니다. 없으면 None."""
    faq = get_faq_by_public_id(db, public_id)
    if faq is None:
        return None

    for field, value in updates.items():
        setattr(faq, field, value)

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


# ─── 문의 (Contact) ─────────────────────────────────────────────────────

def create_contact_inquiry(db: Session, data: dict) -> ContactInquiryDB:
    """Contact 폼 문의를 저장합니다."""
    inquiry = ContactInquiryDB(**data)
    db.add(inquiry)
    db.commit()
    db.refresh(inquiry)
    return inquiry


def get_contact_inquiries(
    db: Session,
    is_resolved: Optional[bool] = None,
) -> List[ContactInquiryDB]:
    """문의 목록을 최신순으로 반환합니다. is_resolved로 처리 여부를 걸러낼 수 있습니다."""
    query = db.query(ContactInquiryDB)
    if is_resolved is not None:
        query = query.filter(ContactInquiryDB.is_resolved == is_resolved)
    return query.order_by(ContactInquiryDB.created_at.desc(), ContactInquiryDB.id.desc()).all()


def get_contact_inquiry_by_public_id(db: Session, public_id: str) -> Optional[ContactInquiryDB]:
    """public_id로 문의 단건을 조회합니다. 없으면 None."""
    return db.query(ContactInquiryDB).filter(ContactInquiryDB.public_id == public_id).first()


def set_contact_inquiry_resolved(
    db: Session,
    public_id: str,
    is_resolved: bool,
) -> Optional[ContactInquiryDB]:
    """문의 처리 완료 여부를 변경합니다. 없으면 None."""
    inquiry = get_contact_inquiry_by_public_id(db, public_id)
    if inquiry is None:
        return None
    inquiry.is_resolved = is_resolved
    db.commit()
    db.refresh(inquiry)
    return inquiry


def delete_contact_inquiry(db: Session, public_id: str) -> Optional[ContactInquiryDB]:
    """public_id로 문의를 삭제합니다. 없으면 None."""
    inquiry = get_contact_inquiry_by_public_id(db, public_id)
    if inquiry is None:
        return None
    db.delete(inquiry)
    db.commit()
    return inquiry


# ─── 모집 설정 ───────────────────────────────────────────────────────────

RECRUITMENT_SETTING_ID = 1


def get_recruitment_setting(db: Session) -> RecruitmentSettingDB:
    """모집 설정(단일 행)을 반환합니다. 아직 없으면 '닫힘' 상태로 만들어 반환합니다."""
    setting = db.get(RecruitmentSettingDB, RECRUITMENT_SETTING_ID)
    if setting is None:
        setting = RecruitmentSettingDB(id=RECRUITMENT_SETTING_ID, is_open=False)
        db.add(setting)
        db.commit()
        db.refresh(setting)
    return setting


def update_recruitment_setting(db: Session, updates: dict) -> RecruitmentSettingDB:
    """모집 설정을 부분 수정합니다. message가 빈 문자열이면 None으로 지웁니다."""
    setting = get_recruitment_setting(db)
    if "message" in updates:
        updates["message"] = (updates["message"] or "").strip() or None
    for field, value in updates.items():
        setattr(setting, field, value)
    db.commit()
    db.refresh(setting)
    return setting
