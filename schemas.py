"""
회원가입 / 로그인 요청(Request) 및 회원 조회 응답(Response)에 사용되는 Pydantic 스키마 모음.

- models.py의 MemberDB(DB 모델)와는 별개로, API의 입출력 형태만 정의합니다.
- pydantic 2.x 기준:
  - Field 예시는 examples=[...](리스트) 형태로 작성합니다.
  - ORM 객체를 스키마로 변환할 때는 model_config = ConfigDict(from_attributes=True)를 사용합니다.
"""

from datetime import datetime
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
    apply_reason: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="지원 사유",
        examples=["웹 개발을 배우고 팀 프로젝트 경험을 쌓고 싶어서 지원합니다."],
    )
    desired_activity: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="동아리 들어와서 해보고 싶은 활동",
        examples=["동아리 웹사이트 제작과 스터디 운영에 참여하고 싶습니다."],
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
    student_id가 완전히 노출되며, 가입 심사 상태도 확인할 수 있습니다.
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
    join_status: str = Field(description="가입 심사 상태 (pending / approved / rejected)")
    github_username: Optional[str] = Field(default=None, description="GitHub 사용자명")
    bio: Optional[str] = Field(default=None, description="자기소개")
    tech_stack: Optional[str] = Field(default=None, description="기술 스택")


class MemberAdminResponse(MemberResponse):
    """
    관리자용 회원 응답 스키마.

    가입 심사에 필요한 지원 문항(지원 사유, 희망 활동)을 포함합니다.
    """

    apply_reason: str = Field(description="지원 사유")
    desired_activity: str = Field(description="동아리 들어와서 해보고 싶은 활동")


class MemberAdminListResponse(BaseModel):
    """관리자용 회원 목록 응답 스키마."""

    total: int = Field(description="전체 건수")
    items: List[MemberAdminResponse] = Field(description="회원 목록")


class MemberJoinActionResponse(BaseModel):
    """가입 승인/탈락 처리 결과 응답 스키마."""

    message: str = Field(description="처리 결과 메시지")
    member: MemberAdminResponse = Field(description="처리된 회원 정보")


