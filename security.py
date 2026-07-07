"""
비밀번호 처리 로직을 모아두는 모듈.

지금 단계(Issue #3 - 회원가입 API)에서는 실제 암호화(해싱)를 적용하지 않습니다.
다만 회원가입/로그인 로직이 비밀번호 값을 직접 다루지 않고 반드시 이 모듈의 함수를
거치도록 구조를 잡아두면, 나중에 passlib(bcrypt) 등으로 실제 암호화를 적용할 때
이 파일의 함수 내부만 교체하면 되고 호출부(auth.py 등)는 수정할 필요가 없습니다.
"""


def hash_password(plain_password: str) -> str:
    """
    비밀번호를 해싱해서 반환합니다.

    TODO: 비밀번호 암호화 이슈에서 passlib(bcrypt) 기반의 실제 해싱 로직으로 교체 예정.
          예) from passlib.context import CryptContext
              pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
              return pwd_context.hash(plain_password)

    지금은 암호화 없이 입력값을 그대로 반환하지만, 호출부는 이미 "해싱 함수를 거친다"는
    구조로 작성되어 있어서 이후 이 함수 내부 구현만 바꾸면 전체 로직이 자연스럽게 교체됩니다.
    """
    return plain_password


def verify_password(plain_password: str, stored_password: str) -> bool:
    """
    로그인 시 입력한 비밀번호와 저장된 값을 비교합니다.

    TODO: 실제 해싱이 적용되면 pwd_context.verify(plain_password, stored_password)로 교체 예정.
    지금은 해싱을 적용하지 않으므로 단순 문자열 비교로 동작합니다.
    """
    return plain_password == stored_password
