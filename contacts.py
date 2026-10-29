"""
문의(Contact) API 라우터.

사이트 푸터의 Contact 폼에서 비로그인 방문자도 문의를 남길 수 있습니다(POST /contact).
조회·처리 상태 변경·삭제는 admin.py의 /admin/contacts 경로에서 처리합니다.

스팸 방지를 위해 같은 IP에서는 SUBMIT_WINDOW_SECONDS 동안
MAX_SUBMISSIONS_PER_IP 건까지만 접수합니다. (서버 메모리 기준, 재시작 시 초기화)
"""

import time
from collections import defaultdict, deque
from threading import Lock
from typing import Deque, Dict

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from crud import create_contact_inquiry
from database import get_db
from login_throttle import get_client_ip
from schemas import ContactCreateRequest, ContactCreateResponse

router = APIRouter(prefix="/contact", tags=["문의"])

SUBMIT_WINDOW_SECONDS = 60 * 60
MAX_SUBMISSIONS_PER_IP = 5

_submissions_by_ip: Dict[str, Deque[float]] = defaultdict(deque)
_lock = Lock()


def _check_and_record_submission(ip: str) -> None:
    now = time.time()
    with _lock:
        records = _submissions_by_ip[ip]
        while records and now - records[0] > SUBMIT_WINDOW_SECONDS:
            records.popleft()
        if len(records) >= MAX_SUBMISSIONS_PER_IP:
            retry_after = max(1, int(SUBMIT_WINDOW_SECONDS - (now - records[0])))
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="문의가 너무 많이 접수되었습니다. 잠시 후 다시 시도해 주세요.",
                headers={"Retry-After": str(retry_after)},
            )
        records.append(now)


def reset_submissions() -> None:
    """테스트용: 접수 기록을 지웁니다."""
    with _lock:
        _submissions_by_ip.clear()


@router.post(
    "",
    response_model=ContactCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
def submit_contact(
    payload: ContactCreateRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    문의 등록 API (Public).

    - 이름, 이메일, 제목, 내용을 받아 저장합니다.
    - 같은 IP에서 1시간에 5건을 넘으면 429를 반환합니다.
    - 문의 내용은 관리자만 /admin/contacts 에서 확인할 수 있습니다.
    """
    _check_and_record_submission(get_client_ip(request))
    create_contact_inquiry(db, payload.model_dump())
    return {"message": "문의가 접수되었습니다. 입력하신 이메일로 답변드리겠습니다."}
