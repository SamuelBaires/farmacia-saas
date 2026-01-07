from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, UUID4
from decimal import Decimal

class MedicamentoBase(BaseModel):
    codigo_barras: str
    nombre_comercial: str
    nombre_generico: Optional[str] = None
    lote: Optional[str] = None
    fecha_vencimiento: Optional[date] = None
    precio_compra: Decimal
    precio_venta: Decimal
    stock_actual: int = 0
    stock_minimo: int = 10
    es_controlado: bool = False
    requiere_receta: bool = False
    categoria: Optional[str] = None
    descripcion: Optional[str] = None

class MedicamentoCreate(MedicamentoBase):
    proveedor_id: Optional[UUID4] = None

class MedicamentoUpdate(BaseModel):
    nombre_comercial: Optional[str] = None
    nombre_generico: Optional[str] = None
    lote: Optional[str] = None
    fecha_vencimiento: Optional[date] = None
    precio_compra: Optional[Decimal] = None
    precio_venta: Optional[Decimal] = None
    stock_minimo: Optional[int] = None
    es_controlado: Optional[bool] = None
    requiere_receta: Optional[bool] = None
    categoria: Optional[str] = None
    descripcion: Optional[str] = None
    activo: Optional[bool] = None

class MedicamentoResponse(MedicamentoBase):
    id: UUID4
    farmacia_id: UUID4
    proveedor_id: Optional[UUID4]
    activo: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
