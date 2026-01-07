from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime
from app.models.user import RolUsuario

# Settings Schemas
class GeneralSettings(BaseModel):
    nombre_farmacia: str
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[EmailStr] = None
    moneda: str = "USD"
    zona_horaria: str = "America/El_Salvador"
    logo_url: Optional[str] = None

class SystemParameters(BaseModel):
    stock_minimo_defecto: int = 10
    dias_alerta_vencimiento: int = 60
    numeracion_comprobantes: str = "000001"
    impuestos_valor: float = 13.0

class POSSettings(BaseModel):
    lector_codigo_barras: bool = True
    tipo_impresora: str = "Térmica 80mm"
    metodos_pago_habilitados: List[str] = ["Efectivo", "Tarjeta", "Transferencia"]

class ReportPreferences(BaseModel):
    reportes_activos: bool = True
    formato_preferido: str = "pdf"
    correos_notificaciones: List[EmailStr] = []

class SecuritySettings(BaseModel):
    tiempo_sesion: int = 60 # minutos

class ConfigurationSchema(BaseModel):
    general: GeneralSettings
    parametros: SystemParameters
    pos: POSSettings
    reportes: ReportPreferences
    seguridad: SecuritySettings

# User Schemas for Management
class UsuarioBase(BaseModel):
    username: str
    email: EmailStr
    nombre_completo: str
    rol: RolUsuario
    activo: bool = True

class UsuarioCreate(UsuarioBase):
    password: str

class UsuarioUpdate(BaseModel):
    email: Optional[EmailStr] = None
    nombre_completo: Optional[str] = None
    rol: Optional[RolUsuario] = None
    activo: Optional[bool] = None
    password: Optional[str] = None

class UsuarioRead(UsuarioBase):
    id: UUID
    ultimo_acceso: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True
