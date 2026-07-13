"""
인증(회원가입/로그인) 관련 API 라우터.

회원가입(POST /auth/signup), 로그인(POST /auth/login)을 구현합니다.
로그인 성공 시 JWT Access Token을 발급합니다.
OAuth2, 권한 검사는 이후 이슈에서 다룹니다.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_member
from models import MemberDB
from schemas import MemberLoginRequest, MemberSignupRequest
from security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["인증"])


@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(payload: MemberSignupRequest, db: Session = Depends(get_db)):
    """
    회원가입 API.

    처리 순서:
    1) login_id 중복 확인
    2) student_id 중복 확인
    3) 비밀번호 처리 (security.hash_password를 통해 bcrypt로 해싱)
    4) MemberDB로 변환해서 저장
    5) 생성된 회원 정보 반환 (비밀번호 관련 값은 응답에서 제외)
    """

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
    new_member = MemberDB(
        login_id = payload.login_id,
        hashed_password = processed_password,
        name = payload.name,
        student_id = payload.student_id,
        department = payload.department,
        grade = payload.grade,
        phone_number = payload.phone_number,
        email = payload.email,
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
        "message": "회원가입이 완료되었습니다.",
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
            "role": new_member.role,
            "is_approved": new_member.is_approved,
        },
    }


@router.post("/login")
def login(payload: MemberLoginRequest, db: Session = Depends(get_db)):
    """
    로그인 API.

    처리 순서:
    1) login_id로 회원 조회
    2) verify_password()로 입력한 평문 비밀번호와 DB의 해시값 비교
    3) 성공 시 JWT Access Token 발급 후 반환 / 실패 시 401 Unauthorized 반환
    """

    # 1) login_id로 회원 조회
    member = (
        db.query(MemberDB).filter(MemberDB.login_id == payload.login_id).first()
    )

    # 2) 회원이 없거나 비밀번호가 일치하지 않는 경우
    # 두 실패 케이스(아이디 없음 / 비밀번호 틀림)를 동일한 401 + 동일한 메시지로 처리해서
    # "이 아이디는 존재하지 않는다" 같은 정보가 응답을 통해 유출되지 않도록 함
    if not member or not verify_password(payload.password, member.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="아이디 또는 비밀번호가 올바르지 않습니다.",
        )

    # 3) 로그인 성공: JWT Access Token 생성 후 반환
    access_token = create_access_token(login_id=member.login_id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


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
        "role": current_member.role,
        "is_approved": current_member.is_approved,
    }
