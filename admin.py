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

from crud import (
    create_project,
    create_study,
    delete_member,
    delete_project,
    delete_study,
    get_member_by_public_id,
    update_member,
    update_member_password,
    update_project,
    update_study,
)
from database import get_db
from dependencies import require_admin
from models import MemberDB
from schemas import (
    MemberResponse,
    MemberUpdateRequest,
    PasswordResetResponse,
    ProjectCreateRequest,
    ProjectResponse,
    ProjectUpdateRequest,
    StudyCreateRequest,
    StudyResponse,
    StudyUpdateRequest,
)
from security import TEMPORARY_PASSWORD, hash_password

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
        member = update_member(db, public_id, updates)      #update_member내부 commit 처리

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


@router.delete("/members/{public_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(
    public_id: str,
    current_member: MemberDB = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    관리자용 회원 삭제 API.

    - require_admin()으로 관리자만 접근 가능합니다.
    - role이 admin인 회원은 삭제할 수 없습니다. (먼저 role을 내린 뒤 삭제)
    - 성공 시 204 No Content를 반환합니다.
    - 회원이 없으면 404를 반환합니다.
    """
    member = get_member_by_public_id(db, public_id)
    if member is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="해당 회원을 찾을 수 없습니다.",
        )
    if member.role == "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="admin 권한 회원은 삭제할 수 없습니다. role을 변경한 뒤 다시 시도하세요.",
        )

    delete_member(db, public_id)
    return None


@router.post(
    "/members/{public_id}/reset-password",
    response_model=PasswordResetResponse,
)
def reset_member_password(
    public_id: str,
    current_member: MemberDB = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    관리자용 비밀번호 초기화 API (방식 A: 고정 임시 비밀번호).

    - require_admin()으로 관리자만 접근 가능합니다.
    - 회원이 없으면 404를 반환합니다.
    - 임시 비밀번호는 BCrypt로 해싱해 저장하고, 평문은 응답에만 포함합니다.
    - 이메일 발송은 이번 Issue 범위에 포함하지 않습니다.
    """
    member = get_member_by_public_id(db, public_id)
    if member is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="해당 회원을 찾을 수 없습니다.",
        )

    update_member_password(db, member, hash_password(TEMPORARY_PASSWORD))
    return PasswordResetResponse(
        message="비밀번호가 임시 비밀번호로 초기화되었습니다.",
        temporary_password=TEMPORARY_PASSWORD,
        public_id=member.public_id,
    )


# ─── 프로젝트 관리 ─────────────────────────────────────────────────────────────

@router.post(
    "/projects",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_admin_project(
    payload: ProjectCreateRequest,
    current_member: MemberDB = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    관리자용 프로젝트 생성 API.

    - require_admin()으로 관리자만 접근 가능합니다.
    - category는 create_project()에서 project로 고정합니다.
    - 성공 시 201 Created + ProjectResponse를 반환합니다.
    """
    project = create_project(db, payload.model_dump())
    return ProjectResponse.model_validate(project)


@router.patch("/projects/{public_id}", response_model=ProjectResponse)
def patch_admin_project(
    public_id: str,
    payload: ProjectUpdateRequest,
    current_member: MemberDB = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    관리자용 프로젝트 부분 수정 API.

    - require_admin()으로 관리자만 접근 가능합니다.
    - 요청에 포함된 필드만 수정합니다. (Partial Update)
    - category=project 가 아니면 404를 반환합니다.
    """
    project = update_project(db, public_id, payload.model_dump(exclude_unset=True))
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="해당 프로젝트를 찾을 수 없습니다.",
        )
    return ProjectResponse.model_validate(project)


@router.delete("/projects/{public_id}")
def remove_admin_project(
    public_id: str,
    current_member: MemberDB = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    관리자용 프로젝트 삭제 API.

    - require_admin()으로 관리자만 접근 가능합니다.
    - category=project 가 아니면 404를 반환합니다.
    - 성공 시 200 + message를 반환합니다.
    """
    deleted = delete_project(db, public_id)
    if deleted is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="해당 프로젝트를 찾을 수 없습니다.",
        )
    return {"message": "프로젝트가 삭제되었습니다."}


# ─── 스터디 관리 (ProjectDB, category=study) ───────────────────────────────────

@router.post(
    "/studies",
    response_model=StudyResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_admin_study(
    payload: StudyCreateRequest,
    current_member: MemberDB = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    관리자용 스터디 생성 API.

    - require_admin()으로 관리자만 접근 가능합니다.
    - category는 create_study()에서 study로 고정합니다.
    - 성공 시 201 Created + StudyResponse를 반환합니다.
    """
    study = create_study(db, payload.model_dump())
    return StudyResponse.model_validate(study)


@router.patch("/studies/{public_id}", response_model=StudyResponse)
def patch_admin_study(
    public_id: str,
    payload: StudyUpdateRequest,
    current_member: MemberDB = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    관리자용 스터디 부분 수정 API.

    - require_admin()으로 관리자만 접근 가능합니다.
    - 요청에 포함된 필드만 수정합니다. (Partial Update)
    - category=study 가 아니면 404를 반환합니다.
    """
    study = update_study(db, public_id, payload.model_dump(exclude_unset=True))
    if study is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="해당 스터디를 찾을 수 없습니다.",
        )
    return StudyResponse.model_validate(study)


@router.delete("/studies/{public_id}")
def remove_admin_study(
    public_id: str,
    current_member: MemberDB = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    관리자용 스터디 삭제 API.

    - require_admin()으로 관리자만 접근 가능합니다.
    - category=study 가 아니면 404를 반환합니다.
    - 성공 시 200 + message를 반환합니다.
    """
    deleted = delete_study(db, public_id)
    if deleted is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="해당 스터디를 찾을 수 없습니다.",
        )
    return {"message": "스터디가 삭제되었습니다."}
