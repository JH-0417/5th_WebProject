"""
비밀번호 처리 로직을 모아두는 모듈.

passlib(bcrypt)를 사용해 비밀번호를 해싱/검증합니다.
회원가입/로그인 로직은 비밀번호 값을 직접 다루지 않고 반드시 이 모듈의 함수를
거치도록 구조화되어 있어서, 알고리즘을 교체하더라도 호출부(auth.py 등)는
수정할 필요가 없습니다.
"""

from passlib.context import CryptContext

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

    (로그인 API는 아직 구현하지 않으며, 이 함수는 이후 로그인 기능 구현 시 사용됩니다.)
    """
    return pwd_context.verify(plain_password, stored_password)
