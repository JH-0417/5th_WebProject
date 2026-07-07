"""
회원가입 / 로그인 요청(Request)에 사용되는 Pydantic 스키마 모음.

- models.py의 MemberDB(DB 모델)와는 별개로, "API가 클라이언트로부터 받는 데이터의 형태"만 정의합니다.
- 지금 단계에서는 요청(Request) 스키마만 작성하고, 응답(Response) 스키마는 아직 만들지 않습니다.
- pydantic 2.12.5 기준: Field의 예시는 v1 방식인 example=(단수)이 아니라 examples=[...](리스트) 형태로 씁니다.
"""

from pydantic import BaseModel, EmailStr, Field


class MemberSignupRequest(BaseModel):
    """
    회원가입 요청 스키마.

    MemberDB의 "필수 입력" 컬럼과 1:1로 대응하도록 구성했습니다.
    - role, is_approved, public_id 등은 서버가 자동으로 채우는 값이라 여기 포함하지 않습니다.
      (특히 role/is_approved는 클라이언트가 직접 지정할 수 있게 하면 권한 상승 공격에 노출되므로 절대 포함 금지)
    - github_username / bio / tech_stack은 가입 후 마이페이지에서 입력하는 선택 항목이라 여기 포함하지 않습니다.
    - password는 아직 암호화하지 않은 평문 그대로 받습니다.
      (해싱은 이 스키마가 아니라, 이후 회원가입 처리 로직(서비스 계층)에서 DB에 저장하기 직전에 수행합니다.)
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
    grade: str = Field(
        ...,
        max_length=10,
        description="학년",
        examples=["3학년"],
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
