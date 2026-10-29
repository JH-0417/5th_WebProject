"""
로그인 실패 횟수 제한(무차별 대입 방지) 모듈.

같은 아이디 또는 같은 IP에서 짧은 시간에 로그인 실패가 반복되면
일정 시간 동안 로그인 시도 자체를 429 Too Many Requests로 막습니다.

- 아이디 기준: WINDOW_SECONDS 동안 MAX_FAILURES_PER_LOGIN_ID 회 실패 → 잠금
- IP 기준:     WINDOW_SECONDS 동안 MAX_FAILURES_PER_IP 회 실패 → 잠금
  (여러 아이디를 바꿔가며 시도하는 경우 대비)
- 로그인에 성공하면 해당 아이디의 실패 기록을 지웁니다.

실패 기록은 서버 메모리에 저장합니다. Render 무료 플랜처럼 서버가 1대인
환경을 전제로 하며, 서버가 재시작되면 기록이 초기화됩니다.
"""

import time
from collections import defaultdict, deque
from threading import Lock
from typing import Deque, Dict, Optional

from fastapi import HTTPException, Request, status

WINDOW_SECONDS = 15 * 60
MAX_FAILURES_PER_LOGIN_ID = 5
MAX_FAILURES_PER_IP = 20

_failures_by_login_id: Dict[str, Deque[float]] = defaultdict(deque)
_failures_by_ip: Dict[str, Deque[float]] = defaultdict(deque)
_lock = Lock()


def get_client_ip(request: Request) -> str:
    """프록시(Render) 뒤에서도 실제 접속 IP를 얻기 위해 X-Forwarded-For 첫 값을 우선 사용합니다."""
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _prune(records: Deque[float], now: float) -> None:
    while records and now - records[0] > WINDOW_SECONDS:
        records.popleft()


def _retry_after(records: Deque[float], now: float) -> int:
    return max(1, int(WINDOW_SECONDS - (now - records[0])))


def check_login_allowed(login_id: str, ip: str) -> None:
    """잠금 상태이면 429를 발생시킵니다. 로그인 검증 전에 호출합니다."""
    now = time.time()
    with _lock:
        retry_after: Optional[int] = None
        for records, limit in (
            (_failures_by_login_id[login_id], MAX_FAILURES_PER_LOGIN_ID),
            (_failures_by_ip[ip], MAX_FAILURES_PER_IP),
        ):
            _prune(records, now)
            if len(records) >= limit:
                retry_after = max(retry_after or 0, _retry_after(records, now))

    if retry_after is not None:
        minutes = (retry_after + 59) // 60
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"로그인 시도가 너무 많습니다. {minutes}분 후 다시 시도해 주세요.",
            headers={"Retry-After": str(retry_after)},
        )


def record_login_failure(login_id: str, ip: str) -> None:
    now = time.time()
    with _lock:
        _failures_by_login_id[login_id].append(now)
        _failures_by_ip[ip].append(now)


def clear_login_failures(login_id: str) -> None:
    with _lock:
        _failures_by_login_id.pop(login_id, None)


def reset_all() -> None:
    """테스트용: 모든 실패 기록을 지웁니다."""
    with _lock:
        _failures_by_login_id.clear()
        _failures_by_ip.clear()
