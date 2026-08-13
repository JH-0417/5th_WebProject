"""
FastAPI 의존성(Dependency) 함수 모음.

단일 책임 원칙에 따라 인증/권한 관련 의존성을 auth.py와 분리하여 관리합니다.
- get_current_member : JWT 검증 후 승인된(is_approved=True) 회원의 DB 객체를 반환합니다.
- require_admin      : get_current_member를 재사용하며, system_role이 "admin"이 아니면 403을 반환합니다.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from database import get_db
from models import MemberDB
from security import decode_access_token

_bearer = HTTPBearer()


def get_current_member(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: Session = Depends(get_db),
) -> MemberDB:
    """
    Authorization: Bearer <token> 헤더에서 JWT를 추출하고,
    검증 후 해당 회원의 DB 객체를 반환하는 의존성 함수.

    - 헤더 자체가 없으면 HTTPBearer가 자동으로 403을 반환합니다.
    - 토큰이 위조·만료된 경우 decode_access_token()이 401을 반환합니다.
    - sub(login_id)에 해당하는 회원이 DB에 없으면 401을 반환합니다.
    - is_approved=False 이면 403을 반환합니다. (관리자 승인 전 활동 차단)
    """
    login_id = decode_access_token(credentials.credentials)
    member = db.query(MemberDB).filter(MemberDB.login_id == login_id).first()
    if member is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="토큰에 해당하는 회원을 찾을 수 없습니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not member.is_approved:
        detail = "관리자 승인 대기 중입니다. 승인 후 이용할 수 있습니다."
        if getattr(member, "join_status", None) == "rejected":
            detail = "가입 신청이 탈락 처리되었습니다."
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
        )
    return member


def require_admin(
    current_member: MemberDB = Depends(get_current_member),
) -> MemberDB:
    """
    관리자 권한 검사 의존성 함수.

    get_current_member()를 재사용하여 JWT 인증을 먼저 수행합니다.
    - 비로그인(토큰 없음): HTTPBearer가 401을 반환합니다.
    - 토큰이 유효하지 않거나 만료: decode_access_token()이 401을 반환합니다.
    - system_role이 "admin"이 아닌 경우: 403 Forbidden을 반환합니다.
    - system_role이 "admin"인 경우: 회원 객체를 그대로 반환합니다.
    """
    if current_member.system_role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="관리자 권한이 필요합니다.",
        )
    return current_member
