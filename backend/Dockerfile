FROM python:3.11

# Crear directorio de trabajo
WORKDIR /usr/src/app

# Copiar código fuente
COPY . .

# Copiar dependencias
COPY requirements.txt .

# Instalar dependencias
RUN pip install --no-cache-dir -r requirements.txt

# Cargar variables de entorno
ENV PYTHONUNBUFFERED=1

# Exponer puerto
EXPOSE 8005

# Comando para ejecutar FastAPI
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8005"]
