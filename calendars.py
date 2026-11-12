"""
캘린더 조회 API 라우터.

일정은 공지사항과 분리된 calendar_events 테이블에 저장합니다.
등록·수정·삭제는 admin.py의 /admin/calendar 경로에서 처리합니다.

모듈명을 calendars.py로 둔 이유: Python 표준 라이브러리 calendar 와 이름 충돌 방지.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from crud import get_calendar_events
from database import get_db
from schemas import CalendarEventResponse, CalendarListResponse

router = APIRouter(prefix="/calendar", tags=["캘린더"])


@router.get("", response_model=CalendarListResponse)
def list_calendar_events(db: Session = Depends(get_db)):
    """
    캘린더 일정 목록 조회 API (Public).

    event_start 오름차순(빠른 일정부터)으로 정렬합니다.
    """
    events = get_calendar_events(db)
    return {
        "total": len(events),
        "items": [CalendarEventResponse.model_validate(e) for e in events],
    }
