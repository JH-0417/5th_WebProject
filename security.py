"""
비밀번호 처리 및 JWT 발급 로직을 모아두는 모듈.

passlib(bcrypt)를 사용해 비밀번호를 해싱/검증하고,
python-jose를 사용해 JWT Access Token을 생성합니다.
회원가입/로그인 로직은 비밀번호 값을 직접 다루지 않고 반드시 이 모듈의 함수를
거치도록 구조화되어 있어서, 알고리즘을 교체하더라도 호출부(auth.py 등)는
수정할 필요가 없습니다.
"""

import os
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv
from fastapi import HTTPException, status
from jose import JWTError, jwt
from passlib.context import CryptContext

# ─── JWT 설정 ──────────────────────────────────────────────────────────────────

load_dotenv()

# SECRET_KEY: JWT 서명(Signature) 생성·검증에 사용되는 비밀 키.
# 이 값이 유출되면 공격자가 임의의 토큰을 위조할 수 있으므로, 실제 운영 환경에서는
# 환경 변수(.env)로 관리하고 코드에 직접 노출하지 않아야 함.
SECRET_KEY = os.getenv(
    "SECRET_KEY", "change-this-to-a-long-random-secret-in-production"
)

# ALGORITHM: JWT 서명 알고리즘. HS256(HMAC-SHA256)은 단일 SECRET_KEY로
# 서명과 검증을 모두 수행하는 대칭 방식이며, 가장 널리 사용됨.
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

# ACCESS_TOKEN_EXPIRE_MINUTES: Access Token 만료 시간(분).
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# 관리자 비밀번호 초기화(방식 A)에 사용하는 고정 임시 비밀번호.
# 운영 환경에서는 반드시 별도 환경 변수로 설정합니다.
TEMPORARY_PASSWORD = os.getenv("TEMPORARY_PASSWORD", "ChangeMe123!")

# ─── 비밀번호 컨텍스트 ─────────────────────────────────────────────────────────

# bcrypt 스킴을 사용하는 CryptContext.
# deprecated="auto"로 설정해두면 이후 스킴을 추가/교체할 때 예전 방식으로 저장된
# 해시를 자동으로 "구식(deprecated)"으로 표시해줘서 마이그레이션이 쉬워짐
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    """
    평문 비밀번호를 bcrypt로 해싱해서 반환합니다.

    bcrypt는 해싱할 때마다 랜덤한 salt를 사용하므로, 같은 평문이어도
    호출할 때마다 다른 해시 문자열이 생성됩니다. DB에는 이 반환값(해시)만
    저장되며, 평문 비밀번호는 어디에도 저장되지 않습니다.
    """
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, stored_password: str) -> bool:
    """
    로그인 시 입력한 평문 비밀번호와 DB에 저장된 bcrypt 해시값을 비교합니다.
    """
    return pwd_context.verify(plain_password, stored_password)


def create_access_token(login_id: str) -> str:
    """
    JWT Access Token을 생성해서 반환합니다.

    Payload 구성:
    - sub : 토큰의 주체(Subject). 해당 회원의 login_id를 담아 이후 요청에서
            "누구의 토큰인지"를 식별하는 데 사용됩니다.
    - exp : 만료 시각(Expiration Time). UTC 기준 현재 시각 + 30분.
            만료된 토큰은 python-jose가 자동으로 ExpiredSignatureError를 발생시킵니다.

    서명 과정:
    jwt.encode()가 Payload를 JSON으로 직렬화한 뒤 SECRET_KEY와 ALGORITHM(HS256)으로
    HMAC 서명을 생성하고, Base64URL로 인코딩된 Header.Payload.Signature 형태의
    문자열을 반환합니다.
    """
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": login_id,
        "exp": expire,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> str:
    """
    JWT Access Token을 검증하고 sub(login_id)를 반환합니다.

    검증 내용:
    - 서명(Signature) 위변조 여부 — SECRET_KEY로 재계산한 서명과 비교
    - 만료 시각(exp) 초과 여부 — python-jose가 자동 처리

    위 검증 중 하나라도 실패하면 401 Unauthorized를 발생시킵니다.
    검증을 통과하면 Payload의 sub 값(login_id)을 반환합니다.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="토큰이 유효하지 않거나 만료되었습니다.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        login_id: str = payload.get("sub")
        if login_id is None:
            raise credentials_exception
        return login_id
    except JWTError:
        raise credentials_exception
