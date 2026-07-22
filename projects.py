"""
프로젝트 조회 API 라우터.

Issue #9의 공개 조회(GET /projects, GET /projects/{public_id})를 구현합니다.
생성·수정·삭제는 admin.py의 /admin/projects 경로에서 처리합니다.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from crud import get_project_by_public_id, get_projects
from database import get_db
from schemas import ProjectListResponse, ProjectResponse

router = APIRouter(prefix="/projects", tags=["프로젝트"])


@router.get("", response_model=ProjectListResponse)
def list_projects(db: Session = Depends(get_db)):
    """
    프로젝트 목록 조회 API (Public).

    비로그인 사용자도 전체 목록을 조회할 수 있습니다.
    """
    projects = get_projects(db)
    return {
        "total": len(projects),
        "items": [ProjectResponse.model_validate(p) for p in projects],
    }


@router.get("/{public_id}", response_model=ProjectResponse)
def get_project(public_id: str, db: Session = Depends(get_db)):
    """
    프로젝트 상세 조회 API (Public).

    존재하지 않는 public_id이면 404 Not Found를 반환합니다.
    """
    project = get_project_by_public_id(db, public_id)
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="해당 프로젝트를 찾을 수 없습니다.",
        )
    return ProjectResponse.model_validate(project)
