import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class Cliente(Base):
    __tablename__ = "clientes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farmacia_id = Column(UUID(as_uuid=True), ForeignKey("farmacias.id"), nullable=False)
    
    nombre = Column(String(200), nullable=False)
    nit_dui = Column(String(20), nullable=True)
    telefono = Column(String(20))
    email = Column(String(100))
    direccion = Column(String(500))
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    farmacia = relationship("Farmacia", back_populates="clientes")
    ventas = relationship("Venta", back_populates="cliente")
