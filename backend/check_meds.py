import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.core.database import SessionLocal
from app.models import Medicamento

db = SessionLocal()
try:
    medicamentos = db.query(Medicamento).all()
    print(f"Total medicamentos: {len(medicamentos)}")
    for m in medicamentos:
        print(f"ID: {m.id}, Nombre: {m.nombre_comercial}, Precio Venta: {m.precio_venta} ({type(m.precio_venta)}), Stock: {m.stock_actual}")
finally:
    db.close()
