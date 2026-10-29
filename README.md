# V-Generation (제 5세대) 웹 프로젝트

> 건국대학교 글로컬캠퍼스 IT 동아리 **제 5세대**를 소개하고, 부원·스터디·프로젝트·모집을 관리하는 **동아리 홍보 및 운영 웹 서비스**입니다.

- 서비스: https://5th-web-project.vercel.app/
- API 문서(Swagger): 백엔드 주소 뒤에 `/docs` (로컬: http://127.0.0.1:8000/docs)

---

## 프로젝트 개요

일반 방문자는 동아리 소개, 임원진, 프로젝트·스터디, 공지사항·일정, 활동 사진, FAQ를 조회하고 **관리자가 모집을 열어 둔 기간에만** 가입 신청을 할 수 있습니다. 문의는 Contact 폼으로 남깁니다.

승인된 부원은 로그인해 전체 부원 정보를 보고 자신의 프로필을 관리합니다.

관리자는 가입 심사, 회원 관리, 공지·일정, 프로젝트·스터디, 갤러리 앨범, FAQ, 문의, 모집 기간을 관리합니다. 관리자 임명·해제는 **최고관리자(owner)** 만 할 수 있습니다.

---

## 기술 스택

| 구분 | 사용 기술 |
|---|---|
| Frontend | React 19, TypeScript, Vite, React Router |
| Backend | Python 3.13, FastAPI, SQLAlchemy 2, Pydantic 2, Alembic |
| 인증 | JWT Access Token(30분) + Refresh Token(14일, rotation), bcrypt |
| Database | 로컬: SQLite (`app.db`) / 배포: PostgreSQL (Neon, psycopg 3) |
| 이미지 저장 | Cloudinary |
| 배포 | Frontend: Vercel / Backend: Render (무료 플랜) |

---

## 프로젝트 구조

백엔드 코드는 저장소 루트에, 프론트엔드 코드는 `frontend/`에 있습니다.

```text
5th_WebProject/
├── main.py              # FastAPI 앱 생성, CORS, 라우터 등록
├── database.py          # DB 연결 (DATABASE_URL, 없으면 SQLite)
├── models.py            # SQLAlchemy 모델 (DB 테이블)
├── schemas.py           # Pydantic 요청·응답 스키마
├── crud.py              # DB 조회·저장 로직
├── security.py          # 비밀번호 해싱, JWT, Refresh Token
├── dependencies.py      # 로그인·관리자·최고관리자 권한 검사
├── pagination.py        # 목록 API 공통 limit/offset 처리
├── login_throttle.py    # 로그인 실패 횟수 제한
├── storage.py           # Cloudinary 이미지 업로드·삭제
├── exception_handlers.py
│
├── auth.py              # /auth        가입 신청, 로그인, 토큰 갱신, 로그아웃
├── members.py           # /members     부원 조회, 내 정보·비밀번호 수정
├── projects.py          # /projects    프로젝트 조회
├── studies.py           # /studies     스터디 조회
├── notices.py           # /notices     공지사항 조회
├── calendars.py         # /calendar    일정 조회 (공지의 일정 정보 사용)
├── gallery.py           # /gallery     사진·앨범 조회
├── faqs.py              # /faqs        FAQ 조회
├── contacts.py          # /contact     문의 등록
├── recruitment.py       # /recruitment 모집 상태 조회
├── admin.py             # /admin/*     관리자 기능 전체
│
├── alembic/             # DB 마이그레이션
├── alembic.ini
├── requirements.txt
├── render.yaml          # Render 배포 설정
├── start-dev.cmd        # 로컬 백엔드·프론트 동시 실행 (Windows)
├── docs/                # 배포·인수인계·향후 기능 문서
└── frontend/            # React + Vite 프론트엔드 (Vercel 배포)
    └── src/ (api, components, pages, styles, types, utils)
```

---

## 로컬 실행

### 1. 백엔드

```bash
pip install -r requirements.txt
cp .env.example .env   # 값 채우기 (아래 환경 변수 참고)
alembic upgrade head   # DB 테이블 생성·갱신
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### 2. 프론트엔드

```bash
cd frontend
npm install
cp .env.example .env   # VITE_API_BASE_URL=http://127.0.0.1:8000
npm run dev            # http://localhost:5173
```

Windows에서는 루트의 `start-dev.cmd`를 실행하면 백엔드와 프론트엔드가 각각 새 터미널에서 함께 실행됩니다.

### 로컬 DB와 배포 DB

- `.env`에 `DATABASE_URL`이 **없으면** 루트의 `app.db`(SQLite 파일)를 사용합니다.
- 배포 서버(Render)는 `DATABASE_URL`로 **Neon(PostgreSQL)** 에 연결합니다.
- 두 DB는 **서로 연동되지 않습니다.** 로컬에서 데이터를 추가·삭제해도 실제 사이트에는 영향이 없습니다.
- 로컬에서 Neon에 직접 연결하려면 `.env`에 `DATABASE_URL`을 넣으면 되지만, **실제 운영 데이터가 바뀌므로** 개발용 Neon 브랜치를 따로 만들어 쓰는 것을 권장합니다.

### 환경 변수 (`.env`)

| 변수 | 설명 |
|---|---|
| `DATABASE_URL` | DB 연결 문자열. 생략 시 `sqlite:///./app.db` |
| `SECRET_KEY` | JWT 서명 키 (배포 시 긴 무작위 값) |
| `JWT_ALGORITHM` | 기본 `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access Token 만료(분), 기본 30 |
| `REFRESH_TOKEN_EXPIRE_DAYS` | 로그인 유지 기간(일), 기본 14 |
| `CORS_ORIGINS` | 허용할 프론트 주소 (쉼표 구분, 끝의 `/` 제외) |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | 갤러리 이미지 업로드 |

---

## DB 마이그레이션 (Alembic)

DB 구조는 `alembic/versions/`의 마이그레이션 파일로 관리합니다. Render는 서버를 시작할 때마다 `alembic upgrade head`를 자동 실행합니다.

```bash
# models.py 수정 후 마이그레이션 생성
alembic revision --autogenerate -m "변경 내용"

# 적용 / 되돌리기 / 모델과 DB 일치 여부 확인
alembic upgrade head
alembic downgrade -1
alembic check
```

SQLite는 ALTER로 제약조건을 바꿀 수 없어 `batch_alter_table`(테이블 재생성)을 사용합니다. 제약조건 이름 규칙은 `database.py`의 `NAMING_CONVENTION`에 정의되어 있습니다.

---

## 권한 구조

| 권한 | 대상 | 할 수 있는 일 |
|---|---|---|
| 비로그인 | 방문자 | 공개 정보 조회, 모집 중 가입 신청, 문의 등록 |
| 승인 대기 / 탈락 | 가입 신청자 | 로그인 불가 |
| member | 승인된 부원 | 전체 부원 조회, 내 정보·비밀번호 수정 |
| admin | 관리자 | 가입 심사, 회원·콘텐츠·모집·문의 관리 |
| owner | 최고관리자 (1명, admin 포함) | 관리자 임명·해제, 최고관리자 양도, 다른 관리자 계정 관리 |

- 일반 관리자는 다른 관리자·최고관리자 계정의 승인 상태·정보·비밀번호를 바꿀 수 없습니다.
- 최고관리자는 `POST /admin/owner/transfer`로 다른 승인 회원에게 넘길 수 있습니다.
- 동아리 직책(`club_position`: 회장, 부회장, 총무, 임원, 부원)은 사이트 권한과 별개입니다. 비로그인 방문자에게는 임원진만 공개됩니다.

---

## 데이터베이스 구조

모든 테이블은 내부 `id`(PK)와 외부 노출용 `public_id`(UUID)를 함께 가집니다. API와 URL에는 `public_id`만 사용합니다.

### members (회원 + 가입 지원서)

| 컬럼 | 설명 |
|---|---|
| login_id, hashed_password | 로그인 아이디, bcrypt 해시 비밀번호 |
| name, student_id, department, grade | 이름, 학번, 학과, 학년 |
| phone_number, email | 연락처 (고유값) |
| system_role | 사이트 권한 (`admin` / `member`) |
| is_owner | 최고관리자 여부 |
| club_position | 동아리 직책 |
| join_status | 가입 심사 상태 (`pending` / `approved` / `rejected`). 승인 여부(`is_approved`)는 이 값으로 계산 |
| apply_reason, desired_activity | 지원 사유, 해보고 싶은 활동 |
| github_username, bio, tech_stack | 선택 프로필 |

### projects (프로젝트·스터디)

| 컬럼 | 설명 |
|---|---|
| title, description, tech_stack | 이름, 설명, 기술 |
| status | `planned` / `in_progress` / `completed` |
| category | `project` / `study` |
| meeting_schedule, location, is_recruiting | 스터디 모임 일정, 장소, 모집 중 여부 |
| created_at, updated_at | 생성·수정 시각 |

### activity_memberships (프로젝트·스터디 참여자)

| 컬럼 | 설명 |
|---|---|
| activity_id → projects, member_id → members | 참여 관계 (활동·회원 삭제 시 함께 삭제) |
| role | `leader` / `member` |

### notices (공지사항 + 일정)

| 컬럼 | 설명 |
|---|---|
| title, content, is_pinned | 제목, 내용, 상단 고정 |
| event_start, event_end, location | 일정 공지일 때만 사용 (캘린더에 표시) |
| created_by_id, updated_by_id → members | 작성자·마지막 수정자 (탈퇴 시 NULL) |

### gallery_albums / gallery (활동 사진)

| 테이블 | 주요 컬럼 |
|---|---|
| gallery_albums | title, description, event_date (MT·발표회 등 행사 단위 앨범) |
| gallery | image_url (Cloudinary), caption, album_id → gallery_albums (앨범 삭제 시 NULL), uploaded_by → members (탈퇴 시 NULL) |

### faqs

| 컬럼 | 설명 |
|---|---|
| question, answer | 질문, 답변 |
| sort_order | 표시 순서 (작을수록 위) |
| created_by_id, updated_by_id → members | 작성자·마지막 수정자 |

### 기타

| 테이블 | 설명 |
|---|---|
| contact_inquiries | Contact 폼 문의 (name, email, subject, message, is_resolved) |
| recruitment_settings | 모집 열림 여부와 안내 문구 (단일 행, 기본값 닫힘) |
| refresh_tokens | 로그인 유지 토큰. 원문이 아닌 SHA-256 해시만 저장, 사용·로그아웃·비밀번호 변경 시 폐기 |

---

## API 명세

전체 요청·응답 형식은 Swagger(`/docs`)에서 확인할 수 있습니다.

### 공통 규칙

- 인증이 필요한 API는 `Authorization: Bearer <access_token>` 헤더를 사용합니다.
- **목록 API**는 `limit`(1~100), `offset` 쿼리를 받습니다. `limit`을 생략하면 전체를 반환하고, 응답의 `total`은 항상 조건에 맞는 전체 개수입니다.
  - 예) 2페이지(12개씩): `GET /gallery?limit=12&offset=12`
- 응답 코드: 401 로그인 필요·토큰 만료 / 403 권한 없음 / 404 없음 / 409 중복 / 422 입력값 오류 / 429 요청 과다

### 인증 (`/auth`)

| Method | Endpoint | 설명 | 권한 |
|---|---|---|---|
| POST | `/auth/signup` | 가입 신청 (모집이 닫혀 있으면 403) | Public |
| POST | `/auth/login` | 로그인. access·refresh 토큰 발급 (같은 아이디 15분 5회·같은 IP 20회 실패 시 15분 차단) | Public |
| POST | `/auth/refresh` | refresh 토큰으로 새 토큰 한 쌍 발급 (사용한 토큰은 폐기) | Public |
| POST | `/auth/logout` | 이 기기 로그아웃 (refresh 토큰 폐기) | Public |
| POST | `/auth/logout-all` | 모든 기기 로그아웃 | Login |
| GET | `/auth/me` | 내 정보 | Login |

### 공개 조회

| Method | Endpoint | 설명 | 권한 |
|---|---|---|---|
| GET | `/members`, `/members/{id}` | 부원 목록·상세 (비로그인: 임원진만, 학번 마스킹) | Public |
| PATCH | `/members/me`, `/members/me/password` | 내 정보·비밀번호 수정 | Login |
| GET | `/projects`, `/projects/{id}` | 프로젝트 | Public |
| GET | `/studies`, `/studies/{id}` | 스터디 (`?recruiting=true` 모집 중만) | Public |
| GET | `/notices`, `/notices/{id}` | 공지사항 | Public |
| GET | `/calendar` | 일정 (일정 정보가 있는 공지) | Public |
| GET | `/gallery`, `/gallery/{id}` | 사진 (`?album={id}` 앨범별) | Public |
| GET | `/gallery/albums`, `/gallery/albums/{id}` | 앨범 목록·상세 | Public |
| GET | `/faqs` | FAQ (표시 순서대로) | Public |
| GET | `/recruitment` | 모집 진행 여부와 안내 문구 | Public |
| POST | `/contact` | 문의 등록 (IP당 1시간 5건) | Public |

### 관리자 (`/admin`)

| Method | Endpoint | 설명 | 권한 |
|---|---|---|---|
| GET | `/admin/members` | 회원·지원서 목록 (`?join_status=pending` 등) | Admin |
| PATCH | `/admin/members/{id}/approve`, `/reject` | 가입 승인·탈락 | Admin |
| PATCH | `/admin/members/{id}` | 회원 정보 수정 | Admin |
| PATCH | `/admin/members/{id}/club-position` | 동아리 직책 변경 | Admin |
| POST | `/admin/members/{id}/reset-password` | 회원별 무작위 임시 비밀번호 발급 | Admin |
| DELETE | `/admin/members/{id}` | 회원 삭제 (관리자 계정은 불가) | Admin |
| PATCH | `/admin/members/{id}/system-role` | 관리자 임명·해제 | **Owner** |
| POST | `/admin/owner/transfer` | 최고관리자 양도 | **Owner** |
| POST · PATCH · DELETE | `/admin/projects`, `/admin/studies` | 프로젝트·스터디 관리 | Admin |
| POST · PATCH · DELETE | `/admin/notices` | 공지·일정 관리 (작성자 자동 기록) | Admin |
| POST · PATCH · DELETE | `/admin/faqs` | FAQ 관리 (수정·순서 변경 포함) | Admin |
| POST | `/admin/gallery/upload`, `/admin/gallery` | 사진 한 장 업로드 / URL 등록 | Admin |
| PATCH · DELETE | `/admin/gallery/{id}`, `/admin/gallery/{id}/image` | 사진 수정·이미지 교체·삭제 | Admin |
| POST · PATCH · DELETE | `/admin/gallery/albums` | 앨범 관리 (`?delete_photos=true`로 사진까지 삭제) | Admin |
| POST | `/admin/gallery/albums/{id}/photos` | 앨범에 사진 여러 장 업로드 (최대 20장) | Admin |
| GET · PATCH · DELETE | `/admin/contacts` | 문의 조회·처리 완료 표시·삭제 | Admin |
| GET · PATCH | `/admin/recruitment` | 모집 열기·닫기, 안내 문구 | Admin |

---

## 배포

| 대상 | 서비스 | 설정 |
|---|---|---|
| Frontend | Vercel | `frontend/` 빌드, 환경 변수 `VITE_API_BASE_URL`에 백엔드 주소 |
| Backend | Render | `render.yaml` Blueprint. 시작 시 `alembic upgrade head` 후 uvicorn 실행 |
| Database | Neon | Render 환경 변수 `DATABASE_URL`에 연결 문자열 |
| Images | Cloudinary | Render 환경 변수 `CLOUDINARY_*` |

- 프론트 주소가 바뀌면 Render의 `CORS_ORIGINS`에도 추가해야 로그인·API 호출이 동작합니다.
- Render 무료 플랜은 15분간 요청이 없으면 잠들어, 첫 요청이 30~50초 걸릴 수 있습니다.
- 자세한 절차는 `docs/beta-deployment.md`를 참고하세요.

---

## Git Workflow

### 브랜치 전략

| 브랜치 | 용도 |
|---|---|
| `main` | 배포되는 안정 코드 |
| `feature/*` | 새로운 기능 개발 |
| `fix/*`, `hotfix/*` | 버그 수정 |

### Commit Convention

| 태그 | 설명 |
|---|---|
| `feat:` | 새로운 기능 추가 |
| `fix:` | 버그 수정 |
| `docs:` | 문서 작성 및 수정 |
| `refactor:` | 코드 리팩토링 |
| `style:` | 코드 스타일 수정 |
| `test:` | 테스트 코드 작성 |
| `chore:` | 기타 설정 및 환경 변경 |

```text
feat: 갤러리 앨범과 사진 여러 장 업로드를 추가한다
fix: 비밀번호 초기화 시 회원별 무작위 임시 비밀번호를 발급한다
docs: README 업데이트
```

### 개발 프로세스

```text
Issue 작성 → feature 브랜치 생성 → 기능 구현 → Commit → Pull Request → main 병합
```

Issue는 기능 단위로 생성하며, 하나의 Issue는 하나의 기능 구현을 원칙으로 합니다.

---

Created by 류종걸, 박하원, 유수민
