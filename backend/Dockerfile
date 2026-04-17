# Usamos una imagen ligera de Python 3.11
FROM python:3.11-slim

# Establecemos el directorio de trabajo dentro del contenedor
WORKDIR /app

# Instalamos dependencias del sistema necesarias para compilar librerías Python
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copiamos primero el archivo de requisitos para aprovechar la caché de Docker
COPY requirements.txt .

# Instalamos las dependencias de Python
RUN pip install --no-cache-dir -r requirements.txt

# Instalamos una pequeña utilidad para esperar a que la DB esté lista
RUN pip install wait-for-it

# Copiamos todo el código del backend
COPY . .

# Expone el puerto 8000
EXPOSE 8000

# Comando por defecto (se sobreescribe en docker-compose para migraciones)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]