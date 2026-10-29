"""
인증(회원가입/로그인) 관련 API 라우터.

회원가입(POST /auth/signup), 로그인(POST /auth/login)을 구현합니다.
로그인 성공 시 JWT Access Token(짧은 만료)과 Refresh Token(긴 만료)을 발급합니다.
Access Token이 만료되면 POST /auth/refresh 로 다시 로그인하지 않고 새 토큰을 받습니다.
OAuth2, 권한 검사는 이후 이슈에서 다룹니다.
"""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from crud import (
    create_refresh_token,
    get_recruitment_setting,
    get_refresh_token_by_hash,
    revoke_all_refresh_tokens,
    revoke_refresh_token,
)
from database import get_db
from dependencies import get_current_member
from login_throttle import (
    check_login_allowed,
    clear_login_failures,
    get_client_ip,
    record_login_failure,
)
from models import MemberDB
from schemas import MemberLoginRequest, MemberSignupRequest, RefreshTokenRequest, TokenResponse
from security import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS,
    create_access_token,
    generate_refresh_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["인증"])

_INVALID_REFRESH = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="로그인이 만료되었습니다. 다시 로그인해 주세요.",
)


def _as_utc(value: datetime) -> datetime:
    """SQLite는 시간대 정보 없이 돌려주므로 UTC로 맞춰 비교합니다."""
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


def _issue_tokens(db: Session, member: MemberDB) -> dict:
    """Access Token과 새 Refresh Token을 함께 발급합니다."""
    refresh_token = generate_refresh_token()
    create_refresh_token(
        db,
        member_id=member.id,
        token_hash=hash_refresh_token(refresh_token),
        expires_at=datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    )
    return {
        "access_token": create_access_token(login_id=member.login_id),
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "refresh_token": refresh_token,
        "refresh_expires_in": REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
    }


@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(payload: MemberSignupRequest, db: Session = Depends(get_db)):
    """
    회원가입 API.

    처리 순서:
    0) 관리자가 모집을 열어둔 상태인지 확인 (닫혀 있으면 403)
    1) login_id 중복 확인
    2) student_id 중복 확인
    3) 비밀번호 처리 (security.hash_password를 통해 bcrypt로 해싱)
    4) MemberDB로 변환해서 저장
    5) 생성된 회원 정보 반환 (비밀번호 관련 값은 응답에서 제외)
    """

    # 0) 모집 기간이 아니면 가입 신청을 받지 않음
    if not get_recruitment_setting(db).is_open:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="지금은 모집 기간이 아닙니다. 모집이 시작되면 다시 지원해 주세요.",
        )

    # 1) login_id 중복 확인
    existing_login_id = (
        db.query(MemberDB).filter(MemberDB.login_id == payload.login_id).first()
    )
    if existing_login_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="이미 사용 중인 로그인 아이디입니다.",
        )

    # 2) student_id 중복 확인
    existing_student_id = (
        db.query(MemberDB).filter(MemberDB.student_id == payload.student_id).first()
    )
    if existing_student_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="이미 가입된 학번입니다.",
        )

    # 3) 비밀번호 처리
    # payload.password는 평문 그대로 들어오는데, 이 값을 MemberDB에 바로 대입하지 않고
    # 반드시 hash_password()를 거쳐 bcrypt로 해싱한 값만 DB에 저장함
    processed_password = hash_password(payload.password)

    # 4) DB 모델로 변환 후 저장
    # 가입 신청 = Member 생성. join_status=pending (is_approved는 join_status에서 계산)
    new_member = MemberDB(
        login_id=payload.login_id,
        hashed_password=processed_password,
        name=payload.name,
        student_id=payload.student_id,
        department=payload.department,
        grade=payload.grade,
        phone_number=payload.phone_number,
        email=payload.email,
        apply_reason=payload.apply_reason,
        desired_activity=payload.desired_activity,
        join_status="pending",
    )

    db.add(new_member)
    try:
        db.commit()
    except IntegrityError:
        # login_id/student_id는 위에서 이미 확인했지만, phone_number/email처럼
        # DB에 unique 제약이 걸린 다른 컬럼에서 동시 가입 등으로 충돌이 날 수 있어
        # 이를 500 에러가 아닌 안전한 409 응답으로 변환해주는 안전장치
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="이미 등록된 전화번호 또는 이메일입니다.",
        )

    db.refresh(new_member)

    # 5) 응답: 비밀번호(해시/평문 모두) 관련 필드는 절대 포함하지 않음
    return {
        "message": "가입 신청이 완료되었습니다. 면접 및 승인 완료 후 이용 가능합니다.",
        "member": {
            "id": new_member.id,
            "public_id": new_member.public_id,
            "login_id": new_member.login_id,
            "name": new_member.name,
            "student_id": new_member.student_id,
            "department": new_member.department,
            "grade": new_member.grade,
            "phone_number": new_member.phone_number,
            "email": new_member.email,
            "system_role": new_member.system_role,
            "club_position": new_member.club_position,
            "is_approved": new_member.is_approved,
            "join_status": new_member.join_status,
            "apply_reason": new_member.apply_reason,
            "desired_activity": new_member.desired_activity,
        },
    }


