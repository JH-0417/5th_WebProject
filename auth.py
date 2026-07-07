"""
인증(회원가입/로그인) 관련 API 라우터.

Issue #3의 첫 번째 기능인 회원가입(POST /auth/signup)만 구현합니다.
로그인, JWT, OAuth2, 권한 검사는 이후 이슈에서 다룹니다.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import get_db
from models import MemberDB
from schemas import MemberSignupRequest
from security import hash_password

router = APIRouter(prefix = "/auth", tags = ["인증"])


@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(payload: MemberSignupRequest, db: Session = Depends(get_db)):
    """
    회원가입 API.

    처리 순서:
    1) login_id 중복 확인
    2) student_id 중복 확인
    3) 비밀번호 처리 (지금은 암호화 미적용, security.hash_password를 통해 추후 실제 해싱으로 교체 가능하도록 구조화)
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
    # 반드시 hash_password()를 거치도록 해서 이후 실제 암호화 로직 도입 시 이 한 줄만 영향받도록 구조화함
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
