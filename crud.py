"""
DB 조회(Read) 로직을 모아두는 CRUD 모듈.

라우터(members.py 등)는 DB를 직접 다루지 않고 반드시 이 모듈의 함수를 통해
데이터를 가져오도록 구조화합니다. 덕분에 DB 접근 방식이 바뀌어도 라우터 코드는
수정하지 않아도 됩니다.
"""

from typing import List, Optional

from sqlalchemy.orm import Session

from models import MemberDB


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
