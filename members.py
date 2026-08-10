"""
회원 조회 관련 API 라우터.

Issue #4의 전체 회원 목록 조회(GET /members),
회원 상세 조회(GET /members/{public_id})를 구현합니다.

Issue #6에서 권한별 조회 범위를 아래와 같이 분리했습니다.
- 비로그인: MemberPublicResponse (student_id 마스킹) / 임원진(admin, pm)만 조회 가능
- 로그인:   MemberResponse (student_id 완전 노출) / 전체 회원 조회 가능
"""

from typing import Optional, Union

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from crud import get_member_by_public_id, get_members, update_member_password
from database import get_db
from dependencies import get_current_member
from models import MemberDB
from schemas import (
    MemberListResponse,
    MemberPublicListResponse,
    MemberPublicResponse,
    MemberResponse,
    PasswordChangeRequest,
)
from security import decode_access_token, hash_password, verify_password

router = APIRouter(prefix="/members", tags=["회원"])

# auto_error=False : 토큰이 없어도 403을 내지 않고 None을 반환
_optional_bearer = HTTPBearer(auto_error=False)

# 비로그인 사용자에게 공개되는 역할(임원진). 그 외 role은 비로그인에게 노출하지 않음.
_PUBLIC_ROLES = ["admin", "pm"]


def _to_public(member) -> dict:
    """ORM 객체를 비로그인 응답 딕셔너리로 변환합니다. 학번은 앞 4자리 + *****로 마스킹합니다."""
    student_id = member.student_id or ""
    return MemberPublicResponse(
        public_id=member.public_id,
        name=member.name,
        masked_student_id=student_id[:4] + "*****",
        department=member.department,
        grade=member.grade,
        email=member.email,
        role=member.role,
        github_username=member.github_username,
        bio=member.bio,
        tech_stack=member.tech_stack,
    ).model_dump()


def _is_logged_in(
    credentials: Optional[HTTPAuthorizationCredentials],
    db: Session,
) -> bool:
    """
    선택적 인증 헬퍼.

    토큰이 유효하고, 해당 회원이 존재하며 is_approved=True 일 때만 True.
    없거나 유효하지 않거나 미승인이면 False를 반환하고 공개 응답으로 폴백합니다.
    """
    if credentials is None:
        return False
    try:
        login_id = decode_access_token(credentials.credentials)
    except HTTPException:
        return False

    member = db.query(MemberDB).filter(MemberDB.login_id == login_id).first()
    return member is not None and bool(member.is_approved)


@router.patch("/me/password")
def change_my_password(
    payload: PasswordChangeRequest,
    current_member: MemberDB = Depends(get_current_member),
    db: Session = Depends(get_db),
):
    """
    본인 비밀번호 변경 API.

    - get_current_member()로 로그인한 본인만 변경할 수 있습니다.
    - current_password가 일치하지 않으면 400을 반환합니다.
    - new_password는 BCrypt로 해싱 후 저장합니다.
    """
    if not verify_password(payload.current_password, current_member.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="현재 비밀번호가 올바르지 않습니다.",
        )

    update_member_password(db, current_member, hash_password(payload.new_password))
    return {"message": "비밀번호가 변경되었습니다."}


@router.get("", response_model=None)
def list_members(
    name: Optional[str] = Query(default=None, description="이름 검색 (부분 일치)"),
    role: Optional[str] = Query(default=None, description="역할 필터 (admin / pm / member)"),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_optional_bearer),
    db: Session = Depends(get_db),
) -> Union[MemberListResponse, MemberPublicListResponse]:
    """
    회원 목록 조회 API.

    - name: 이름에 해당 문자열이 포함된 회원만 반환합니다. (부분 일치)
    - role: 해당 역할(admin / pm / member)의 회원만 반환합니다.
    - 두 조건을 동시에 사용하면 AND 조건으로 필터링합니다.
    - 파라미터를 생략하면 전체 목록을 반환합니다.
    - 로그인 여부에 따라 조회 범위와 응답 필드가 달라집니다.
      - 비로그인: 임원진(admin, pm)만 조회 가능, student_id는 마스킹
        (role=member로 필터링해도 비로그인은 빈 목록을 받습니다.)
      - 로그인:   전체 회원 조회 가능, student_id 완전 노출
    """
    if _is_logged_in(credentials, db):
        members = get_members(db, name=name, role=role, join_status="approved")
        return {
            "total": len(members),
            "items": [MemberResponse.model_validate(m).model_dump() for m in members],
        }
    members = get_members(
        db, name=name, role=role, roles=_PUBLIC_ROLES, join_status="approved"
    )
    return {
        "total": len(members),
        "items": [_to_public(m) for m in members],
    }


@router.get("/{public_id}", response_model=None)
def get_member(
    public_id: str,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_optional_bearer),
    db: Session = Depends(get_db),
) -> Union[MemberResponse, MemberPublicResponse]:
    """
    회원 상세 조회 API.

    - public_id로 회원을 조회합니다.
    - 존재하지 않는 public_id이면 404 Not Found를 반환합니다.
    - 로그인 여부에 따라 조회 범위와 응답 필드가 달라집니다.
      - 비로그인: 임원진(admin, pm)만 조회 가능, student_id는 마스킹
        일반 회원(member)의 public_id로 조회하면 존재 여부를 노출하지 않기 위해
        404 Not Found를 반환합니다. (403이 아닌 이유: 존재 자체를 숨기는 보안 원칙)
      - 로그인:   전체 회원 조회 가능, student_id 완전 노출
    """
    member = get_member_by_public_id(db, public_id)
    if member is None or member.join_status != "approved":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="해당 회원을 찾을 수 없습니다.",
        )
    if _is_logged_in(credentials, db):
        return MemberResponse.model_validate(member).model_dump()
    if member.role not in _PUBLIC_ROLES:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="해당 회원을 찾을 수 없습니다.",
        )
    return _to_public(member)
