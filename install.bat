@echo off
REM Script de instalación automatizada para Delivery_360 (Windows)
setlocal enabledelayedexpansion

echo 🚀 Iniciando instalación de Delivery_360...

REM Verificar Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Python no está instalado
    exit /b 1
)

REM Verificar Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Node.js no está instalado
    exit /b 1
)

REM Verificar pip
pip --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: pip no está instalado
    exit /b 1
)

REM Instalar dependencias del backend
echo 📦 Instalando dependencias del backend...
cd backend
python -m venv venv
call venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r requirements.txt
cd ..

REM Crear .env del backend si no existe
if not exist backend\.env (
    echo 📝 Creando archivo .env para backend...
    copy backend\.env.example backend\.env
    echo ⚠️  IMPORTANTE: Edita backend\.env con tus configuraciones reales
)

REM Instalar dependencias del frontend
echo 📦 Instalando dependencias del frontend...
cd frontend
call npm install
cd ..

REM Crear .env del frontend si no existe
if not exist frontend\.env (
    echo 📝 Creando archivo .env para frontend...
    copy frontend\.env.example frontend\.env
)

echo.
echo ✅ ¡Instalación completada exitosamente!
echo.
echo 📋 Próximos pasos:
echo 1. Configura las variables de entorno en backend\.env y frontend\.env
echo 2. Para iniciar en modo desarrollo:
echo    - Backend: cd backend ^&^& venv\Scripts\activate ^&^& uvicorn app.main:app --reload
echo    - Frontend: cd frontend ^&^& npm run dev
echo.
echo 3. O usa Docker: docker-compose up --build
echo.

pause
