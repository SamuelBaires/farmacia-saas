import uuid
from datetime import datetime
from sqlalchemy import Column, String, Numeric, DateTime, Text, Enum, Boolean, ForeignKey, Integer, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class MetodoPago(str, enum.Enum):
    EFECTIVO = "EFECTIVO"
    TARJETA = "TARJETA"
    TRANSFERENCIA = "TRANSFERENCIA"
    MIXTO = "MIXTO"

class Venta(Base):
    __tablename__ = "ventas"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farmacia_id = Column(UUID(as_uuid=True), ForeignKey("farmacias.id"), nullable=False, index=True)
    usuario_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=False, index=True)
    cliente_id = Column(UUID(as_uuid=True), ForeignKey("clientes.id"), nullable=True, index=True)
    caja_id = Column(UUID(as_uuid=True), ForeignKey("cajas.id"), nullable=True)
    
    numero_venta = Column(String(50), unique=True, nullable=False)
    subtotal = Column(Numeric(10, 2), nullable=False)
    descuento = Column(Numeric(10, 2), default=0)
    total = Column(Numeric(10, 2), nullable=False)
    
    metodo_pago = Column(Enum(MetodoPago), nullable=False)
    referencia_pago = Column(String(100))
    
    requirio_receta = Column(Boolean, default=False)
    observaciones = Column(Text)
    
    fecha_venta = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    farmacia = relationship("Farmacia", back_populates="ventas")
    usuario = relationship("Usuario", back_populates="ventas")
    cliente = relationship("Cliente", back_populates="ventas")
    caja = relationship("Caja", back_populates="ventas")
    detalles = relationship("DetalleVenta", back_populates="venta", cascade="all, delete-orphan")

class DetalleVenta(Base):
    __tablename__ = "detalle_ventas"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    venta_id = Column(UUID(as_uuid=True), ForeignKey("ventas.id"), nullable=False)
    medicamento_id = Column(UUID(as_uuid=True), ForeignKey("medicamentos.id"), nullable=False)
    
    cantidad = Column(Integer, nullable=False)
    precio_unitario = Column(Numeric(10, 2), nullable=False)
    subtotal = Column(Numeric(10, 2), nullable=False)
    
    lote = Column(String(50))
    fecha_vencimiento = Column(Date)
    
    # Relationships
    venta = relationship("Venta", back_populates="detalles")
    medicamento = relationship("Medicamento", back_populates="detalles_venta")
