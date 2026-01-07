import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class Farmacia(Base):
    __tablename__ = "farmacias"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre = Column(String(200), nullable=False)
    nit = Column(String(20), unique=True, nullable=False)
    direccion = Column(String(500))
    telefono = Column(String(20))
    email = Column(String(100))
    registro_sanitario = Column(String(100))
    configuracion = Column(JSON, default={})
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    usuarios = relationship("Usuario", back_populates="farmacia")
    medicamentos = relationship("Medicamento", back_populates="farmacia")
    clientes = relationship("Cliente", back_populates="farmacia")
    proveedores = relationship("Proveedor", back_populates="farmacia")
    ventas = relationship("Venta", back_populates="farmacia")
    cajas = relationship("Caja", back_populates="farmacia")
