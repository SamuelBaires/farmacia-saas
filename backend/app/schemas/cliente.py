from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, UUID4, EmailStr

class ClienteBase(BaseModel):
    nombre: str
    nit_dui: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[EmailStr] = None
    direccion: Optional[str] = None

class ClienteCreate(ClienteBase):
    pass

class ClienteUpdate(BaseModel):
    nombre: Optional[str] = None
    nit_dui: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[EmailStr] = None
    direccion: Optional[str] = None

class ClienteResponse(ClienteBase):
    id: UUID4
    farmacia_id: UUID4
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
