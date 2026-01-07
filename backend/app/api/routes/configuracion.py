from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Any
from uuid import UUID
import uuid

from app.core.database import get_db
from app.models.farmacia import Farmacia
from app.models.user import Usuario, RolUsuario
from app.schemas.configuracion import (
    ConfigurationSchema, UsuarioRead, UsuarioCreate, UsuarioUpdate,
    GeneralSettings, SystemParameters, POSSettings, ReportPreferences, SecuritySettings
)
from app.core.security import get_password_hash

router = APIRouter(prefix="/configuracion", tags=["configuracion"])

# --- System Configuration (stored in Farmacia.configuracion JSON) ---

@router.get("", response_model=ConfigurationSchema)
async def get_configuracion(db: Session = Depends(get_db)):
    # In a multi-tenant system, we would filter by the user's farmacia_id.
    # For now, we take the first one as staging/test mode.
    farmacia = db.query(Farmacia).first()
    if not farmacia:
        raise HTTPException(status_code=404, detail="Farmacia no encontrada")
    
    # Default values if JSON is empty
    config_data = farmacia.configuracion or {}
    
    return {
        "general": config_data.get("general", {
            "nombre_farmacia": farmacia.nombre,
            "direccion": farmacia.direccion,
            "telefono": farmacia.telefono,
            "email": farmacia.email,
            "moneda": "USD",
            "zona_horaria": "America/El_Salvador"
        }),
        "parametros": config_data.get("parametros", {
            "stock_minimo_defecto": 10,
            "dias_alerta_vencimiento": 60,
            "numeracion_comprobantes": "000001",
            "impuestos_valor": 13.0
        }),
        "pos": config_data.get("pos", {
            "lector_codigo_barras": True,
            "tipo_impresora": "Térmica 80mm",
            "metodos_pago_habilitados": ["Efectivo", "Tarjeta", "Transferencia"]
        }),
        "reportes": config_data.get("reportes", {
            "reportes_activos": True,
            "formato_preferido": "pdf",
            "correos_notificaciones": []
        }),
        "seguridad": config_data.get("seguridad", {
            "tiempo_sesion": 60
        })
    }

@router.put("", response_model=ConfigurationSchema)
async def update_configuracion(config: ConfigurationSchema, db: Session = Depends(get_db)):
    farmacia = db.query(Farmacia).first()
    if not farmacia:
        raise HTTPException(status_code=404, detail="Farmacia no encontrada")
    
    farmacia.configuracion = config.dict()
    # Also update basic farmacia data for consistency
    farmacia.nombre = config.general.nombre_farmacia
    farmacia.direccion = config.general.direccion
    farmacia.telefono = config.general.telefono
    farmacia.email = config.general.email
    
    db.commit()
    db.refresh(farmacia)
    return farmacia.configuracion

# --- User Management (Staging CRUD) ---

@router.get("/usuarios", response_model=List[UsuarioRead])
async def get_usuarios(db: Session = Depends(get_db)):
    return db.query(Usuario).all()

@router.post("/usuarios", response_model=UsuarioRead)
async def create_usuario(user_in: UsuarioCreate, db: Session = Depends(get_db)):
    # Check if username exists
    if db.query(Usuario).filter(Usuario.username == user_in.username).first():
        raise HTTPException(status_code=400, detail="Usuario ya existe")
    
    farmacia = db.query(Farmacia).first()
    
    new_user = Usuario(
        id=uuid.uuid4(),
        farmacia_id=farmacia.id,
        username=user_in.username,
        email=user_in.email,
        nombre_completo=user_in.nombre_completo,
        password_hash=get_password_hash(user_in.password),
        rol=user_in.rol,
        activo=user_in.activo
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.put("/usuarios/{user_id}", response_model=UsuarioRead)
async def update_usuario(user_id: UUID, user_in: UsuarioUpdate, db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    update_data = user_in.dict(exclude_unset=True)
    if "password" in update_data:
        user.password_hash = get_password_hash(update_data.pop("password"))
    
    for field, value in update_data.items():
        setattr(user, field, value)
        
    db.commit()
    db.refresh(user)
    return user

@router.delete("/usuarios/{user_id}")
async def delete_usuario(user_id: UUID, db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    db.delete(user)
    db.commit()
    return {"message": "Usuario eliminado correctamente"}
