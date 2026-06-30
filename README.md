# V-Generation (제5세대) 웹 프로젝트

> 동아리의 정체성을 효과적으로 소개하고, 부원·스터디·프로젝트를 체계적으로 관리하기 위한 **그룹웨어 및 홍보 웹 서비스**입니다.

![Frontend](https://img.shields.io/badge/Frontend-React-61DAFB?logo=react\&logoColor=white)
![Backend](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi\&logoColor=white)

---

## 프로젝트 개요

**V-Generation**은 제5세대 동아리 웹사이트와 관리자(Admin) 시스템 구축을 목표로 하는 프로젝트입니다.

일반 방문자는 동아리 소개, 부원 정보, 프로젝트, 스터디, 공지사항, FAQ 등을 조회하고 모집 기간에는 지원서를 제출할 수 있습니다.

관리자 및 팀장은 JWT 기반 인증을 통해 프로젝트 진행 현황 관리, 공지사항 관리, 지원자 승인 등 동아리 운영에 필요한 기능을 수행합니다.

---

## 기술 스택

### Frontend

* **Framework:** React
* **Styling:** Tailwind CSS
* **State Management:** React Hooks (`useState`, `useEffect`)
* **Routing:** React Router

### Backend

* **Framework:** FastAPI
* **ORM:** SQLAlchemy
* **Validation:** Pydantic
* **Authentication:** JWT 기반 인증 및 권한(Role) 관리

### Database

* **Type:** 관계형 데이터베이스(RDBMS)
* **Development:** SQLite (개발 단계)
* **Production:** 프로젝트 규모에 따라 MySQL 또는 PostgreSQL로 확장 가능

---

## 요구사항 명세

프로젝트는 사용자 권한에 따라 기능을 구분하여 설계한다.

### 일반 방문자 및 부원 (Guest & Member)

| ID       | 기능        | 설명                             |
| -------- | --------- | ------------------------------ |
| REQ-F-01 | 메인 페이지 조회 | 동아리 소개 및 모집 정보를 조회한다.          |
| REQ-F-02 | 부원 조회     | 부원 목록과 프로필을 조회한다.              |
| REQ-F-03 | 부원 필터     | 파트 및 기수별 부원을 필터링한다.            |
| REQ-F-04 | 프로젝트 조회   | 진행 중인 프로젝트 및 완료된 프로젝트를 조회한다.   |
| REQ-F-05 | 스터디 조회    | 운영 중인 스터디 정보를 조회한다.            |
| REQ-F-06 | 프로젝트 상세   | 프로젝트 진행 현황 및 Commit Log를 조회한다. |
| REQ-F-07 | 공지사항      | 공지사항을 조회한다.                    |
| REQ-F-08 | FAQ       | FAQ를 조회한다.                     |
| REQ-F-09 | 지원서 제출    | 모집 기간 동안 지원서를 제출한다.            |

### 팀장 및 스터디장 (Leader)

| ID       | 기능         | 설명                |
| -------- | ---------- | ----------------- |
| REQ-F-10 | 진행사항 등록    | 프로젝트 진행 내용을 기록한다. |
| REQ-F-11 | 프로젝트 상태 변경 | 프로젝트 상태를 변경한다.    |

### 관리자 (Admin)

| ID       | 기능       | 설명                          |
| -------- | -------- | --------------------------- |
| REQ-F-12 | 관리자 로그인  | JWT 기반 인증을 수행한다.            |
| REQ-F-13 | 대시보드     | 통계 정보를 조회한다.                |
| REQ-F-14 | 지원자 요약   | 최근 지원자 정보를 확인한다.            |
| REQ-F-15 | 지원자 관리   | 전체 지원서를 관리한다.               |
| REQ-F-16 | 지원 승인    | 지원자를 부원으로 승인한다.             |
| REQ-F-17 | 권한 관리    | 부원의 권한을 변경한다.               |
| REQ-F-18 | 부원 관리    | 부원 정보를 삭제 및 관리한다.           |
| REQ-F-19 | 모집 기간 관리 | 모집 시작일과 종료일을 설정한다.          |
| REQ-F-20 | 공지사항 관리  | 공지사항을 작성·수정·삭제한다.           |
| REQ-F-21 | FAQ 관리   | FAQ를 작성·수정·삭제한다.            |
| REQ-F-22 | 프로젝트 관리  | 프로젝트 및 스터디를 생성하고 담당자를 지정한다. |
| REQ-F-23 | 프로젝트 삭제  | 프로젝트 및 스터디를 삭제한다.           |

---

## 데이터베이스 구조

프로젝트에서 사용하는 주요 데이터는 관계형 데이터베이스(RDBMS)를 기반으로 설계하며, 개발 단계에서는 SQLite를 사용합니다.

### Members

| 컬럼            | 설명                           |
| ------------- | ---------------------------- |
| id            | 부원 고유 ID (PK)                |
| name          | 이름                           |
| role          | 권한 (Member / Leader / Admin) |
| student_id    | 학번                           |
| part          | 소속 파트                        |
| github_link   | GitHub 주소                    |
| profile_image | 프로필 이미지                      |
| is_ob         | 졸업 여부                        |

### Projects

| 컬럼          | 설명              |
| ----------- | --------------- |
| id          | 프로젝트 ID (PK)    |
| title       | 프로젝트명           |
| description | 프로젝트 설명         |
| tech_stack  | 사용 기술           |
| status      | 진행 상태           |
| category    | Project / Study |

### Project_Progress

| 컬럼         | 설명            |
| ---------- | ------------- |
| id         | 진행 기록 ID (PK) |
| project_id | 프로젝트 ID (FK)  |
| author_id  | 작성자 ID (FK)   |
| content    | 진행 내용         |
| created_at | 작성일           |

### Applicants

| 컬럼           | 설명          |
| ------------ | ----------- |
| id           | 지원자 ID (PK) |
| name         | 이름          |
| student_id   | 학번          |
| part         | 지원 파트       |
| introduction | 지원 동기       |
| status       | 지원 상태       |
| applied_at   | 지원일         |

### Notices

| 컬럼         | 설명    |
| ---------- | ----- |
| id         | 공지 ID |
| title      | 제목    |
| content    | 내용    |
| created_at | 작성일   |

### FAQs

| 컬럼       | 설명     |
| -------- | ------ |
| id       | FAQ ID |
| question | 질문     |
| answer   | 답변     |

---

---

## 핵심 API 명세

Frontend와 Backend는 RESTful API를 통해 데이터를 주고받습니다.
API는 일반 사용자 기능과 관리자 기능으로 구분하여 설계합니다.

### 인증(Authentication)

| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| POST | `/api/auth/login` | 관리자 및 팀장 로그인 | Public |
| POST | `/api/auth/logout` | 로그아웃 | Login |

---

### 부원(Members)

| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| GET | `/api/members` | 전체 부원 조회 | Public |
| GET | `/api/members/{id}` | 부원 상세 조회 | Public |

---

### 프로젝트(Projects)

| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| GET | `/api/projects` | 프로젝트 목록 조회 | Public |
| GET | `/api/projects/{id}` | 프로젝트 상세 조회 | Public |
| POST | `/api/projects/{id}/progress` | 프로젝트 진행사항 등록 | Leader |
| PATCH | `/api/projects/{id}` | 프로젝트 정보 수정 | Leader |

---

### 리크루팅(Applicants)

| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| POST | `/api/applicants` | 신규 지원서 제출 | Public |
| GET | `/api/admin/applicants` | 전체 지원자 조회 | Admin |
| PATCH | `/api/admin/applicants/{id}/approve` | 지원자 승인 | Admin |
| DELETE | `/api/admin/applicants/{id}` | 지원자 삭제 | Admin |

---

### 공지사항(Notices)

| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| GET | `/api/notices` | 공지사항 조회 | Public |
| POST | `/api/admin/notices` | 공지사항 작성 | Admin |
| PATCH | `/api/admin/notices/{id}` | 공지사항 수정 | Admin |
| DELETE | `/api/admin/notices/{id}` | 공지사항 삭제 | Admin |

---

### FAQ

| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| GET | `/api/faqs` | FAQ 조회 | Public |
| POST | `/api/admin/faqs` | FAQ 등록 | Admin |
| PATCH | `/api/admin/faqs/{id}` | FAQ 수정 | Admin |
| DELETE | `/api/admin/faqs/{id}` | FAQ 삭제 | Admin |

---
