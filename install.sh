#!/bin/bash
# Script de instalación automatizada para Delivery_360 (Linux/macOS)
set -e

echo "🚀 Iniciando instalación de Delivery_360..."

# Verificar Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 no está instalado"
    exit 1
fi

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js no está instalado"
    exit 1
fi

# Verificar pip
if ! command -v pip3 &> /dev/null; then
    echo "❌ Error: pip3 no está instalado"
    exit 1
fi

# Instalar dependencias del backend
echo "📦 Instalando dependencias del backend..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
cd ..

# Crear .env del backend si no existe
if [ ! -f backend/.env ]; then
    echo "📝 Creando archivo .env para backend..."
    cp backend/.env.example backend/.env
    echo "⚠️  IMPORTANTE: Edita backend/.env con tus configuraciones reales"
fi

# Instalar dependencias del frontend
echo "📦 Instalando dependencias del frontend..."
cd frontend
npm install
cd ..

# Crear .env del frontend si no existe
if [ ! -f frontend/.env ]; then
    echo "📝 Creando archivo .env para frontend..."
    cp frontend/.env.example frontend/.env
fi

echo ""
echo "✅ ¡Instalación completada exitosamente!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Configura las variables de entorno en backend/.env y frontend/.env"
echo "2. Para iniciar en modo desarrollo:"
echo "   - Backend: cd backend && source venv/bin/activate && uvicorn app.main:app --reload"
echo "   - Frontend: cd frontend && npm run dev"
echo ""
echo "3. O usa Docker: docker-compose up --build"
echo ""
