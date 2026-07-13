"""
관리자 전용 API 라우터.

require_admin 의존성을 사용하여 관리자 권한을 검사합니다.
- 비로그인(토큰 없음) → 401 Unauthorized
- 로그인했으나 role이 "admin"이 아님 → 403 Forbidden
- role이 "admin" → 200 OK
"""

from fastapi import APIRouter, Depends

from dependencies import require_admin
from models import MemberDB

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
