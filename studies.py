"""
스터디 조회 API 라우터.

Issue #10: Study는 ProjectDB(category="study")를 재사용합니다.
생성·수정·삭제는 admin.py의 /admin/studies 경로에서 처리합니다.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from crud import get_studies, get_study_by_public_id
from database import get_db
from schemas import StudyListResponse, StudyResponse

router = APIRouter(prefix="/studies", tags=["스터디"])


@router.get("", response_model=StudyListResponse)
def list_studies(db: Session = Depends(get_db)):
    """
    스터디 목록 조회 API (Public).

    category=study 인 항목만 반환합니다.
    """
    studies = get_studies(db)
    return {
        "total": len(studies),
        "items": [StudyResponse.model_validate(s) for s in studies],
    }


@router.get("/{public_id}", response_model=StudyResponse)
def get_study(public_id: str, db: Session = Depends(get_db)):
    """
    스터디 상세 조회 API (Public).

    없거나 category가 study가 아니면 404를 반환합니다.
    """
    study = get_study_by_public_id(db, public_id)
    if study is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="해당 스터디를 찾을 수 없습니다.",
        )
    return StudyResponse.model_validate(study)
