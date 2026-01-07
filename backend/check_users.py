import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.core.database import SessionLocal
from app.models import Usuario

db = SessionLocal()
try:
    usuarios = db.query(Usuario).all()
    print(f"Total usuarios: {len(usuarios)}")
    for u in usuarios:
        print(f"ID: {u.id}, Username: {u.username}, Email: {u.email}, Rol: {u.rol}")
finally:
    db.close()
