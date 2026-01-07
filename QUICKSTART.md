# Guía de Inicio Rápido

## Requisitos
- Docker Desktop instalado y ejecutándose
- Git (opcional)

## Pasos para Iniciar

### 1. Navegar al Proyecto
```powershell
cd C:\Users\samue\.gemini\antigravity\scratch\farmacia-saas
```

### 2. Crear Archivo .env
```powershell
copy .env.example .env
```

### 3. Iniciar Servicios con Docker
```powershell
docker-compose up -d
```

Esto iniciará:
- PostgreSQL en puerto 5432
- Backend FastAPI en puerto 8000
- Frontend React en puerto 3000

### 4. Esperar a que PostgreSQL esté Listo
Esperar 10-15 segundos para que la base de datos se inicialice completamente.

### 5. Inicializar Base de Datos con Datos de Prueba
```powershell
docker exec -it farmacia-backend python init_db.py
```

Verás un mensaje de confirmación con las credenciales de acceso.

### 6. Acceder a la Aplicación
Abrir navegador en: **http://localhost:3000**

### 7. Login
Usar una de estas credenciales:

**Administrador:**
- Usuario: `admin`
- Contraseña: `admin123`

**Farmacéutico:**
- Usuario: `farmaceutico`
- Contraseña: `farm123`

**Cajero:**
- Usuario: `cajero`
- Contraseña: `cajero123`

## Probar el Sistema

### Punto de Venta (POS)
1. Ir a "Punto de Venta" en el menú
2. En el campo de búsqueda, escribir: `7501234567890`
3. Presionar Enter o click en "Buscar"
4. El Paracetamol se agregará al carrito
5. Ajustar cantidad con + / -
6. Click en "Procesar Venta"

### Inventario
1. Ir a "Inventario"
2. Ver alerta de Ibuprofeno (stock bajo: 8 unidades)
3. Buscar medicamentos en el campo de búsqueda
4. Observar medicamentos controlados marcados con etiqueta roja

### Dashboard
- Ver métricas de ventas
- Ver productos más vendidos
- Ver alertas de inventario

## Comandos Útiles

### Ver Logs
```powershell
# Todos los servicios
docker-compose logs -f

# Solo backend
docker-compose logs -f backend

# Solo frontend
docker-compose logs -f frontend
```

### Detener Servicios
```powershell
docker-compose down
```

### Reiniciar Servicios
```powershell
docker-compose restart
```

### Acceder a la Base de Datos
```powershell
docker exec -it farmacia-db psql -U postgres -d farmacia_db
```

Comandos útiles en PostgreSQL:
```sql
-- Ver tablas
\dt

-- Ver usuarios
SELECT username, rol, nombre_completo FROM usuarios;

-- Ver medicamentos
SELECT nombre_comercial, stock_actual, precio_venta FROM medicamentos;

-- Salir
\q
```

## Desarrollo

### Backend (con hot-reload)
El backend ya tiene hot-reload activado en docker-compose. Los cambios en archivos Python se reflejarán automáticamente.

### Frontend (desarrollo local)
Si prefieres desarrollo local del frontend:

```powershell
cd frontend
npm install
npm run dev
```

Acceder en: http://localhost:5173

## Solución de Problemas

### Puerto ya en uso
Si algún puerto está ocupado, modificar en `docker-compose.yml`:
```yaml
ports:
  - "8001:8000"  # Cambiar 8000 por otro puerto
```

### Base de datos no se conecta
Verificar que PostgreSQL esté corriendo:
```powershell
docker ps
```

Debe aparecer `farmacia-db` con estado "healthy".

### Frontend no carga
Verificar que el backend esté corriendo:
```powershell
curl http://localhost:8000/health
```

Debe responder: `{"status":"healthy"}`

## API Documentation

Acceder a la documentación interactiva de la API:
**http://localhost:8000/docs**

Aquí puedes probar todos los endpoints directamente desde el navegador.

## Próximos Pasos

1. Explorar todos los módulos del sistema
2. Probar diferentes roles de usuario
3. Agregar más medicamentos
4. Procesar ventas
5. Revisar el código fuente para personalizaciones

---

¡Sistema listo para usar! 🎉
