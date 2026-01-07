# ✅ Sistema Farmacia SaaS - Listo para Usar

## 🎉 ¡El sistema está corriendo!

### Servidores Activos:

**Backend API:**
- URL: http://localhost:8000
- Documentación: http://localhost:8000/docs

**Frontend:**
- URL: http://localhost:5173

### 🔑 Credenciales de Acceso:

**Administrador:**
- Usuario: `admin`
- Contraseña: `admin123`

**Farmacéutico:**
- Usuario: `farmaceutico`
- Contraseña: `farm123`

**Cajero:**
- Usuario: `cajero`
- Contraseña: `cajero123`

## 🚀 Cómo Usar:

1. **Abrir el navegador** en: http://localhost:5173
2. **Iniciar sesión** con cualquiera de las credenciales arriba
3. **Explorar el sistema**:
   - Dashboard: Ver métricas y alertas
   - Punto de Venta: Procesar ventas
   - Inventario: Gestionar medicamentos

## 📦 Datos de Prueba Incluidos:

- ✅ 6 medicamentos (incluyendo 1 con stock bajo para alerta)
- ✅ 2 proveedores
- ✅ 2 clientes
- ✅ 3 usuarios con diferentes roles

## 🔧 Comandos Útiles:

### Iniciar Backend (si se detuvo):
```powershell
cd C:\Users\samue\.gemini\antigravity\scratch\farmacia-saas\backend
.\venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Iniciar Frontend (si se detuvo):
```powershell
cd C:\Users\samue\.gemini\antigravity\scratch\farmacia-saas\frontend
npm run dev
```

### Usar Scripts de Inicio Rápido:
```powershell
# Backend
cd C:\Users\samue\.gemini\antigravity\scratch\farmacia-saas\backend
.\start.bat

# Reiniciar base de datos (CUIDADO: borra datos)
cd C:\Users\samue\.gemini\antigravity\scratch\farmacia-saas\backend
del farmacia.db
.\init.bat
```

## 🧪 Probar el POS:

1. Ir a "Punto de Venta"
2. En el campo de búsqueda, escribir: `7501234567890`
3. Presionar Enter
4. El Paracetamol se agregará al carrito
5. Click en "Procesar Venta"

## 📊 Ver Alertas:

1. Ir a "Inventario"
2. Verás una alerta de "Ibuprofeno 400mg" con stock bajo (8 unidades)

## 🛑 Detener los Servidores:

Presionar `Ctrl+C` en cada terminal donde están corriendo.

---

**¡Sistema listo para desarrollo y pruebas!** 🎊
