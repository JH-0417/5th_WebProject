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
