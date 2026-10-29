"""
모집 상태 조회 API 라우터.

GET /recruitment 로 현재 가입 신청을 받는 중인지 누구나 확인할 수 있습니다.
(프론트는 이 값으로 "지원하기" 버튼 노출 여부를 정합니다.)
모집 열기·닫기는 admin.py의 PATCH /admin/recruitment 에서 처리합니다.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from crud import get_recruitment_setting
from database import get_db
from schemas import RecruitmentResponse

router = APIRouter(prefix="/recruitment", tags=["모집"])


@router.get("", response_model=RecruitmentResponse)
def get_recruitment(db: Session = Depends(get_db)):
    """모집 상태 조회 API (Public)."""
    return RecruitmentResponse.model_validate(get_recruitment_setting(db))
