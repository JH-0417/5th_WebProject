"""
관리자 전용 API 라우터.

require_admin 의존성을 사용하여 관리자 권한을 검사합니다.
- 비로그인(토큰 없음) → 401 Unauthorized
- 로그인했으나 role이 "admin"이 아님 → 403 Forbidden
- role이 "admin" → 200 OK
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from crud import get_member_by_public_id, update_member
from database import get_db
from dependencies import require_admin
from models import MemberDB
from schemas import MemberResponse, MemberUpdateRequest

router = APIRouter(prefix="/admin", tags=["관리자"])


@router.get("/test")
def admin_test(current_member: MemberDB = Depends(require_admin)):
    """
    관리자 권한 확인용 테스트 엔드포인트.

    Swagger에서 아래 세 가지 케이스를 확인하세요.
    1. 토큰 없음 → 401 Unauthorized
    2. 일반 회원 토큰 → 403 Forbidden
    3. 관리자 토큰 → 200 OK
    """
    return {
        "message": "관리자 인증 성공",
        "admin": current_member.name,
        "role": current_member.role,
    }


@router.patch("/members/{public_id}", response_model=MemberResponse)
def patch_member(
    public_id: str,
    payload: MemberUpdateRequest,
    current_member: MemberDB = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    관리자용 회원 부분 수정 API.

    - require_admin()으로 관리자만 접근 가능합니다.
    - 요청에 포함된 필드만 수정합니다. (Partial Update)
    - 빈 body면 변경 없이 기존 회원 정보를 반환합니다.
    - 회원이 없으면 404, unique 충돌이면 409를 반환합니다.
    """
    updates = payload.model_dump(exclude_unset=True)

    if not updates:
        member = get_member_by_public_id(db, public_id)
        if member is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="해당 회원을 찾을 수 없습니다.",
            )
        return MemberResponse.model_validate(member)

    try:
        member = update_member(db, public_id, updates)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="이미 사용 중인 학번, 전화번호 또는 이메일입니다.",
        )

    if member is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="해당 회원을 찾을 수 없습니다.",
        )

    return MemberResponse.model_validate(member)
