import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.core.database import SessionLocal
from app.models.user import Usuario
from app.core.security import verify_password

db = SessionLocal()
try:
    usuarios = db.query(Usuario).all()
    print(f"Total usuarios: {len(usuarios)}")
    for u in usuarios:
        is_admin_pass = verify_password("admin123", u.password_hash) if u.username == "admin" else "N/A"
        print(f"ID: {u.id}, Username: {u.username}, Activo: {u.activo}, Pass valid: {is_admin_pass}")
        if not u.activo:
            u.activo = True
            print(f"  -> Activando usuario {u.username}")
    db.commit()
finally:
    db.close()
