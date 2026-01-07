import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy import ForeignKey
from app.core.database import Base

class Proveedor(Base):
    __tablename__ = "proveedores"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farmacia_id = Column(UUID(as_uuid=True), ForeignKey("farmacias.id"), nullable=False)
    
    nombre = Column(String(200), nullable=False)
    nit = Column(String(20))
    direccion = Column(String(500))
    telefono = Column(String(20))
    email = Column(String(100))
    contacto = Column(String(200))
    
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    farmacia = relationship("Farmacia", back_populates="proveedores")
    medicamentos = relationship("Medicamento", back_populates="proveedor")