class MemberUpdateRequest(BaseModel):
    """
    관리자용 회원 부분 수정(PATCH) 요청 스키마.

    unique 컬럼, 승인 여부, 역할만 수정할 수 있습니다.
    - 포함: student_id, phone_number, email, is_approved, role
    - 제외: login_id, hashed_password, public_id
    - 제외: name, department, grade, github_username, bio, tech_stack
    모든 필드는 Optional이며, 요청에 포함된 필드만 업데이트합니다.
    role 변경은 admin 회원 삭제 전 권한 하향(member/pm)에 사용합니다.
    is_approved 변경 시 join_status도 함께 동기화됩니다.
    승인/탈락은 전용 API(/approve, /reject) 사용을 권장합니다.
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
        description="가입 승인 여부 (True면 join_status=approved, False면 pending)",
        examples=[True],
    )
    role: Optional[str] = Field(
        default=None,   #기본역할이 None뜻 아님.
        pattern=r"^(admin|pm|member)$",
        description="역할 (admin / pm / member). admin 삭제 전 권한 하향에 사용",
        examples=["member"],
    )

class MemberSelfUpdateRequest(BaseModel):
    """
    본인 프로필 부분 수정(PATCH /members/me) 요청 스키마.

    로그인한 회원만 자신의 정보를 수정합니다.
    - 포함: department, grade, phone_number, email, github_username, bio, tech_stack
    - 제외: login_id, student_id, name, role, is_approved, join_status, public_id, password
    모든 필드는 Optional이며, 요청에 포함된 필드만 업데이트합니다.
    """

    department: Optional[str] = Field(
        default=None,
        max_length=50,
        description="학과",
        examples=["컴퓨터공학과"],
    )
    grade: Optional[int] = Field(
        default=None,
        ge=1,
        le=4,
        description="학년 (1~4)",
        examples=[3],
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
    github_username: Optional[str] = Field(
        default=None,
        max_length=39,
        description="GitHub 사용자명",
        examples=["hong-dev"],
    )
    bio: Optional[str] = Field(
        default=None,
        max_length=2000,
        description="자기소개",
        examples=["웹 개발에 관심이 많습니다."],
    )
    tech_stack: Optional[str] = Field(
        default=None,
        max_length=2000,
        description="사용·관심 기술",
        examples=["Python, React, FastAPI"],
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


# ─── 프로젝트(Project) 스키마 ──────────────────────────────────────────────────

class ProjectCreateRequest(BaseModel):
    """프로젝트 생성 요청 스키마."""

    title: str = Field(
        ...,
        max_length=100,
        description="프로젝트명",
        examples=["제5세대 웹사이트"],
    )
    description: str = Field(
        ...,
        description="프로젝트 설명",
        examples=["동아리 공식 웹사이트 제작"],
    )
    tech_stack: Optional[str] = Field(
        default=None,
        description="사용 기술",
        examples=["FastAPI, React"],
    )
    status: str = Field(
        default="planned",
        pattern=r"^(planned|in_progress|completed)$",
        description="진행 상태 (planned / in_progress / completed)",
        examples=["planned"],
    )
    category: str = Field(
        default="project",
        pattern=r"^(project|study)$",
        description="분류 (project / study)",
        examples=["project"],
    )


class ProjectUpdateRequest(BaseModel):
    """프로젝트 부분 수정(PATCH) 요청 스키마. 전달된 필드만 수정합니다."""

    title: Optional[str] = Field(
        default=None,
        max_length=100,
        description="프로젝트명",
        examples=["제5세대 웹사이트"],
    )
    description: Optional[str] = Field(
        default=None,
        description="프로젝트 설명",
        examples=["동아리 공식 웹사이트 제작"],
    )
    tech_stack: Optional[str] = Field(
        default=None,
        description="사용 기술",
        examples=["FastAPI, React"],
    )
    status: Optional[str] = Field(
        default=None,
        pattern=r"^(planned|in_progress|completed)$",
        description="진행 상태 (planned / in_progress / completed)",
        examples=["in_progress"],
    )
    category: Optional[str] = Field(
        default=None,
        pattern=r"^(project|study)$",
        description="분류 (project / study)",
        examples=["study"],
    )


class ProjectResponse(BaseModel):
    """프로젝트 응답 스키마. 내부 id는 노출하지 않습니다."""

    model_config = ConfigDict(from_attributes=True)

    public_id: str = Field(description="공개 식별자 (UUID)")
    title: str = Field(description="프로젝트명")
    description: str = Field(description="프로젝트 설명")
    tech_stack: Optional[str] = Field(default=None, description="사용 기술")
    status: str = Field(description="진행 상태")
    category: str = Field(description="분류")
    created_at: datetime = Field(description="생성 시각")
    updated_at: datetime = Field(description="수정 시각")


class ProjectListResponse(BaseModel):
    """프로젝트 목록 응답 스키마."""

    total: int = Field(description="전체 프로젝트 수")
    items: List[ProjectResponse] = Field(description="프로젝트 목록")


# ─── 스터디(Study) 스키마 ──────────────────────────────────────────────────────
# Study는 별도 테이블 없이 ProjectDB(category="study")를 재사용합니다.

class StudyCreateRequest(BaseModel):
    """
    스터디 생성 요청 스키마.

    category는 서버에서 study로 고정하므로 요청에 포함하지 않습니다.
    """

    title: str = Field(
        ...,
        max_length=100,
        description="스터디명",
        examples=["알고리즘 스터디"],
    )
    description: str = Field(
        ...,
        description="스터디 설명",
        examples=["매주 코테 문제 풀이"],
    )
    tech_stack: Optional[str] = Field(
        default=None,
        description="사용 기술 / 주제",
        examples=["Python, 자료구조"],
    )
    status: str = Field(
        default="planned",
        pattern=r"^(planned|in_progress|completed)$",
        description="진행 상태 (planned / in_progress / completed)",
        examples=["planned"],
    )


class StudyUpdateRequest(BaseModel):
    """스터디 부분 수정 요청 스키마. category 변경은 허용하지 않습니다."""

    title: Optional[str] = Field(
        default=None,
        max_length=100,
        description="스터디명",
        examples=["알고리즘 스터디"],
    )
    description: Optional[str] = Field(
        default=None,
        description="스터디 설명",
        examples=["매주 코테 문제 풀이"],
    )
    tech_stack: Optional[str] = Field(
        default=None,
        description="사용 기술 / 주제",
        examples=["Python, 자료구조"],
    )
    status: Optional[str] = Field(
        default=None,
        pattern=r"^(planned|in_progress|completed)$",
        description="진행 상태 (planned / in_progress / completed)",
        examples=["in_progress"],
    )


class StudyResponse(ProjectResponse):
    """스터디 응답 스키마. ProjectResponse와 동일 필드입니다."""


class StudyListResponse(BaseModel):
    """스터디 목록 응답 스키마."""

    total: int = Field(description="전체 스터디 수")
    items: List[StudyResponse] = Field(description="스터디 목록")


# ─── 공지사항(Notice) 스키마 ───────────────────────────────────────────────────

class NoticeCreateRequest(BaseModel):
    """공지사항 생성 요청 스키마. is_pinned는 서버에서 False로 고정합니다."""

    title: str = Field(
        ...,
        max_length=100,
        description="공지 제목",
        examples=["정기 모임 안내"],
    )
    content: str = Field(
        ...,
        description="공지 내용",
        examples=["이번 주 금요일 저녁 7시에 정기 모임이 있습니다."],
    )
    event_start: Optional[datetime] = Field(
        default=None,
        description="행사 시작 시각 (일정 공지일 때만)",
        examples=["2026-03-15T10:00:00+09:00"],
    )
    event_end: Optional[datetime] = Field(
        default=None,
        description="행사 종료 시각 (일정 공지일 때만)",
        examples=["2026-03-15T18:00:00+09:00"],
    )
    location: Optional[str] = Field(
        default=None,
        max_length=200,
        description="행사 장소 (일정 공지일 때만)",
        examples=["학생회관 301호"],
    )


class NoticeUpdateRequest(BaseModel):
    """공지사항 부분 수정(PATCH) 요청 스키마. 전달된 필드만 수정합니다."""

    title: Optional[str] = Field(
        default=None,
        max_length=100,
        description="공지 제목",
        examples=["정기 모임 안내 (수정)"],
    )
    content: Optional[str] = Field(
        default=None,
        description="공지 내용",
        examples=["시간이 저녁 8시로 변경되었습니다."],
    )
    event_start: Optional[datetime] = Field(
        default=None,
        description="행사 시작 시각",
        examples=["2026-03-15T10:00:00+09:00"],
    )
    event_end: Optional[datetime] = Field(
        default=None,
        description="행사 종료 시각",
        examples=["2026-03-15T18:00:00+09:00"],
    )
    location: Optional[str] = Field(
        default=None,
        max_length=200,
        description="행사 장소",
        examples=["학생회관 301호"],
    )


class NoticeResponse(BaseModel):
    """공지사항 응답 스키마. 내부 id는 노출하지 않습니다."""

    model_config = ConfigDict(from_attributes=True)

    public_id: str = Field(description="공개 식별자 (UUID)")
    title: str = Field(description="공지 제목")
    content: str = Field(description="공지 내용")
    is_pinned: bool = Field(description="상단 고정 여부 (기능은 추후 구현)")
    event_start: Optional[datetime] = Field(default=None, description="행사 시작 시각")
    event_end: Optional[datetime] = Field(default=None, description="행사 종료 시각")
    location: Optional[str] = Field(default=None, description="행사 장소")
    created_at: datetime = Field(description="생성 시각")
    updated_at: datetime = Field(description="수정 시각")


class NoticeListResponse(BaseModel):
    """공지사항 목록 응답 스키마."""

    total: int = Field(description="전체 공지사항 수")
    items: List[NoticeResponse] = Field(description="공지사항 목록")


# ─── 캘린더(Calendar) 스키마 ───────────────────────────────────────────────────

class CalendarEventResponse(BaseModel):
    """캘린더용 일정 응답. Notice 중 event_start가 있는 항목만 사용합니다."""

    model_config = ConfigDict(from_attributes=True)

    public_id: str = Field(description="공지 public_id (UUID)")
    title: str = Field(description="일정/공지 제목")
    content: str = Field(description="공지 내용")
    event_start: datetime = Field(description="행사 시작 시각")
    event_end: Optional[datetime] = Field(default=None, description="행사 종료 시각")
    location: Optional[str] = Field(default=None, description="행사 장소")


class CalendarListResponse(BaseModel):
    """캘린더 일정 목록 응답 스키마."""

    total: int = Field(description="일정 있는 공지 수")
    items: List[CalendarEventResponse] = Field(description="캘린더 일정 목록")


# ─── 갤러리(Gallery) 스키마 ───────────────────────────────────────────────────

class GalleryCreateRequest(BaseModel):
    """갤러리 사진 등록 요청 스키마 (URL 직접 입력). 파일 업로드는 POST /admin/gallery/upload 사용."""

    image_url: str = Field(
        ...,
        max_length=500,
        description="활동 사진 URL",
        examples=["https://example.com/images/mt-2026.jpg"],
    )
    caption: Optional[str] = Field(
        default=None,
        max_length=200,
        description="사진 설명 (선택)",
        examples=["2026 MT 단체 사진"],
    )


class GalleryUpdateRequest(BaseModel):
    """갤러리 사진 부분 수정(PATCH) 요청 스키마. 전달된 필드만 수정합니다."""

    image_url: Optional[str] = Field(
        default=None,
        max_length=500,
        description="활동 사진 URL",
        examples=["https://example.com/images/mt-2026-updated.jpg"],
    )
    caption: Optional[str] = Field(
        default=None,
        max_length=200,
        description="사진 설명",
        examples=["2026 MT 단체 사진 (수정)"],
    )


class GalleryResponse(BaseModel):
    """갤러리 사진 응답 스키마. 내부 id는 노출하지 않습니다."""

    model_config = ConfigDict(from_attributes=True)

    public_id: str = Field(description="공개 식별자 (UUID)")
    image_url: str = Field(description="활동 사진 URL")
    caption: Optional[str] = Field(default=None, description="사진 설명")
    created_at: datetime = Field(description="등록 시각")
    updated_at: datetime = Field(description="수정 시각")


class GalleryListResponse(BaseModel):
    """갤러리 사진 목록 응답 스키마."""

    total: int = Field(description="전체 사진 수")
    items: List[GalleryResponse] = Field(description="갤러리 사진 목록")


# ─── FAQ 스키마 ───────────────────────────────────────────────────────────────

class FaqCreateRequest(BaseModel):
    """FAQ 등록 요청 스키마."""

    question: str = Field(
        ...,
        max_length=200,
        description="자주 묻는 질문",
        examples=["동아리 가입은 어떻게 하나요?"],
    )
    answer: str = Field(
        ...,
        description="질문에 대한 답변",
        examples=["모집 기간에 지원서를 제출하면 됩니다."],
    )


class FaqResponse(BaseModel):
    """FAQ 응답 스키마. 내부 id는 노출하지 않습니다."""

    model_config = ConfigDict(from_attributes=True)

    public_id: str = Field(description="공개 식별자 (UUID)")
    question: str = Field(description="자주 묻는 질문")
    answer: str = Field(description="질문에 대한 답변")
    created_at: datetime = Field(description="등록 시각")


class FaqListResponse(BaseModel):
    """FAQ 목록 응답 스키마. 탭에서 질문·답변을 함께 보여주기 위해 answer를 포함합니다."""

    total: int = Field(description="전체 FAQ 수")
    items: List[FaqResponse] = Field(description="FAQ 목록")
