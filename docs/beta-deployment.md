# 베타 테스트 배포 가이드

## 구성

- Frontend: Vercel
- Backend: Render
- Database: Neon PostgreSQL
- Images: Cloudinary

실제 비밀 값은 `.env`나 각 서비스의 Environment Variables에만 저장하고 GitHub에
커밋하지 않습니다.

## 1. Neon 데이터베이스

1. Neon에서 프로젝트와 Production 브랜치를 생성합니다.
2. Connect 화면에서 pooled PostgreSQL 연결 문자열을 복사합니다.
3. 이 값은 Render의 `DATABASE_URL`에만 등록합니다.

예시 형식:

```text
postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
```

애플리케이션이 `postgresql://` 주소를 psycopg 3용 주소로 자동 변환합니다.
Render 시작 시 `alembic upgrade head`가 실행되어 최신 스키마가 적용됩니다.

## 2. Render 백엔드

1. Render에서 **New > Blueprint**를 선택하고 이 GitHub 저장소를 연결합니다.
2. 저장소 루트의 `render.yaml`을 사용해 서비스를 생성합니다.
3. 다음 환경 변수를 입력합니다.

- `DATABASE_URL`: Neon 연결 문자열
- `CORS_ORIGINS`: 우선 `https://example.vercel.app` 입력 후 실제 Vercel URL로 교체
- `TEMPORARY_PASSWORD`: 관리자가 회원 비밀번호를 초기화할 때 사용할 임시 비밀번호
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

`SECRET_KEY`는 Blueprint가 안전한 임의 값으로 생성합니다. 배포 후 Render URL의
루트와 `/docs`가 열리는지 확인합니다.

## 3. Vercel 프론트엔드

1. Vercel에서 GitHub 저장소를 Import합니다.
2. **Root Directory**를 `frontend`로 지정합니다.
3. Framework Preset은 Vite, Build Command는 `npm run build`, Output Directory는
   `dist`를 사용합니다.
4. 환경 변수 `VITE_API_BASE_URL`에 Render URL을 끝 슬래시 없이 입력합니다.

예시:

```text
VITE_API_BASE_URL=https://fifth-generation-api.onrender.com
```

`frontend/vercel.json`은 React Router 경로를 새로고침해도 `index.html`로 연결합니다.

## 4. CORS 최종 설정

Vercel 배포 URL이 정해지면 Render의 `CORS_ORIGINS`를 실제 주소로 수정합니다.
여러 주소를 허용할 때는 쉼표로 구분하고 끝 슬래시는 제외합니다.

```text
https://project.vercel.app,https://custom-domain.example.com
```

환경 변수 수정으로 Render가 다시 시작된 뒤 프론트에서 API 요청을 확인합니다.

## 5. 첫 관리자 지정

1. 배포된 프론트에서 관리자용 계정을 일반 회원가입으로 먼저 생성합니다.
2. Neon SQL Editor에서 해당 아이디만 정확히 지정해 승인 및 관리자 권한을 부여합니다.

```sql
UPDATE members
SET role = 'admin',
    is_approved = TRUE,
    join_status = 'approved'
WHERE login_id = 'ADMIN_LOGIN_ID';
```

실행 결과가 정확히 1행인지 확인한 뒤 로그인합니다. 비밀번호나 JWT 토큰은 SQL,
문서, Issue에 기록하지 않습니다.

## 6. Smoke Test

- Render `/` 응답과 `/docs` 접속
- 일반 회원가입 → 승인 전 로그인 차단
- 관리자 로그인 → 가입 승인
- 승인된 일반 회원 로그인 및 프로필 수정
- 공지사항·FAQ·캘린더·프로젝트·스터디 조회
- 관리자 게시물 생성·수정·삭제
- 8MB 이하 갤러리 이미지 업로드 및 Cloudinary 표시
- `/gallery`, `/calendar`, 상세 주소에서 브라우저 새로고침
- Render 재배포 후 기존 Neon 데이터 유지
