# Sistema SaaS de Gestión de Farmacia - El Salvador

Sistema completo de gestión para farmacias pequeñas en El Salvador, cumpliendo con normativa local.

## 🚀 Características Principales

### ✅ Inventario y Medicamentos
- Registro completo de medicamentos (comercial, genérico, código de barras, lote, vencimiento)
- Control de medicamentos controlados y con receta
- Alertas automáticas de stock mínimo y próximos a vencer
- Kardex de inventario completo

### 💰 Punto de Venta (POS)
- Interfaz optimizada para mostrador
- Lectura de códigos de barras
- Múltiples métodos de pago (efectivo, tarjeta, transferencia)
- Control de apertura/cierre de caja
- Historial de ventas

### 📊 Dashboard y Reportes
- Métricas en tiempo real
- Productos más vendidos
- Inventario crítico
- Reportes descargables (preparado para PDF/Excel)

### 👥 Gestión de Usuarios
- Sistema multiusuario con roles:
  - **Administrador**: Acceso completo
  - **Farmacéutico**: Gestión de inventario y ventas
  - **Cajero**: Solo POS

### 🇸🇻 Cumplimiento Normativo El Salvador
- Control de medicamentos con receta
- Trazabilidad por lote
- Registro de ventas reguladas
- Preparado para integración DTE (Facturación Electrónica)

## 🛠️ Tecnologías

**Backend:**
- Python 3.11
- FastAPI
- PostgreSQL
- SQLAlchemy
- JWT Authentication

**Frontend:**
- React 18
- Vite
- TailwindCSS
- React Router
- Axios

**Infraestructura:**
- Docker & Docker Compose
- Nginx

## 📦 Instalación

### Requisitos Previos
- Docker y Docker Compose instalados
- Git

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd farmacia-saas
```

2. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env y cambiar SECRET_KEY en producción
```

3. **Iniciar con Docker Compose**
```bash
docker-compose up -d
```

4. **Acceder a la aplicación**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 🔧 Desarrollo Local

### Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # En Windows: venv\\Scripts\\activate

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar servidor
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Ejecutar servidor de desarrollo
npm run dev
```

## 👤 Usuario de Prueba

Para crear un usuario inicial, ejecutar el script de inicialización de base de datos (próximamente) o crear manualmente:

```python
# En consola Python con acceso a la base de datos
from app.models.user import Usuario, RolUsuario
from app.models.farmacia import Farmacia
from app.core.security import get_password_hash
from app.core.database import SessionLocal

db = SessionLocal()

# Crear farmacia
farmacia = Farmacia(
    nombre="Farmacia Demo",
    nit="0614-123456-001-0",
    direccion="San Salvador, El Salvador",
    telefono="2222-2222",
    email="demo@farmacia.com"
)
db.add(farmacia)
db.flush()

# Crear usuario admin
usuario = Usuario(
    farmacia_id=farmacia.id,
    username="admin",
    email="admin@farmacia.com",
    password_hash=get_password_hash("admin123"),
    nombre_completo="Administrador",
    rol=RolUsuario.ADMINISTRADOR
)
db.add(usuario)
db.commit()
```

**Credenciales:**
- Usuario: `admin`
- Contraseña: `admin123`

## 📱 Uso del Sistema

### 1. Inicio de Sesión
Acceder con las credenciales proporcionadas.

### 2. Configurar Inventario
- Ir a **Inventario**
- Agregar medicamentos con código de barras, precios, stock

### 3. Punto de Venta
- Ir a **Punto de Venta**
- Escanear código de barras o buscar producto
- Agregar al carrito
- Procesar venta

### 4. Monitoreo
- El **Dashboard** muestra métricas en tiempo real
- Las **Alertas** notifican sobre stock bajo y vencimientos

## 🔒 Seguridad

- Autenticación JWT
- Contraseñas hasheadas con bcrypt
- Multi-tenant (aislamiento por farmacia)
- Auditoría completa de operaciones
- CORS configurado

## 📄 Estructura del Proyecto

```
farmacia-saas/
├── backend/
│   ├── app/
│   │   ├── api/          # Endpoints
│   │   ├── core/         # Configuración
│   │   ├── models/       # Modelos de BD
│   │   ├── schemas/      # Pydantic schemas
│   │   └── services/     # Lógica de negocio
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/   # Componentes React
│   │   ├── context/      # Context API
│   │   ├── pages/        # Páginas
│   │   └── services/     # API calls
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

### Despliegue en la Nube (Gratis)

Este sistema está configurado para un despliegue rápido usando **Render** (Frontend) y **Supabase** (Base de Datos/Auth).

#### 1. Supabase (Base de Datos y Auth)
1. Crea un proyecto en [Supabase](https://supabase.com/).
2. En el **SQL Editor**, ejecuta el contenido de [SUPABASE_SETUP.sql](file:///c:/Users/samue/Desktop/farmacia-saas/docs/SUPABASE_SETUP.sql).
3. Obtén tu `https://kgdweazdhucbvyqhwjck.supabase.co` y `sb_publishable_cLRS--yvXhz5XiwBtDma5Q_5nq0z04E` desde Settings > API.

#### 2. GitHub
1. Sube este repositorio a tu cuenta de GitHub.

#### 3. Render (Hosting Frontend)
1. Crea un nuevo **Static Site** en [Render](https://render.com/).
2. Conecta tu repositorio de GitHub.
3. Render detectará automáticamente el archivo `render.yaml`.
4. Configura las siguientes variabes de entorno en Render:
   - `[VITE_SUPABASE_URL](https://kgdweazdhucbvyqhwjck.supabase.co)`: Tu URL de Supabase.
   - `sb_publishable_cLRS--yvXhz5XiwBtDma5Q_5nq0z04E`: Tu clave anon de Supabase.
5. El comando de build es `npm run build` (especificado en `render.yaml`).
6. El directorio de publicación es `dist`.

#### Acceso en la Nube
Una vez desplegado, puedes entrar con:
- **Usuario**: `admin`
- **Contraseña**: `admin123`
*(Bypass habilitado para pruebas iniciales sin backend Python)*

## 📝 Licencia

Propietario - Todos los derechos reservados

## 🤝 Soporte

Para soporte técnico, contactar a: [email de soporte]

---

**Desarrollado para farmacias en El Salvador** 🇸🇻


