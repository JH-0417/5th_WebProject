# 베타 배포 작업 인수인계 (2026-08-13)

## 목적

Vercel + Render + Neon PostgreSQL + Cloudinary 조합으로 베타 테스트 환경을
구성하고, 다른 PC에서 현재 장애 조사를 바로 이어갈 수 있도록 상태를 기록합니다.

이 문서에는 비밀번호, 토큰, DB 연결 문자열, Cloudinary Secret 및 사용자
개인정보를 기록하지 않습니다.

## 배포 주소

- Frontend: <https://5th-web-project.vercel.app>
- Backend: <https://fifth-generation-api.onrender.com>
- Backend OpenAPI: <https://fifth-generation-api.onrender.com/docs>

## 완료된 작업

- GitHub Issue #65: 베타 테스트 배포 환경 구성
- GitHub PR #66: 배포 설정 병합 및 Issue 종료
- `main`에 다음 배포 설정 반영
  - `DATABASE_URL` 기반 SQLite/PostgreSQL 연결
  - psycopg 3 PostgreSQL 드라이버
  - PostgreSQL 호환 Alembic migration
  - JWT 및 관리자 임시 비밀번호 환경 변수화
  - 배포 프론트 주소를 위한 `CORS_ORIGINS`
  - Render Blueprint (`render.yaml`)
  - Vercel SPA rewrite (`frontend/vercel.json`)
  - 배포 절차 문서 (`docs/beta-deployment.md`)

## 배포 서비스 상태

### Neon

- PostgreSQL 프로젝트 생성 완료
- Pooled connection string을 Render의 `DATABASE_URL`에 등록
- Render 시작 시 `alembic upgrade head`가 실행됨

### Render

- 서비스명: `fifth-generation-api`
- 루트 API와 OpenAPI 문서 응답 정상
- `CORS_ORIGINS=https://5th-web-project.vercel.app` 등록 완료
- Cloudinary 환경 변수 3개 등록
- `SECRET_KEY`는 Blueprint 자동 생성

### Vercel

- 프로젝트명: `5th-web-project`
- Root Directory: `frontend`
- `VITE_API_BASE_URL=https://fifth-generation-api.onrender.com`
- 최초에는 환경 변수 끝에 줄바꿈이 포함되어 연결이 실패했으나 수정 후 재배포 완료
- 현재 배포 JavaScript 번들에 줄바꿈 없는 올바른 Render URL이 들어간 것을 확인

## 완료된 Smoke Test

- 프론트 프로덕션 빌드 성공
- 로컬 SQLite migration이 Alembic head까지 적용됨
- PostgreSQL용 전체 migration SQL 생성 성공
- Render 공개 API 응답:
  - `/`
  - `/members`
  - `/projects`
  - `/studies`
  - `/notices`
  - `/gallery`
  - `/faqs`
  - `/calendar`
- 위 API 모두 HTTP 200 확인
- Vercel SPA 경로 `/`, `/gallery`, `/calendar`, `/faqs`, `/login` 모두 HTTP 200
- Vercel Origin에서 Render로 보내는 GET/POST CORS preflight 성공
- 빈 가입 요청은 `/auth/signup`에서 정상적인 HTTP 422 검증 응답과 CORS 헤더를 반환

## 현재 장애

배포 프론트에서 유효한 가입 신청을 보내면 `/auth/signup`이 HTTP 500을 반환합니다.

- 브라우저 Network에서 `signup` 요청 상태 `500` 확인
- 요청은 Render까지 도달하므로 서버 미실행이나 localhost 연결 문제는 아님
- 프론트에 보이는 `uvicorn이 실행 중인지 확인하세요. (http://127.0.0.1:8000)` 문구는
  `frontend/src/api/client.ts`에 고정된 개발용 네트워크 오류 문구임
- 실제 배포 번들의 API 주소는 Render URL로 정상 설정됨
- 500의 정확한 서버 예외 원인은 아직 확인하지 못함

## 다음 작업 순서

1. Render의 `fifth-generation-api` 서비스에서 **Logs**를 연다.
2. 배포 프론트에서 가입 신청을 다시 보낸다.
3. 같은 시각에 발생한 Python traceback의 마지막 예외를 확인한다.
4. 로그에 traceback이 없다면 `exception_handlers.py`의 전역 예외 처리기에
   `logger.exception(...)`을 추가하는 별도 hotfix를 만든다.
5. 원인 수정 후 다음을 다시 검증한다.
   - 회원가입 성공
   - Neon `members` 테이블에 1행 저장
   - 승인 전 로그인 차단
   - 최초 관리자 지정 후 관리자 로그인
   - 일반 회원 승인
   - Cloudinary 갤러리 업로드

## 최초 관리자 지정

가입 오류를 해결한 뒤 관리자용 계정을 일반 회원가입으로 생성하고 Neon SQL Editor에서
해당 계정 한 개만 지정합니다.

```sql
UPDATE members
SET role = 'admin',
    is_approved = TRUE,
    join_status = 'approved'
WHERE login_id = 'ADMIN_LOGIN_ID';
```

반드시 결과가 정확히 `1 row affected`인지 확인합니다.

## 다른 PC에서 이어가기

기존 저장소가 있다면:

```powershell
git switch main
git pull origin main
python -m pip install -r requirements.txt
cd frontend
npm install
```

새 PC라면 GitHub 저장소를 clone한 뒤 동일하게 의존성을 설치합니다. `.env`는 Git에
포함되지 않으므로 `.env.example`을 참고해 필요한 값을 새 PC에 별도로 입력합니다.
배포 장애 조사만 할 때는 로컬 `.env` 없이 Render/Vercel 대시보드와 배포 URL만으로도
계속 진행할 수 있습니다.

## 로컬에서 커밋하지 않은 별도 변경

현재 작업 PC에는 배포와 관계없는 다음 변경이 남아 있으며 이 인수인계 커밋에는
포함하지 않습니다.

- `docs/future-features.md` 삭제
- `frontend/tsconfig.tsbuildinfo` 수정
