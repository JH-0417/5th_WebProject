@echo off
chcp 65001 > nul
setlocal

rem 이 파일이 있는 프로젝트 루트를 기준으로 각각 새 터미널을 엽니다.
start "V-Generation Backend" /D "%~dp0" cmd /k python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
start "V-Generation Frontend" /D "%~dp0frontend" cmd /k npm run dev

echo Backend:  http://127.0.0.1:8000
echo Frontend: http://localhost:5173
echo.
echo 서버를 종료하려면 새로 열린 각 터미널에서 Ctrl+C를 누르세요.

endlocal
