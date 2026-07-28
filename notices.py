"""
공지사항 조회 API 라우터.

공개 조회(GET /notices, GET /notices/{public_id})를 구현합니다.
생성·수정·삭제는 admin.py의 /admin/notices 경로에서 처리합니다.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from crud import get_notice_by_public_id, get_notices
from database import get_db
from schemas import NoticeListResponse, NoticeResponse

router = APIRouter(prefix="/notices", tags=["공지사항"])


@router.get("", response_model=NoticeListResponse)
def list_notices(db: Session = Depends(get_db)):
    """
    공지사항 목록 조회 API (Public).

    최신 등록 순(created_at 내림차순)으로 반환합니다.
    """
    notices = get_notices(db)
    return {
        "total": len(notices),
        "items": [NoticeResponse.model_validate(n) for n in notices],
    }


@router.get("/{public_id}", response_model=NoticeResponse)
def get_notice(public_id: str, db: Session = Depends(get_db)):
    """
    공지사항 상세 조회 API (Public).

    없으면 404 Not Found를 반환합니다.
    """
    notice = get_notice_by_public_id(db, public_id)
    if notice is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="해당 공지사항을 찾을 수 없습니다.",
        )
    return NoticeResponse.model_validate(notice)
