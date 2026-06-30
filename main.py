from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine

# DB 테이블 자동 생성 (앱 시작 시 models.py 기준으로 테이블이 없으면 만들어줌)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="제 5세대 웹사이트 API",
    description="동아리 부원 관리, 프로젝트, 공지사항, 갤러리, 캘린더, 지원서",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:8000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터는 기능 구현 후 단계별로 등록 예정


@app.get("/")
def root():
    return {"message": "제 5세대 웹사이트 API 서버 정상 작동 중"}
