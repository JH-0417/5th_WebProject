"""
목록 API 공통 페이지 나눔(pagination) 모듈.

모든 목록 API는 limit / offset 쿼리 파라미터를 받습니다.
- limit 생략: 전체를 반환합니다. (기존 프론트 호환)
- limit 지정: offset 번째부터 limit 개만 반환합니다. (최대 MAX_LIMIT)
- 응답의 total은 페이지와 관계없이 조건에 맞는 전체 개수입니다.

예) 2페이지(한 페이지 12개): GET /gallery?limit=12&offset=12
"""

from dataclasses import dataclass
from typing import Generic, List, Optional, TypeVar

from fastapi import Query
from sqlalchemy.orm import Query as SAQuery

MAX_LIMIT = 100

T = TypeVar("T")


@dataclass
class PageParams:
    limit: Optional[int] = None
    offset: int = 0


def page_params(
    limit: Optional[int] = Query(
        default=None,
        ge=1,
        le=MAX_LIMIT,
        description=f"한 번에 가져올 개수 (1~{MAX_LIMIT}). 생략하면 전체",
    ),
    offset: int = Query(default=0, ge=0, description="건너뛸 개수 (페이지 시작 위치)"),
) -> PageParams:
    """라우터에서 Depends(page_params)로 사용하는 페이지 파라미터 의존성."""
    return PageParams(limit=limit, offset=offset)


@dataclass
class Page(Generic[T]):
    items: List[T]
    total: int


def paginate(query: SAQuery, page: Optional[PageParams] = None) -> Page:
    """정렬까지 끝난 쿼리에 페이지를 적용하고 전체 개수와 함께 반환합니다."""
    page = page or PageParams()
    total = query.order_by(None).count()
    if page.offset:
        query = query.offset(page.offset)
    if page.limit is not None:
        query = query.limit(page.limit)
    return Page(items=query.all(), total=total)