@router.post("/login", response_model=TokenResponse)
def login(
    payload: MemberLoginRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    로그인 API.

    처리 순서:
    1) login_id로 회원 조회
    2) verify_password()로 입력한 평문 비밀번호와 DB의 해시값 비교
    3) is_approved=False 이면 403 Forbidden (관리자 승인 전 로그인 차단)
    4) 성공 시 JWT Access Token 발급 후 반환 / 실패 시 401 Unauthorized 반환

    같은 아이디·IP에서 실패가 반복되면 login_throttle 규칙에 따라 429를 반환합니다.
    """

    client_ip = get_client_ip(request)
    check_login_allowed(payload.login_id, client_ip)

    # 1) login_id로 회원 조회
    member = (
        db.query(MemberDB).filter(MemberDB.login_id == payload.login_id).first()
    )

    # 2) 회원이 없거나 비밀번호가 일치하지 않는 경우
    # 두 실패 케이스(아이디 없음 / 비밀번호 틀림)를 동일한 401 + 동일한 메시지로 처리해서
    # "이 아이디는 존재하지 않는다" 같은 정보가 응답을 통해 유출되지 않도록 함
    if not member or not verify_password(payload.password, member.hashed_password):
        record_login_failure(payload.login_id, client_ip)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="아이디 또는 비밀번호가 올바르지 않습니다.",
        )

    clear_login_failures(payload.login_id)

    # 3) 관리자 승인 전 / 탈락 회원은 로그인 불가
    if member.join_status == "rejected":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="가입 신청이 탈락 처리되었습니다.",
        )
    if not member.is_approved:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="관리자 승인 대기 중입니다. 승인 후 로그인할 수 있습니다.",
        )

    # 4) 로그인 성공: JWT Access Token 생성 후 반환
    return _issue_tokens(db, member)


@router.post("/refresh", response_model=TokenResponse)
def refresh(payload: RefreshTokenRequest, db: Session = Depends(get_db)):
    """
    토큰 갱신 API.

    Access Token이 만료되면 로그인 때 받은 refresh_token으로 새 토큰 한 쌍을 받습니다.
    - 사용한 refresh_token은 즉시 폐기되고 새 refresh_token이 발급됩니다. (rotation)
    - 이미 폐기된 refresh_token이 다시 들어오면 도난으로 보고 그 회원의 모든 로그인을 끊습니다.
    - 만료·폐기·없는 토큰이거나, 승인이 취소된 회원이면 401을 반환합니다.
    """
    stored = get_refresh_token_by_hash(db, hash_refresh_token(payload.refresh_token))
    if stored is None:
        raise _INVALID_REFRESH
    if stored.revoked_at is not None:
        revoke_all_refresh_tokens(db, stored.member_id)
        raise _INVALID_REFRESH
    if _as_utc(stored.expires_at) <= datetime.now(timezone.utc):
        revoke_refresh_token(db, stored)
        raise _INVALID_REFRESH

    member = stored.member
    revoke_refresh_token(db, stored)
    if member is None or not member.is_approved:
        raise _INVALID_REFRESH
    return _issue_tokens(db, member)


@router.post("/logout")
def logout(payload: RefreshTokenRequest, db: Session = Depends(get_db)):
    """
    로그아웃 API.

    전달한 refresh_token을 폐기해 이 기기의 로그인 유지를 끝냅니다.
    (Access Token은 남은 만료 시간 동안 유효하므로 프론트에서 함께 지워야 합니다.)
    이미 폐기됐거나 없는 토큰이어도 같은 응답을 돌려줍니다.
    """
    stored = get_refresh_token_by_hash(db, hash_refresh_token(payload.refresh_token))
    if stored is not None:
        revoke_refresh_token(db, stored)
    return {"message": "로그아웃되었습니다."}


@router.post("/logout-all")
def logout_all(
    current_member: MemberDB = Depends(get_current_member),
    db: Session = Depends(get_db),
):
    """모든 기기 로그아웃 API. 내 계정의 Refresh Token을 모두 폐기합니다."""
    revoke_all_refresh_tokens(db, current_member.id)
    return {"message": "모든 기기에서 로그아웃되었습니다."}


@router.get("/me")
def me(current_member: MemberDB = Depends(get_current_member)):
    """
    내 정보 조회 API (토큰 인증 필요).

    Authorization: Bearer <token> 헤더를 통해 토큰을 전달합니다.
    - 토큰이 없거나 유효하지 않으면 401 Unauthorized를 반환합니다.
    - 토큰이 유효하면 로그인한 회원의 정보를 반환합니다.
    """
    return {
        "id": current_member.id,
        "public_id": current_member.public_id,
        "login_id": current_member.login_id,
        "name": current_member.name,
        "student_id": current_member.student_id,
        "department": current_member.department,
        "grade": current_member.grade,
        "phone_number": current_member.phone_number,
        "email": current_member.email,
        "system_role": current_member.system_role,
        "is_owner": current_member.is_owner,
        "club_position": current_member.club_position,
        "is_approved": current_member.is_approved,
        "join_status": current_member.join_status,
        "apply_reason": current_member.apply_reason,
        "desired_activity": current_member.desired_activity,
        "github_username": current_member.github_username,
        "bio": current_member.bio,
        "tech_stack": current_member.tech_stack,
    }
