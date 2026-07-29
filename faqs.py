"""
FAQ 조회 API 라우터.

Issue #13: FAQ 공개 목록 조회(GET /faqs)를 구현합니다.
등록·삭제는 admin.py의 /admin/faqs 경로에서 처리합니다.
상세 조회·수정은 이번 Issue 범위에 포함하지 않습니다.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from crud import get_faqs
from database import get_db
from schemas import FaqListResponse, FaqResponse

router = APIRouter(prefix="/faqs", tags=["FAQ"])


@router.get("", response_model=FaqListResponse)
def list_faqs(db: Session = Depends(get_db)):
    """
    FAQ 목록 조회 API (Public).

    자주 묻는 질문 탭에서 질문·답변을 함께 보여주기 위해
    question과 answer를 모두 반환합니다.
    id 오름차순(등록 순서)으로 정렬합니다.
    """
    faqs = get_faqs(db)
    return {
        "total": len(faqs),
        "items": [FaqResponse.model_validate(f) for f in faqs],
    }
