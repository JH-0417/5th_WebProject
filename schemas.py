"""
회원가입 / 로그인 요청(Request) 및 회원 조회 응답(Response)에 사용되는 Pydantic 스키마 모음.

- models.py의 MemberDB(DB 모델)와는 별개로, API의 입출력 형태만 정의합니다.
- pydantic 2.x 기준:
  - Field 예시는 examples=[...](리스트) 형태로 작성합니다.
  - ORM 객체를 스키마로 변환할 때는 model_config = ConfigDict(from_attributes=True)를 사용합니다.
"""

from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class MemberSignupRequest(BaseModel):
    """
    회원가입 요청 스키마.

    MemberDB의 "필수 입력" 컬럼과 1:1로 대응하도록 구성했습니다.
    - role, is_approved, public_id 등은 서버가 자동으로 채우는 값이라 여기 포함하지 않습니다.
      (특히 role/is_approved는 클라이언트가 직접 지정할 수 있게 하면 권한 상승 공격에 노출되므로 절대 포함 금지)
    - github_username / bio / tech_stack은 가입 후 마이페이지에서 입력하는 선택 항목이라 여기 포함하지 않습니다.
    - password는 클라이언트로부터 평문 그대로 받습니다.
      (해싱은 이 스키마가 아니라, 회원가입 처리 로직(auth.py)에서 DB에 저장하기 직전에 security.hash_password()로 수행합니다.)
    """

    login_id: str = Field(
        ...,
        max_length=12,
        description="로그인에 사용할 아이디",
        examples=["hong123"],
    )
    password: str = Field(
        ...,
        min_length=8,
        max_length=64,
        description="비밀번호 (평문 그대로 받으며, 암호화는 이 단계에서 하지 않음)",
        examples=["Passw0rd!"],
    )
    name: str = Field(
        ...,
        max_length=30,
        description="이름",
        examples=["홍길동"],
    )
    student_id: str = Field(
        ...,
        max_length=10,
        description="학번",
        examples=["20231234"],
    )
    department: str = Field(
        ...,
        max_length=50,
        description="학과",
        examples=["컴퓨터공학과"],
    )
    grade: int = Field(
        ...,
        ge=1,
        le=4,
        description="학년 (1~4 정수)",
        examples=[3],
    )
    phone_number: str = Field(
        ...,
        pattern=r"^\d{9,11}$",  # 하이픈 없이 숫자만, "010" 등 지역/통신사 접두사 포함 전체 번호
        description="휴대폰 번호 (하이픈 없이 숫자만 입력, 예: 01012345678)",
        examples=["01012345678"],
    )
    email: EmailStr = Field(
        ...,
        description="이메일 주소",
        examples=["hong@example.com"],
    )


class MemberLoginRequest(BaseModel):
    """
    로그인 요청 스키마.

    login_id + password만 받습니다.
    password는 로그인 시 DB에 저장된 hashed_password와 검증(verify)하는 용도로 쓰이며,
    회원가입 때와 마찬가지로 평문 그대로 받습니다.
    """

    login_id: str = Field(
        ...,
        max_length=12,
        description="로그인 아이디",
        examples=["hong123"],
    )
    password: str = Field(
        ...,
        description="비밀번호 (평문)",
        examples=["Passw0rd!"],
    )


# ─── 응답(Response) 스키마 ──────────────────────────────────────────────────────

class MemberPublicResponse(BaseModel):
    """
    비로그인 공개 응답 스키마.

    외부인도 볼 수 있는 정보만 포함합니다.
    학번은 앞 4자리만 남기고 나머지를 *로 가린 masked_student_id로 대체합니다.
    예) "20261234" → "2026*****"
    마스킹 처리는 라우터(members.py)에서 수행 후 이 스키마로 전달합니다.
    """

    model_config = ConfigDict(from_attributes=True)

    public_id: str = Field(description="공개 식별자 (UUID, URL 식별용)")
    name: str = Field(description="이름")
    masked_student_id: str = Field(description="마스킹된 학번 (앞 4자리 + *****)")
    department: str = Field(description="학과")
    grade: int = Field(description="학년 (1~4)")
    email: str = Field(description="이메일 (급하게 연락 방안)")
    role: str = Field(description="역할 (admin / pm / member)")
    github_username: Optional[str] = Field(default=None, description="GitHub 사용자명")
    bio: Optional[str] = Field(default=None, description="자기소개")
    tech_stack: Optional[str] = Field(default=None, description="기술 스택")


