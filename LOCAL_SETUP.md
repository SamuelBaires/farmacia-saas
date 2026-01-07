# Guía de Desarrollo Local (Sin Docker)

## Requisitos
- Python 3.11 o superior
- Node.js 18 o superior
- PostgreSQL 15 (o usar SQLite para desarrollo)

## Opción 1: Usar SQLite (Más Fácil)

### Backend

1. **Navegar al directorio backend**
```powershell
cd C:\Users\samue\.gemini\antigravity\scratch\farmacia-saas\backend
```

2. **Crear entorno virtual**
```powershell
python -m venv venv
.\venv\Scripts\activate
```

3. **Instalar dependencias**
```powershell
pip install -r requirements.txt
```

4. **Configurar para SQLite**
Crear archivo `.env` en la carpeta `backend`:
```
DATABASE_URL=sqlite:///./farmacia.db
SECRET_KEY=your-super-secret-key-change-this-in-production-min-32-characters
DEBUG=True
```

5. **Inicializar base de datos**
```powershell
python init_db.py
```

6. **Ejecutar servidor**
```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

El backend estará disponible en: http://localhost:8000

### Frontend

1. **Abrir nueva terminal y navegar al frontend**
```powershell
cd C:\Users\samue\.gemini\antigravity\scratch\farmacia-saas\frontend
```

2. **Instalar dependencias** (si no lo has hecho)
```powershell
npm install
```

3. **Ejecutar servidor de desarrollo**
```powershell
npm run dev
```

El frontend estará disponible en: http://localhost:5173

## Opción 2: Usar PostgreSQL Local

Si tienes PostgreSQL instalado localmente:

1. **Crear base de datos**
```sql
CREATE DATABASE farmacia_db;
```

2. **Configurar .env en backend**
```
DATABASE_URL=postgresql://postgres:tu_password@localhost:5432/farmacia_db
SECRET_KEY=your-super-secret-key-change-this-in-production-min-32-characters
DEBUG=True
```

3. Seguir los mismos pasos de la Opción 1 para backend y frontend.

## Verificación

### Backend
Abrir http://localhost:8000/docs - Deberías ver la documentación de la API

### Frontend
Abrir http://localhost:5173 - Deberías ver la página de login

## Credenciales de Prueba

Después de ejecutar `init_db.py`:

- **Admin**: usuario `admin` / contraseña `admin123`
- **Farmacéutico**: usuario `farmaceutico` / contraseña `farm123`
- **Cajero**: usuario `cajero` / contraseña `cajero123`

## Solución de Problemas

### Error: "No module named 'app'"
Asegúrate de estar en el directorio `backend` y tener el entorno virtual activado.

### Error: "VITE_API_URL not defined"
El frontend ya tiene configurado `.env` con `VITE_API_URL=http://localhost:8000/api`

### Puerto en uso
Si el puerto 8000 está ocupado, cambiar en el comando uvicorn:
```powershell
uvicorn app.main:app --reload --port 8001
```

Y actualizar `frontend/.env`:
```
VITE_API_URL=http://localhost:8001/api
```

## Desarrollo Activo

Con esta configuración:
- ✅ Backend tiene hot-reload (cambios en Python se reflejan automáticamente)
- ✅ Frontend tiene hot-reload (cambios en React se reflejan automáticamente)
- ✅ No necesitas Docker

## Siguiente Paso

Una vez que ambos servidores estén corriendo, accede a http://localhost:5173 y prueba el sistema.
