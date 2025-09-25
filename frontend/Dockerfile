FROM node:20.19.0

# Crear directorio de trabajo
WORKDIR /usr/src/app

# Instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar código fuente
COPY . .

# Exponer puerto de Vite
EXPOSE 5173

# Comando para arrancar Vite
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
