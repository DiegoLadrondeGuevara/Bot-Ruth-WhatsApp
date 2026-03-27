FROM node:20-alpine

# Instalar dependencias del sistema y ngrok
# Se usan bash/curl por practicidad para scripts ocasionales
RUN apk add --no-cache bash curl
RUN npm install -g ngrok

# Crear directorio de la app
WORKDIR /usr/src/app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias de la app
RUN npm install

# Copiar el código de la app
COPY . .

# Exponer el puerto de la aplicación (por defecto 3000) y el de ngrok
EXPOSE 3000
EXPOSE 4040

# Comando para iniciar la aplicación Node
CMD ["npm", "start"]
