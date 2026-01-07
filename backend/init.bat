@echo off
echo ========================================
echo   Inicializando Base de Datos
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

echo Inicializando base de datos con datos de prueba...
echo.

python init_db.py

echo.
echo ========================================
echo   Inicialización completada
echo ========================================
pause
