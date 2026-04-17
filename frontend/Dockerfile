# Usamos una imagen oficial de Node.js
FROM node:18-alpine

# Establecemos el directorio de trabajo
WORKDIR /app

# Copiamos los archivos de configuración de dependencias
COPY package.json package-lock.json* ./

# Instalamos dependencias (incluyendo las que faltaban como leaflet, recharts, etc.)
# Nota: Si faltan algunas en tu package.json real, las instalaremos manual luego, 
# pero este Dockerfile asume que están listadas o las instalaremos al vuelo si es necesario.
RUN npm install

# Si necesitas instalar librerías extra que no están en package.json, descomenta esto:
# RUN npm install leaflet react-leaflet recharts date-fns lucide-react clsx tailwind-merge

# Copiamos el resto del código fuente
COPY . .

# Expone el puerto 3000 de Next.js
EXPOSE 3000

# Comando para modo desarrollo (con hot-reload)
CMD ["npm", "run", "dev"]