class MemberResponse(BaseModel):
    """
    로그인한 사용자용 응답 스키마.

    동아리 가입이 확인된 회원에게만 노출하는 정보를 포함합니다.
    student_id가 완전히 노출되며, is_approved 상태도 확인할 수 있습니다.
    hashed_password / login_id / phone_number는 여기서도 제외합니다.
    """

    model_config = ConfigDict(from_attributes=True)

    public_id: str = Field(description="공개 식별자 (UUID, URL 식별용)")
    name: str = Field(description="이름")
    student_id: str = Field(description="학번 (완전 노출)")
    department: str = Field(description="학과")
    grade: int = Field(description="학년 (1~4)")
    email: str = Field(description="이메일")
    role: str = Field(description="역할 (admin / pm / member)")
    is_approved: bool = Field(description="가입 승인 여부")
    github_username: Optional[str] = Field(default=None, description="GitHub 사용자명")
    bio: Optional[str] = Field(default=None, description="자기소개")
    tech_stack: Optional[str] = Field(default=None, description="기술 스택")


class MemberUpdateRequest(BaseModel):
    """
    관리자용 회원 부분 수정(PATCH) 요청 스키마.

    unique 컬럼, 승인 여부, 역할만 수정할 수 있습니다.
    - 포함: student_id, phone_number, email, is_approved, role
    - 제외: login_id, hashed_password, public_id
    - 제외: name, department, grade, github_username, bio, tech_stack
    모든 필드는 Optional이며, 요청에 포함된 필드만 업데이트합니다.
    role 변경은 admin 회원 삭제 전 권한 하향(member/pm)에 사용합니다.
    """

    student_id: Optional[str] = Field(
        default=None,
        max_length=10,
        description="학번",
        examples=["20231234"],
    )
    phone_number: Optional[str] = Field(
        default=None,
        pattern=r"^\d{9,11}$",
        description="휴대폰 번호 (하이픈 없이 숫자만)",
        examples=["01012345678"],
    )
    email: Optional[EmailStr] = Field(
        default=None,
        description="이메일 주소",
        examples=["hong@example.com"],
    )
    is_approved: Optional[bool] = Field(
        default=None,
        description="가입 승인 여부",
        examples=[True],
    )
    role: Optional[str] = Field(
        default=None,
        pattern=r"^(admin|pm|member)$",
        description="역할 (admin / pm / member). admin 삭제 전 권한 하향에 사용",
        examples=["member"],
    )

class PasswordChangeRequest(BaseModel):
    """
    본인 비밀번호 변경 요청 스키마.

    current_password로 본인 확인 후 new_password로 교체합니다.
    해싱은 라우터에서 security.hash_password()로 수행합니다.
    """

    current_password: str = Field(
        ...,
        description="현재 비밀번호 (평문)",
        examples=["Passw0rd!"],
    )
    new_password: str = Field(
        ...,
        min_length=8,
        max_length=64,
        description="새 비밀번호 (평문, 회원가입과 동일한 길이 규칙)",
        examples=["NewPassw0rd!"],
    )


class PasswordResetResponse(BaseModel):
    """관리자 비밀번호 초기화 성공 응답 스키마."""

    message: str = Field(description="처리 결과 메시지")
    temporary_password: str = Field(description="고정 임시 비밀번호 (회원에게 안내)")
    public_id: str = Field(description="초기화된 회원의 public_id")


class MemberPublicListResponse(BaseModel):
    """비로그인 회원 목록 응답 스키마."""

    total: int = Field(description="전체 회원 수")
    items: List[MemberPublicResponse] = Field(description="회원 목록")


class MemberListResponse(BaseModel):
    """로그인한 사용자용 회원 목록 응답 스키마."""

    total: int = Field(description="전체 회원 수")
    items: List[MemberResponse] = Field(description="회원 목록")
