from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, UUID4
from decimal import Decimal
from app.models.venta import MetodoPago

class DetalleVentaCreate(BaseModel):
    medicamento_id: UUID4
    cantidad: int
    precio_unitario: Decimal
    lote: Optional[str] = None
    fecha_vencimiento: Optional[date] = None

class DetalleVentaResponse(DetalleVentaCreate):
    id: UUID4
    venta_id: UUID4
    subtotal: Decimal
    
    class Config:
        from_attributes = True

class VentaCreate(BaseModel):
    cliente_id: Optional[UUID4] = None
    detalles: List[DetalleVentaCreate]
    metodo_pago: MetodoPago
    referencia_pago: Optional[str] = None
    descuento: Decimal = Decimal("0")
    requirio_receta: bool = False
    observaciones: Optional[str] = None

class VentaResponse(BaseModel):
    id: UUID4
    farmacia_id: UUID4
    usuario_id: UUID4
    cliente_id: Optional[UUID4]
    caja_id: Optional[UUID4]
    numero_venta: str
    subtotal: Decimal
    descuento: Decimal
    total: Decimal
    metodo_pago: MetodoPago
    referencia_pago: Optional[str]
    requirio_receta: bool
    observaciones: Optional[str]
    fecha_venta: datetime
    detalles: List[DetalleVentaResponse]
    
    class Config:
        from_attributes = True
