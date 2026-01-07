import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Boolean, DateTime, Numeric, Integer, Date, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class Medicamento(Base):
    __tablename__ = "medicamentos"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farmacia_id = Column(UUID(as_uuid=True), ForeignKey("farmacias.id"), nullable=False, index=True)
    proveedor_id = Column(UUID(as_uuid=True), ForeignKey("proveedores.id"), nullable=True)
    
    codigo_barras = Column(String(50), nullable=False, index=True)
    nombre_comercial = Column(String(200), nullable=False, index=True)
    nombre_generico = Column(String(200))
    lote = Column(String(50))
    fecha_vencimiento = Column(Date, index=True)
    
    precio_compra = Column(Numeric(10, 2), nullable=False)
    precio_venta = Column(Numeric(10, 2), nullable=False)
    
    stock_actual = Column(Integer, default=0, nullable=False)
    stock_minimo = Column(Integer, default=10, nullable=False)
    
    es_controlado = Column(Boolean, default=False, index=True)
    requiere_receta = Column(Boolean, default=False)
    
    categoria = Column(String(100))
    descripcion = Column(Text)
    
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    farmacia = relationship("Farmacia", back_populates="medicamentos")
    proveedor = relationship("Proveedor", back_populates="medicamentos")
    movimientos = relationship("MovimientoInventario", back_populates="medicamento")
    detalles_venta = relationship("DetalleVenta", back_populates="medicamento")
