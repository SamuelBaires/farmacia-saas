import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.core.database import SessionLocal
from app.models.user import Usuario
from app.core.security import verify_password, get_password_hash

db = SessionLocal()
try:
    usuarios = db.query(Usuario).all()
    print(f"Total usuarios: {len(usuarios)}")
    for u in usuarios:
        un = u.username
        # Test passwords
        passwords_to_test = ["admin123", "farm123", "cajero123"]
        found_pass = None
        for p in passwords_to_test:
            if verify_password(p, u.password_hash):
                found_pass = p
                break
        
        print(f"User: '{un}' (len={len(un)}) | Activo: {u.activo} | Password matches: {found_pass}")
        
        # If no password matches, reset it to the expected one
        if found_pass is None:
            new_pass = ""
            if un == "admin": new_pass = "admin123"
            elif un == "farmaceutico": new_pass = "farm123"
            elif un == "cajero": new_pass = "cajero123"
            
            if new_pass:
                u.password_hash = get_password_hash(new_pass)
                print(f"  -> Resetting password for {un} to {new_pass}")
    
    db.commit()
    print("DONE")
finally:
    db.close()
