import uuid
from datetime import datetime
from sqlalchemy import Column, Numeric, DateTime, Text, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class EstadoCaja(str, enum.Enum):
    ABIERTA = "ABIERTA"
    CERRADA = "CERRADA"
    PENDIENTE_REVISION = "PENDIENTE_REVISION"

class Caja(Base):
    __tablename__ = "cajas"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farmacia_id = Column(UUID(as_uuid=True), ForeignKey("farmacias.id"), nullable=False)
    usuario_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=False)
    
    monto_inicial = Column(Numeric(10, 2), nullable=False)
    monto_final = Column(Numeric(10, 2), nullable=True)
    monto_esperado = Column(Numeric(10, 2), nullable=True)
    diferencia = Column(Numeric(10, 2), nullable=True)
    
    fecha_apertura = Column(DateTime, default=datetime.utcnow)
    fecha_cierre = Column(DateTime, nullable=True)
    
    estado = Column(Enum(EstadoCaja), default=EstadoCaja.ABIERTA)
    observaciones = Column(Text)
    
    # Relationships
    farmacia = relationship("Farmacia", back_populates="cajas")
    usuario = relationship("Usuario", back_populates="cajas")
    ventas = relationship("Venta", back_populates="caja")
