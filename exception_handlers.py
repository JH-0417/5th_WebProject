"""
전역 예외 처리(Exception Handler).

라우터에서 raise한 HTTPException은 기존처럼 detail을 유지하고,
검증 실패(422)와 예상치 못한 서버 오류(500) 응답 형식을 통일합니다.
"""

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException


def register_exception_handlers(app: FastAPI) -> None:
    """FastAPI 앱에 전역 예외 핸들러를 등록합니다."""

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(
        request: Request,
        exc: StarletteHTTPException,
    ) -> JSONResponse:
        # 기존 API/Swagger와 호환되도록 detail 키를 유지합니다.
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
            headers=getattr(exc, "headers", None),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request,
        exc: RequestValidationError,
    ) -> JSONResponse:
        # Pydantic 검증 실패 시 프론트가 다루기 쉬운 형태로 정리합니다.
        errors = []
        for err in exc.errors():
            loc = [str(part) for part in err.get("loc", []) if part != "body"]
            field = ".".join(loc) if loc else "body"
            errors.append(
                {
                    "field": field,
                    "message": err.get("msg", "유효하지 않은 값입니다."),
                }
            )

        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "detail": "요청 값이 올바르지 않습니다.",
                "errors": errors,
            },
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(
        request: Request,
        exc: Exception,
    ) -> JSONResponse:
        # 스택 트레이스는 서버 로그에만 남기고, 클라이언트에는 일반 메시지만 반환합니다.
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "서버 내부 오류가 발생했습니다."},
        )
