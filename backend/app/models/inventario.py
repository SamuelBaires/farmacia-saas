import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Numeric, DateTime, Text, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class TipoMovimiento(str, enum.Enum):
    ENTRADA = "ENTRADA"
    SALIDA = "SALIDA"
    AJUSTE_POSITIVO = "AJUSTE_POSITIVO"
    AJUSTE_NEGATIVO = "AJUSTE_NEGATIVO"
    VENCIMIENTO = "VENCIMIENTO"
    DEVOLUCION = "DEVOLUCION"

class MovimientoInventario(Base):
    __tablename__ = "movimientos_inventario"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farmacia_id = Column(UUID(as_uuid=True), ForeignKey("farmacias.id"), nullable=False, index=True)
    medicamento_id = Column(UUID(as_uuid=True), ForeignKey("medicamentos.id"), nullable=False, index=True)
    usuario_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=False)
    
    tipo_movimiento = Column(Enum(TipoMovimiento), nullable=False)
    cantidad = Column(Integer, nullable=False)
    precio_unitario = Column(Numeric(10, 2))
    referencia = Column(String(100))
    observaciones = Column(Text)
    
    fecha_movimiento = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    medicamento = relationship("Medicamento", back_populates="movimientos")
    usuario = relationship("Usuario", back_populates="movimientos_inventario")
