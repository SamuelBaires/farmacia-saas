from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, UUID4
from app.models.user import RolUsuario

# Base schemas
class UsuarioBase(BaseModel):
    username: str
    email: EmailStr
    nombre_completo: str
    rol: RolUsuario

class UsuarioCreate(UsuarioBase):
    password: str
    farmacia_id: UUID4

class UsuarioUpdate(BaseModel):
    email: Optional[EmailStr] = None
    nombre_completo: Optional[str] = None
    rol: Optional[RolUsuario] = None
    activo: Optional[bool] = None

class UsuarioResponse(UsuarioBase):
    id: UUID4
    farmacia_id: UUID4
    activo: bool
    ultimo_acceso: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True

# Auth schemas
class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UsuarioResponse
