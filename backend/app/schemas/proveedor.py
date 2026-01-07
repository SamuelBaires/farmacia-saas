from datetime import datetime
from typing import Optional
from pydantic import BaseModel, UUID4, EmailStr

class ProveedorBase(BaseModel):
    nombre: str
    nit: Optional[str] = None
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[EmailStr] = None
    contacto: Optional[str] = None

class ProveedorCreate(ProveedorBase):
    pass

class ProveedorUpdate(BaseModel):
    nombre: Optional[str] = None
    nit: Optional[str] = None
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[EmailStr] = None
    contacto: Optional[str] = None
    activo: Optional[bool] = None

class ProveedorResponse(ProveedorBase):
    id: UUID4
    farmacia_id: UUID4
    activo: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
