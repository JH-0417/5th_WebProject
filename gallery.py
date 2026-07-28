"""
갤러리 조회 API 라우터.

Issue #12: Gallery 공개 조회(GET /gallery, GET /gallery/{public_id})를 구현합니다.
등록·수정·삭제는 admin.py의 /admin/gallery 경로에서 처리합니다.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from crud import get_galleries, get_gallery_by_public_id
from database import get_db
from schemas import GalleryListResponse, GalleryResponse

router = APIRouter(prefix="/gallery", tags=["갤러리"])


@router.get("", response_model=GalleryListResponse)
def list_galleries(db: Session = Depends(get_db)):
    """
    갤러리 활동 사진 목록 조회 API (Public).

    최신 등록 순(created_at 내림차순)으로 반환합니다.
    """
    galleries = get_galleries(db)
    return {
        "total": len(galleries),
        "items": [GalleryResponse.model_validate(g) for g in galleries],
    }


@router.get("/{public_id}", response_model=GalleryResponse)
def get_gallery(public_id: str, db: Session = Depends(get_db)):
    """
    갤러리 활동 사진 상세 조회 API (Public).

    없으면 404 Not Found를 반환합니다.
    """
    gallery = get_gallery_by_public_id(db, public_id)
    if gallery is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="해당 갤러리 사진을 찾을 수 없습니다.",
        )
    return GalleryResponse.model_validate(gallery)
