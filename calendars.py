"""
캘린더 조회 API 라우터.

별도 Event 테이블 없이, Notice의 event_start / event_end / location을 사용합니다.
event_start가 있는 공지만 캘린더 일정으로 반환합니다.

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

    Notice 중 event_start가 설정된 항목만 반환합니다.
    event_start 오름차순(빠른 일정부터)으로 정렬합니다.
    """
    events = get_calendar_events(db)
    return {
        "total": len(events),
        "items": [CalendarEventResponse.model_validate(e) for e in events],
    }
