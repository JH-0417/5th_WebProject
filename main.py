from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from admin import router as admin_router
from auth import router as auth_router
from members import router as members_router

# DB 스키마는 Alembic 마이그레이션으로 관리합니다.
# 최초 실행 및 스키마 변경 시: `alembic upgrade head`
# (models.py 변경 후에는 `alembic revision --autogenerate -m "설명"`으로 마이그레이션 생성)

app = FastAPI(
    title="제 5세대 웹사이트 API",
    description="동아리 부원 관리, 프로젝트, 공지사항, 갤러리, 캘린더, 지원서",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:8000", "http://localhost:8000"],
    allow_credentials = True, # 로그인 기능
    allow_methods=["*"],    # GET,POST 등 허용
    allow_headers=["*"],    # 헤더 허용
)

app.include_router(auth_router)
app.include_router(members_router)
app.include_router(admin_router)


@app.get("/")
def root():
    return {"message": "제 5세대 웹사이트 API 서버 정상 작동 중"}
