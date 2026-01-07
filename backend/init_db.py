"""
Script to initialize database with sample data for testing
"""
import sys
import os
from datetime import datetime, date, timedelta
from decimal import Decimal

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, engine, Base
from app.models import *
from app.core.security import get_password_hash

def init_db():
    """Initialize database with sample data"""
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Check if data already exists
        existing_farmacia = db.query(Farmacia).first()
        if existing_farmacia:
            print("Database already initialized!")
            return
        
        # Create Farmacia
        farmacia = Farmacia(
            nombre="Farmacia San Salvador",
            nit="0614-123456-001-0",
            direccion="Av. Principal #123, San Salvador",
            telefono="2222-2222",
            email="info@farmaciasv.com",
            registro_sanitario="REG-2024-001",
            configuracion={
                "iva": 0.13,
                "moneda": "USD"
            }
        )
        db.add(farmacia)
        db.flush()
        
        print(f"✓ Farmacia creada: {farmacia.nombre}")
        
        # Create Users
        usuarios_data = [
            {
                "username": "admin",
                "email": "admin@farmacia.com",
                "password": "admin123",
                "nombre_completo": "Administrador Principal",
                "rol": RolUsuario.ADMINISTRADOR
            },
            {
                "username": "farmaceutico",
                "email": "farmaceutico@farmacia.com",
                "password": "farm123",
                "nombre_completo": "Juan Pérez",
                "rol": RolUsuario.FARMACEUTICO
            },
            {
                "username": "cajero",
                "email": "cajero@farmacia.com",
                "password": "cajero123",
                "nombre_completo": "María López",
                "rol": RolUsuario.CAJERO
            }
        ]
        
        usuarios = []
        for user_data in usuarios_data:
            usuario = Usuario(
                farmacia_id=farmacia.id,
                username=user_data["username"],
                email=user_data["email"],
                password_hash=get_password_hash(user_data["password"]),
                nombre_completo=user_data["nombre_completo"],
                rol=user_data["rol"]
            )
            db.add(usuario)
            usuarios.append(usuario)
        
        db.flush()
        print(f"✓ {len(usuarios)} usuarios creados")
        
        # Create Proveedores
        proveedores_data = [
            {
                "nombre": "Distribuidora Médica El Salvador",
                "nit": "0614-987654-001-0",
                "telefono": "2333-3333",
                "email": "ventas@distmedica.com"
            },
            {
                "nombre": "Laboratorios Farmacéuticos SA",
                "nit": "0614-555555-001-0",
                "telefono": "2444-4444",
                "email": "info@labfarm.com"
            }
        ]
        
        proveedores = []
        for prov_data in proveedores_data:
            proveedor = Proveedor(
                farmacia_id=farmacia.id,
                **prov_data
            )
            db.add(proveedor)
            proveedores.append(proveedor)
        
        db.flush()
        print(f"✓ {len(proveedores)} proveedores creados")
        
        # Create Medicamentos
        medicamentos_data = [
            {
                "codigo_barras": "7501234567890",
                "nombre_comercial": "Paracetamol 500mg",
                "nombre_generico": "Acetaminofén",
                "lote": "LOT2024001",
                "fecha_vencimiento": date.today() + timedelta(days=365),
                "precio_compra": Decimal("0.50"),
                "precio_venta": Decimal("1.00"),
                "stock_actual": 150,
                "stock_minimo": 20,
                "categoria": "Analgésicos"
            },
            {
                "codigo_barras": "7501234567891",
                "nombre_comercial": "Ibuprofeno 400mg",
                "nombre_generico": "Ibuprofeno",
                "lote": "LOT2024002",
                "fecha_vencimiento": date.today() + timedelta(days=300),
                "precio_compra": Decimal("0.75"),
                "precio_venta": Decimal("1.50"),
                "stock_actual": 8,  # Low stock for alert
                "stock_minimo": 20,
                "categoria": "Antiinflamatorios"
            },
            {
                "codigo_barras": "7501234567892",
                "nombre_comercial": "Amoxicilina 500mg",
                "nombre_generico": "Amoxicilina",
                "lote": "LOT2024003",
                "fecha_vencimiento": date.today() + timedelta(days=400),
                "precio_compra": Decimal("1.50"),
                "precio_venta": Decimal("3.00"),
                "stock_actual": 75,
                "stock_minimo": 15,
                "requiere_receta": True,
                "categoria": "Antibióticos"
            },
            {
                "codigo_barras": "7501234567893",
                "nombre_comercial": "Loratadina 10mg",
                "nombre_generico": "Loratadina",
                "lote": "LOT2024004",
                "fecha_vencimiento": date.today() + timedelta(days=450),
                "precio_compra": Decimal("0.60"),
                "precio_venta": Decimal("1.25"),
                "stock_actual": 100,
                "stock_minimo": 25,
                "categoria": "Antihistamínicos"
            },
            {
                "codigo_barras": "7501234567894",
                "nombre_comercial": "Omeprazol 20mg",
                "nombre_generico": "Omeprazol",
                "lote": "LOT2024005",
                "fecha_vencimiento": date.today() + timedelta(days=500),
                "precio_compra": Decimal("1.00"),
                "precio_venta": Decimal("2.00"),
                "stock_actual": 60,
                "stock_minimo": 20,
                "categoria": "Antiácidos"
            },
            {
                "codigo_barras": "7501234567895",
                "nombre_comercial": "Diazepam 10mg",
                "nombre_generico": "Diazepam",
                "lote": "LOT2024006",
                "fecha_vencimiento": date.today() + timedelta(days=350),
                "precio_compra": Decimal("2.00"),
                "precio_venta": Decimal("4.50"),
                "stock_actual": 30,
                "stock_minimo": 10,
                "es_controlado": True,
                "requiere_receta": True,
                "categoria": "Psicotrópicos"
            }
        ]
        
        for med_data in medicamentos_data:
            medicamento = Medicamento(
                farmacia_id=farmacia.id,
                proveedor_id=proveedores[0].id,
                **med_data
            )
            db.add(medicamento)
        
        db.flush()
        print(f"✓ {len(medicamentos_data)} medicamentos creados")
        
        # Create Clientes
        clientes_data = [
            {
                "nombre": "Cliente General",
                "nit_dui": None,
                "telefono": "7777-7777"
            },
            {
                "nombre": "Roberto Martínez",
                "nit_dui": "12345678-9",
                "telefono": "7888-8888",
                "email": "roberto@email.com"
            }
        ]
        
        for cliente_data in clientes_data:
            cliente = Cliente(
                farmacia_id=farmacia.id,
                **cliente_data
            )
            db.add(cliente)
        
        db.flush()
        print(f"✓ {len(clientes_data)} clientes creados")
        
        db.commit()
        
        print("\n" + "="*50)
        print("✅ Base de datos inicializada correctamente!")
        print("="*50)
        print("\nCredenciales de acceso:")
        print("\nAdministrador:")
        print("  Usuario: admin")
        print("  Contraseña: admin123")
        print("\nFarmacéutico:")
        print("  Usuario: farmaceutico")
        print("  Contraseña: farm123")
        print("\nCajero:")
        print("  Usuario: cajero")
        print("  Contraseña: cajero123")
        print("\n" + "="*50)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("Inicializando base de datos...")
    init_db()
