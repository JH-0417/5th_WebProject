# PROJECT_GUIDE.md

# V-Generation Backend & Frontend Project Guide

Version: 1.0

------------------------------------------------------------------------

# 프로젝트 소개

본 프로젝트는 대학 개발 동아리 **V-Generation**의 공식 홈페이지 및
관리자 시스템을 구축하는 개인 프로젝트이다.

단순 CRUD 구현 프로젝트가 아니라 실제 서비스 수준의 백엔드/프론트엔드
개발 경험과 GitHub Flow를 학습하기 위한 포트폴리오 프로젝트를 목표로
한다.

------------------------------------------------------------------------

# 프로젝트 목표

최종적으로 다음 조건을 만족하는 서비스를 완성한다.

## Backend

-   REST API 서버 구축
-   JWT 인증
-   관리자 권한 관리
-   Swagger(OpenAPI) 문서
-   유지보수 가능한 계층형 구조

## Frontend

-   React 기반 SPA
-   관리자 페이지
-   일반 사용자 페이지
-   Backend API 연동

## Deploy

-   Backend 배포
-   Frontend 배포
-   실제 접속 가능한 서비스 구축

최종 결과물은 포트폴리오 및 면접에서 설명 가능한 수준을 목표로 한다.

------------------------------------------------------------------------

# 개발 기간

남은 개발 기간은 약 **20일**이다.

목표 범위

-   Backend 완료
-   Frontend 완료
-   API 연동
-   배포
-   README 및 프로젝트 문서 작성

------------------------------------------------------------------------

# 프로젝트 규모

개인 프로젝트이지만 실무 프로젝트 수준의 개발 프로세스를 적용한다.

목표는 기능을 많이 만드는 것이 아니라 완성도 높은 서비스를 만드는
것이다.

------------------------------------------------------------------------

# 기술 스택

## Backend

-   Python
-   FastAPI
-   SQLAlchemy
-   Pydantic
-   Alembic
-   SQLite
-   JWT Authentication
-   BCrypt

## Frontend

-   React
-   TypeScript
-   Vite
-   Tailwind CSS
-   React Router
-   Axios

## 협업

-   Git
-   GitHub
-   GitHub Flow
-   Issues
-   Pull Requests

------------------------------------------------------------------------

# 프로젝트 범위

## Backend

-   회원가입 / 로그인
-   JWT 인증
-   Member CRUD
-   Project CRUD
-   Study CRUD
-   Notice CRUD
-   Gallery CRUD
-   FAQ CRUD
-   Application CRUD
-   Calendar API
-   Pagination
-   Search
-   Validation
-   Global Exception Handler
-   Swagger

## Frontend

### 사용자

-   메인
-   로그인
-   회원가입
-   프로젝트
-   스터디
-   공지사항
-   갤러리
-   FAQ
-   동아리 지원

### 관리자

-   회원 관리
-   프로젝트 관리
-   스터디 관리
-   공지 관리
-   갤러리 관리
-   FAQ 관리
-   지원서 관리

------------------------------------------------------------------------

# 설계 원칙

-   기능보다 완성도를 우선한다.
-   기존 구조를 최대한 재사용한다.
-   CRUD 패턴은 일관성을 유지한다.
-   REST API 규칙을 따른다.
-   유지보수성을 우선한다.

## 프로젝트 설계 결정 사항

### Calendar

별도 Event CRUD를 만들지 않는다.

Notice의

-   event_start
-   event_end
-   location

정보를 이용하여 Calendar API를 제공한다.

### Gallery

현재는 image_url 기반으로 구현한다.

실제 파일 업로드는 프로젝트 후반 또는 시간이 남을 경우 구현한다.

------------------------------------------------------------------------

# GitHub Flow

Issue

↓

main 최신화

↓

Feature Branch 생성

↓

Cursor 구현

↓

Swagger 테스트

↓

Commit

↓

Push

↓

Pull Request

↓

Merge

↓

Branch 삭제

------------------------------------------------------------------------

# Branch 규칙

feature/{domain}

예시

-   feature/project-crud
-   feature/study-crud
-   feature/gallery-crud
-   feature/application-crud

------------------------------------------------------------------------

# Commit 규칙

Conventional Commit 사용

-   feat
-   fix
-   docs
-   refactor
-   test
-   style
-   chore

------------------------------------------------------------------------

# Pull Request 규칙

반드시 아래 항목을 포함한다.

-   작업 내용
-   테스트 내용
-   관련 Issue

예시

Closes #11

------------------------------------------------------------------------

# Issue 작성 규칙

모든 기능은 GitHub Issue 기반으로 진행한다.

Issue에는 반드시 아래 내용을 포함한다.

-   목적
-   작업 내용
-   이번 Issue에서 제외
-   완료 조건
-   Branch
-   Cursor Prompt

## Issue 분리 원칙

복잡한 기능(Auth, 권한)

↓

여러 Issue로 분리

단순 CRUD

↓

CRUD 하나 = Issue 하나

------------------------------------------------------------------------

# Cursor Prompt 규칙

Cursor Prompt에는 구현 방법을 상세히 작성하지 않는다.

반드시 포함할 내용

-   프로젝트 소개
-   Issue 번호
-   목표
-   구현 요구사항

Cursor는 먼저 프로젝트 구조를 분석한 후 구현한다.

------------------------------------------------------------------------

# Cursor 작업 규칙

새로운 기능을 구현하기 전에 반드시 아래 순서를 따른다.

1.  현재 프로젝트 구조를 분석한다.
2.  기존 CRUD 구현 방식을 확인한다.
3.  현재 완료된 Issue를 확인하여 중복 구현을 방지한다.
4.  현재 프로젝트의 설계 원칙을 유지한다.
5.  수정이 필요한 파일과 이유를 먼저 설명한다.
6.  단계별로 구현을 진행한다.
7.  기존 코드 스타일을 유지한다.
8.  Issue 범위를 벗어나는 기능은 구현하지 않는다.
9.  구현 완료 후 Swagger 기준으로 테스트 가능한 상태를 만든다.
10. 확장 아이디어는 구현하지 말고 개선 사항으로만 제안한다.

------------------------------------------------------------------------

# ChatGPT 역할

-   프로젝트 PM
-   API 설계
-   DB 설계
-   Issue 작성
-   Cursor Prompt 작성
-   GitHub Flow 관리
-   코드 리뷰
-   로드맵 관리

------------------------------------------------------------------------

# 현재 개발 진행 상황

완료

-   Issue #1 \~ Issue #11

구현 완료

-   Auth
-   Member
-   Project
-   Study
-   Notice

------------------------------------------------------------------------

# 앞으로의 개발 순서

1.  Gallery CRUD
2.  FAQ CRUD
3.  Application CRUD
4.  Calendar API
5.  Pagination
6.  Search
7.  Validation
8.  Exception Handler
9.  Frontend 구현
10. Backend 연동
11. Deploy
12. README 및 포트폴리오 정리

------------------------------------------------------------------------

# 앞으로 ChatGPT에게 기대하는 역할

앞으로 새로운 기능을 요청할 경우 현재까지 완료된 Issue와 프로젝트 구조를
먼저 고려한다.

새로운 Issue는 기존 구현과 중복되지 않도록 작성하며, 기존 CRUD 패턴을
최대한 재사용한다.

항상 다음 순서를 유지한다.

Issue 작성

↓

Branch 추천

↓

Cursor Prompt 작성

↓

Commit 추천

↓

PR 제목 및 내용 작성

↓

Merge 안내

↓

다음 Issue 제안

프로젝트 전체의 일관성과 유지보수성을 최우선으로 고려한다.
