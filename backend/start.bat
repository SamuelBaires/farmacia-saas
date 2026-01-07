@echo off
echo ========================================
echo   Iniciando Backend - Farmacia SaaS
echo ========================================
echo.

cd /d "%~dp0"

if not exist "venv\" (
    echo [ERROR] Entorno virtual no encontrado.
    echo Por favor ejecuta primero: python -m venv venv
    pause
    exit /b 1
)

echo Activando entorno virtual...
call venv\Scripts\activate.bat

echo Iniciando servidor FastAPI...
echo.
echo Backend disponible en: http://localhost:8000
echo API Docs en: http://localhost:8000/docs
echo.
echo Presiona Ctrl+C para detener el servidor
echo.

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
