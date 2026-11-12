"""
프로젝트·스터디 가입 및 멤버 관리 API 라우터.

회원
- GET    /{kind}/{public_id}/membership/me   내 가입 상태 + 관리 권한
- POST   /{kind}/{public_id}/join             가입 신청 (모집 중일 때만, pending 으로 저장)
- DELETE /{kind}/{public_id}/join             가입 신청 취소 / 탈퇴

리더(이 활동의 leader) 또는 사이트 관리자
- GET    /{kind}/{public_id}/members                       가입 신청 대기 포함 멤버 목록
- POST   /{kind}/{public_id}/members                       회원 직접 추가 (인원 추가)
- PATCH  /{kind}/{public_id}/members/{member_public_id}    가입 승인 / 리더 임명·해제
- DELETE /{kind}/{public_id}/members/{member_public_id}    멤버 제외 / 가입 신청 거절

리더 임명·해제(role 변경)와 다른 리더 제외는 사이트 관리자만 할 수 있습니다.
kind 는 projects / studies 두 가지이며, /admin/... 경로와 겹치지 않도록 고정 경로로 등록합니다.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from crud import (
    add_activity_membership,
    delete_activity_membership,
    get_activity_by_kind,
    get_activity_membership,
    get_member_by_public_id,
    update_activity_membership,
)
from database import get_db
from dependencies import get_current_member
from models import ActivityMembershipDB, MemberDB, ProjectDB
from schemas import (
    ActivityMemberAddRequest,
    ActivityMembershipListResponse,
    ActivityMembershipManageResponse,
    ActivityMemberUpdateRequest,
    MyActivityMembershipResponse,
)

_LABELS = {"projects": "프로젝트", "studies": "스터디"}


def _is_admin(member: MemberDB) -> bool:
    return member.system_role == "admin"


def _is_leader(membership: Optional[ActivityMembershipDB]) -> bool:
    return (
        membership is not None
        and membership.status == "approved"
        and membership.role == "leader"
    )


def _my_state(db: Session, activity: ProjectDB, member: MemberDB) -> MyActivityMembershipResponse:
    membership = get_activity_membership(db, activity.id, member.id)
    return MyActivityMembershipResponse(
        status=membership.status if membership else "none",
        role=membership.role if membership else None,
        can_manage=_is_admin(member) or _is_leader(membership),
        can_appoint=_is_admin(member),
    )


def build_router(kind: str) -> APIRouter:
    label = _LABELS[kind]
    router = APIRouter(prefix=f"/{kind}", tags=[f"{label} 멤버"])

    def load_activity(public_id: str, db: Session) -> ProjectDB:
        activity = get_activity_by_kind(db, kind, public_id)
        if activity is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"해당 {label}를 찾을 수 없습니다.",
            )
        return activity

    def require_manager(activity: ProjectDB, member: MemberDB, db: Session) -> None:
        if _is_admin(member):
            return
        if _is_leader(get_activity_membership(db, activity.id, member.id)):
            return
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"{label} 리더 또는 관리자만 멤버를 관리할 수 있습니다.",
        )

    def load_target(activity: ProjectDB, member_public_id: str, db: Session) -> ActivityMembershipDB:
        target_member = get_member_by_public_id(db, member_public_id)
        membership = (
            get_activity_membership(db, activity.id, target_member.id)
            if target_member
            else None
        )
        if membership is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"이 {label}에 해당 회원이 없습니다.",
            )
        return membership

    @router.get("/{public_id}/membership/me", response_model=MyActivityMembershipResponse)
    def get_my_membership(
        public_id: str,
        current_member: MemberDB = Depends(get_current_member),
        db: Session = Depends(get_db),
    ):
        """내 가입 상태(none / pending / approved)와 멤버 관리 권한을 반환합니다."""
        return _my_state(db, load_activity(public_id, db), current_member)

    @router.post("/{public_id}/join", response_model=MyActivityMembershipResponse, status_code=status.HTTP_201_CREATED)
    def join_activity(
        public_id: str,
        current_member: MemberDB = Depends(get_current_member),
        db: Session = Depends(get_db),
    ):
        """가입 신청. 모집 중이고 완료되지 않은 활동에만 신청할 수 있으며, 리더·관리자 승인 후 확정됩니다."""
        activity = load_activity(public_id, db)
        if get_activity_membership(db, activity.id, current_member.id) is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"이미 가입했거나 신청한 {label}입니다.",
            )
        if not activity.is_recruiting or activity.status == "completed":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"지금은 이 {label}의 멤버를 모집하고 있지 않습니다.",
            )
        add_activity_membership(db, activity, current_member, role="member", status="pending")
        return _my_state(db, activity, current_member)

    @router.delete("/{public_id}/join", response_model=MyActivityMembershipResponse)
    def leave_activity(
        public_id: str,
        current_member: MemberDB = Depends(get_current_member),
        db: Session = Depends(get_db),
    ):
        """가입 신청 취소 또는 활동 탈퇴."""
        activity = load_activity(public_id, db)
        membership = get_activity_membership(db, activity.id, current_member.id)
        if membership is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"가입하거나 신청한 {label}가 아닙니다.",
            )
        delete_activity_membership(db, membership)
        return _my_state(db, activity, current_member)

    @router.get("/{public_id}/members", response_model=ActivityMembershipListResponse)
    def list_activity_members(
        public_id: str,
        current_member: MemberDB = Depends(get_current_member),
        db: Session = Depends(get_db),
    ):
        """가입 신청 대기를 포함한 멤버 목록 (리더·관리자)."""
        activity = load_activity(public_id, db)
        require_manager(activity, current_member, db)
        items = [ActivityMembershipManageResponse.model_validate(m) for m in activity.memberships]
        return {"total": len(items), "items": items}

    @router.post(
        "/{public_id}/members",
        response_model=ActivityMembershipManageResponse,
        status_code=status.HTTP_201_CREATED,
    )
    def add_activity_member(
        public_id: str,
        payload: ActivityMemberAddRequest,
        current_member: MemberDB = Depends(get_current_member),
        db: Session = Depends(get_db),
    ):
        """회원을 바로 멤버로 추가합니다. 리더로 추가하는 것은 관리자만 가능합니다."""
        activity = load_activity(public_id, db)
        require_manager(activity, current_member, db)
        if payload.role == "leader" and not _is_admin(current_member):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="리더 임명은 관리자만 할 수 있습니다.",
            )

        target = get_member_by_public_id(db, payload.member_public_id)
        if target is None or not target.is_approved:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="추가할 회원을 찾을 수 없습니다. (가입 승인된 회원만 추가할 수 있습니다)",
            )

        existing = get_activity_membership(db, activity.id, target.id)
        if existing is not None:
            if existing.status == "approved":
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"이미 이 {label}의 멤버입니다.",
                )
            # 가입 신청 대기 중이던 회원을 추가하면 승인으로 처리합니다.
            membership = update_activity_membership(
                db, existing, {"status": "approved", "role": payload.role}
            )
        else:
            membership = add_activity_membership(db, activity, target, role=payload.role)
        return ActivityMembershipManageResponse.model_validate(membership)

    @router.patch(
        "/{public_id}/members/{member_public_id}",
        response_model=ActivityMembershipManageResponse,
    )
    def update_activity_member(
        public_id: str,
        member_public_id: str,
        payload: ActivityMemberUpdateRequest,
        current_member: MemberDB = Depends(get_current_member),
        db: Session = Depends(get_db),
    ):
        """가입 신청 승인(status=approved) 또는 리더 임명·해제(role, 관리자 전용)."""
        activity = load_activity(public_id, db)
        require_manager(activity, current_member, db)
        membership = load_target(activity, member_public_id, db)

        updates = payload.model_dump(exclude_unset=True, exclude_none=True)
        if not updates:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="변경할 항목이 없습니다.",
            )
        if "role" in updates:
            if not _is_admin(current_member):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="리더 임명·해제는 관리자만 할 수 있습니다.",
                )
            if updates["role"] == "leader":
                # 리더로 임명하면 가입 신청 중이던 회원도 바로 확정합니다.
                updates["status"] = "approved"

        membership = update_activity_membership(db, membership, updates)
        return ActivityMembershipManageResponse.model_validate(membership)

    @router.delete("/{public_id}/members/{member_public_id}")
    def remove_activity_member(
        public_id: str,
        member_public_id: str,
        current_member: MemberDB = Depends(get_current_member),
        db: Session = Depends(get_db),
    ):
        """멤버 제외 또는 가입 신청 거절. 다른 리더를 제외하는 것은 관리자만 가능합니다."""
        activity = load_activity(public_id, db)
        require_manager(activity, current_member, db)
        membership = load_target(activity, member_public_id, db)
        if (
            membership.role == "leader"
            and membership.member_id != current_member.id
            and not _is_admin(current_member)
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="다른 리더는 관리자만 제외할 수 있습니다.",
            )
        was_pending = membership.status == "pending"
        delete_activity_membership(db, membership)
        return {"message": "가입 신청을 거절했습니다." if was_pending else "멤버에서 제외했습니다."}

    return router


project_members_router = build_router("projects")
study_members_router = build_router("studies")
