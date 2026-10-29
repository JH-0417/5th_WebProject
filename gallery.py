"""
갤러리 조회 API 라우터.

Issue #12: Gallery 공개 조회(GET /gallery, GET /gallery/{public_id})를 구현합니다.
행사별 앨범 조회(GET /gallery/albums, GET /gallery/albums/{public_id})도 제공합니다.
등록·수정·삭제는 admin.py의 /admin/gallery 경로에서 처리합니다.

주의: /gallery/albums 경로를 /gallery/{public_id} 보다 먼저 등록해야
"albums"가 사진 public_id로 잘못 해석되지 않습니다.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from crud import (
    get_galleries,
    get_gallery_album_by_public_id,
    get_gallery_albums,
    get_gallery_by_public_id,
)
from database import get_db
from pagination import PageParams, page_params
from schemas import (
    GalleryAlbumDetailResponse,
    GalleryAlbumListResponse,
    GalleryAlbumResponse,
    GalleryListResponse,
    GalleryResponse,
)

router = APIRouter(prefix="/gallery", tags=["갤러리"])


@router.get("", response_model=GalleryListResponse)
def list_galleries(
    album: Optional[str] = Query(default=None, description="앨범 public_id로 필터링 (선택)"),
    page: PageParams = Depends(page_params),
    db: Session = Depends(get_db),
):
    """
    갤러리 활동 사진 목록 조회 API (Public).

    최신 등록 순(created_at 내림차순)으로 반환합니다.
    album을 주면 해당 앨범의 사진만 반환하고, 없는 앨범이면 404를 반환합니다.
    """
    album_id = None
    if album is not None:
        found = get_gallery_album_by_public_id(db, album)
        if found is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="해당 앨범을 찾을 수 없습니다.",
            )
        album_id = found.id

    result = get_galleries(db, album_id=album_id, page=page)
    return {
        "total": result.total,
        "items": [GalleryResponse.model_validate(g) for g in result.items],
    }


@router.get("/albums", response_model=GalleryAlbumListResponse)
def list_gallery_albums(
    page: PageParams = Depends(page_params),
    db: Session = Depends(get_db),
):
    """
    앨범 목록 조회 API (Public).

    행사 날짜 최신순으로, 사진 수와 대표 이미지를 함께 반환합니다.
    """
    result = get_gallery_albums(db, page=page)
    return {
        "total": result.total,
        "items": [GalleryAlbumResponse.model_validate(a) for a in result.items],
    }


@router.get("/albums/{public_id}", response_model=GalleryAlbumDetailResponse)
def get_gallery_album(public_id: str, db: Session = Depends(get_db)):
    """앨범 상세 조회 API (Public). 앨범 사진 전체를 올린 순서대로 포함합니다."""
    album = get_gallery_album_by_public_id(db, public_id)
    if album is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="해당 앨범을 찾을 수 없습니다.",
        )
    return GalleryAlbumDetailResponse.model_validate(album)


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
